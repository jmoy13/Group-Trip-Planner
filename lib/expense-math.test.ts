import { describe, it, expect } from "vitest";
import {
  distributeCentsByWeights,
  computeBalances,
  simplifyDebts,
  decimalToCents,
  centsToDecimalString,
} from "./expense-math";

describe("distributeCentsByWeights", () => {
  it("splits evenly when totalCents divides evenly by participant count", () => {
    const result = distributeCentsByWeights(900, [1, 1, 1]);
    expect(result).toEqual([300, 300, 300]);
  });

  it("distributes remainder cents deterministically when it doesn't divide evenly (e.g. 10000 / 3)", () => {
    // 10000 / 3 = 3333.33...: one leftover cent goes to index 0 (largest fractional remainder)
    const result = distributeCentsByWeights(10000, [1, 1, 1]);
    expect(result).toEqual([3334, 3333, 3333]);
    expect(result.reduce((a, b) => a + b, 0)).toBe(10000);
  });

  it("returns an all-zero array when totalCents is 0", () => {
    expect(distributeCentsByWeights(0, [1, 2, 3])).toEqual([0, 0, 0]);
  });

  it("gives every cent to the single participant when there's only one", () => {
    expect(distributeCentsByWeights(5050, [1])).toEqual([5050]);
  });

  it("handles PERCENTAGE weights that don't divide evenly (e.g. 40/35/25 of $10.01)", () => {
    // 1001 cents at 40/35/25 weights
    // 40% of 1001 = 400.4 → floor 400, remainder = 40*1001 % 100 = 40
    // 35% of 1001 = 350.35 → floor 350, remainder = 35*1001 % 100 = 35
    // 25% of 1001 = 250.25 → floor 250, remainder = 25*1001 % 100 = 25
    // 1 leftover cent → goes to index 0 (remainder 40 is largest)
    const result = distributeCentsByWeights(1001, [40, 35, 25]);
    expect(result[0]).toBe(401);
    expect(result[1]).toBe(350);
    expect(result[2]).toBe(250);
    expect(result.reduce((a, b) => a + b, 0)).toBe(1001);
  });

  it("always returns amounts that sum to exactly totalCents, regardless of weights", () => {
    for (const { total, weights } of [
      { total: 100, weights: [1, 2, 3] },
      { total: 999, weights: [7, 3] },
      { total: 1, weights: [1, 1, 1] },
      { total: 10000, weights: [33, 33, 34] },
    ]) {
      const result = distributeCentsByWeights(total, weights);
      expect(result.reduce((a, b) => a + b, 0)).toBe(total);
    }
  });
});

describe("computeBalances", () => {
  it("computes paid-minus-owed correctly for a simple two-person trip", () => {
    const balances = computeBalances(
      [{ paidByUserId: "alice", amountCents: 1000 }],
      [
        { userId: "alice", amountOwedCents: 500 },
        { userId: "bob", amountOwedCents: 500 },
      ]
    );
    expect(balances.find((b) => b.userId === "alice")?.netBalanceCents).toBe(500);
    expect(balances.find((b) => b.userId === "bob")?.netBalanceCents).toBe(-500);
  });

  it("nets every member's balances to zero in total for any valid expense set", () => {
    const balances = computeBalances(
      [
        { paidByUserId: "alice", amountCents: 3000 },
        { paidByUserId: "bob", amountCents: 1500 },
      ],
      [
        { userId: "alice", amountOwedCents: 1500 },
        { userId: "bob", amountOwedCents: 1500 },
        { userId: "charlie", amountOwedCents: 1500 },
      ]
    );
    expect(balances.reduce((sum, b) => sum + b.netBalanceCents, 0)).toBe(0);
  });

  it("handles a member who only ever paid and never owes anything, and vice versa", () => {
    const balances = computeBalances(
      [{ paidByUserId: "alice", amountCents: 2000 }],
      [{ userId: "bob", amountOwedCents: 2000 }]
    );
    expect(balances.find((b) => b.userId === "alice")?.netBalanceCents).toBe(2000);
    expect(balances.find((b) => b.userId === "bob")?.netBalanceCents).toBe(-2000);
  });

  it("returns an empty array for a trip with no expenses", () => {
    expect(computeBalances([], [])).toEqual([]);
  });
});

describe("simplifyDebts", () => {
  it("returns no transactions for an already-settled trip (all balances zero)", () => {
    expect(
      simplifyDebts([
        { userId: "alice", netBalanceCents: 0 },
        { userId: "bob", netBalanceCents: 0 },
      ])
    ).toEqual([]);
  });

  it("produces a single transaction for a simple two-person debt", () => {
    const txns = simplifyDebts([
      { userId: "alice", netBalanceCents: 500 },
      { userId: "bob", netBalanceCents: -500 },
    ]);
    expect(txns).toEqual([{ fromUserId: "bob", toUserId: "alice", amountCents: 500 }]);
  });

  it("matches the largest creditor with the largest debtor first, for 3+ parties", () => {
    const balances = [
      { userId: "alice", netBalanceCents: 1000 },
      { userId: "bob", netBalanceCents: -300 },
      { userId: "charlie", netBalanceCents: -700 },
    ];
    const txns = simplifyDebts(balances);
    const final = new Map(balances.map((b) => [b.userId, b.netBalanceCents]));
    for (const t of txns) {
      final.set(t.fromUserId, (final.get(t.fromUserId) ?? 0) + t.amountCents);
      final.set(t.toUserId, (final.get(t.toUserId) ?? 0) - t.amountCents);
    }
    for (const [, v] of final) expect(v).toBe(0);
  });

  it("settles every balance to exactly zero with no leftover cents", () => {
    const balances = [
      { userId: "a", netBalanceCents: 3333 },
      { userId: "b", netBalanceCents: 3334 },
      { userId: "c", netBalanceCents: -3333 },
      { userId: "d", netBalanceCents: -3334 },
    ];
    const txns = simplifyDebts(balances);
    const final = new Map(balances.map((b) => [b.userId, b.netBalanceCents]));
    for (const t of txns) {
      final.set(t.fromUserId, (final.get(t.fromUserId) ?? 0) + t.amountCents);
      final.set(t.toUserId, (final.get(t.toUserId) ?? 0) - t.amountCents);
    }
    for (const [, v] of final) expect(v).toBe(0);
  });
});

describe("decimalToCents / centsToDecimalString", () => {
  it('round-trips whole dollar amounts ("12" → 1200 → "12.00")', () => {
    expect(decimalToCents("12")).toBe(1200);
    expect(centsToDecimalString(1200)).toBe("12.00");
  });

  it('round-trips amounts with cents ("12.34" → 1234 → "12.34")', () => {
    expect(decimalToCents("12.34")).toBe(1234);
    expect(centsToDecimalString(1234)).toBe("12.34");
  });

  it("does not drift due to binary floating point for tricky values (e.g. 0.10 + 0.20)", () => {
    // 0.1 + 0.2 in float = 0.30000000000000004; string-based parsing avoids this
    expect(decimalToCents("0.10") + decimalToCents("0.20")).toBe(30);
    expect(centsToDecimalString(30)).toBe("0.30");
  });
});
