import "server-only";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { PermissionError, requireTripFinalized, requireTripMembership } from "@/lib/auth/permissions";
import type { CreateExpenseInput, UpdateExpenseInput } from "@/lib/validation/expenses";
import {
  distributeCentsByWeights,
  computeBalances,
  simplifyDebts,
  decimalToCents,
  centsToDecimalString,
} from "@/lib/expense-math";

export async function listExpenses(tripId: string, userId: string) {
  await requireTripMembership(tripId, userId);
  return prisma.expense.findMany({
    where: { tripId },
    include: {
      paidBy: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      shares: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function buildParticipantShares(
  totalCents: number,
  input: CreateExpenseInput,
  memberIds: Set<string>
): Promise<{ userId: string; amountOwedCents: number }[]> {
  if (input.splitType === "EQUAL") {
    for (const id of input.participantIds) {
      if (!memberIds.has(id)) throw new PermissionError(`User ${id} is not a member of this trip.`);
    }
    const amounts = distributeCentsByWeights(
      totalCents,
      new Array(input.participantIds.length).fill(1)
    );
    return input.participantIds.map((uid, i) => ({ userId: uid, amountOwedCents: amounts[i] }));
  }

  if (input.splitType === "EXACT_AMOUNT") {
    for (const p of input.participants) {
      if (!memberIds.has(p.userId))
        throw new PermissionError(`User ${p.userId} is not a member of this trip.`);
    }
    const amounts = input.participants.map((p) => decimalToCents(p.amount));
    const sharesSum = amounts.reduce((a, b) => a + b, 0);
    if (sharesSum !== totalCents) {
      throw new Error(
        `Amounts must sum to ${centsToDecimalString(totalCents)}, got ${centsToDecimalString(sharesSum)}.`
      );
    }
    return input.participants.map((p, i) => ({ userId: p.userId, amountOwedCents: amounts[i] }));
  }

  // PERCENTAGE
  for (const p of input.participants) {
    if (!memberIds.has(p.userId))
      throw new PermissionError(`User ${p.userId} is not a member of this trip.`);
  }
  const pctValues = input.participants.map((p) => Number(p.percentage));
  const pctSum = pctValues.reduce((a, b) => a + b, 0);
  if (Math.abs(pctSum - 100) > 0.009) {
    throw new Error(`Percentages must sum to 100%, got ${pctSum.toFixed(2)}%.`);
  }
  const amounts = distributeCentsByWeights(totalCents, pctValues);
  return input.participants.map((p, i) => ({ userId: p.userId, amountOwedCents: amounts[i] }));
}

export async function createExpense(tripId: string, userId: string, input: CreateExpenseInput) {
  await requireTripMembership(tripId, userId);
  await requireTripFinalized(tripId, userId);

  const rows = await prisma.tripMembership.findMany({
    where: { tripId, status: "ACCEPTED" },
    select: { userId: true },
  });
  const memberIds = new Set(rows.map((r) => r.userId));

  if (!memberIds.has(input.paidById))
    throw new PermissionError("Payer is not a member of this trip.");

  const totalCents = decimalToCents(input.amount);
  const shares = await buildParticipantShares(totalCents, input, memberIds);

  return prisma.$transaction(async (tx) => {
    return tx.expense.create({
      data: {
        tripId,
        description: input.description,
        amount: new Prisma.Decimal(input.amount),
        paidById: input.paidById,
        categoryId: input.categoryId ?? null,
        splitType: input.splitType,
        shares: {
          create: shares.map((s) => ({
            userId: s.userId,
            amountOwed: new Prisma.Decimal(centsToDecimalString(s.amountOwedCents)),
          })),
        },
      },
    });
  });
}

async function requireExpenseEditAccess(tripId: string, userId: string, expenseId: string) {
  const membership = await requireTripMembership(tripId, userId);
  const expense = await prisma.expense.findFirst({ where: { id: expenseId, tripId } });
  if (!expense) throw new PermissionError("Expense not found for this trip.");
  if (expense.paidById !== userId && membership.role !== "OWNER") {
    throw new PermissionError("Only the payer or the trip owner can edit this expense.");
  }
  return expense;
}

export async function updateExpense(
  tripId: string,
  userId: string,
  expenseId: string,
  input: UpdateExpenseInput
) {
  await requireExpenseEditAccess(tripId, userId, expenseId);

  const rows = await prisma.tripMembership.findMany({
    where: { tripId, status: "ACCEPTED" },
    select: { userId: true },
  });
  const memberIds = new Set(rows.map((r) => r.userId));

  if (!memberIds.has(input.paidById))
    throw new PermissionError("Payer is not a member of this trip.");

  const totalCents = decimalToCents(input.amount);
  const shares = await buildParticipantShares(totalCents, input, memberIds);

  return prisma.$transaction(async (tx) => {
    await tx.expenseShare.deleteMany({ where: { expenseId } });
    return tx.expense.update({
      where: { id: expenseId },
      data: {
        description: input.description,
        amount: new Prisma.Decimal(input.amount),
        paidById: input.paidById,
        categoryId: input.categoryId ?? null,
        splitType: input.splitType,
        shares: {
          create: shares.map((s) => ({
            userId: s.userId,
            amountOwed: new Prisma.Decimal(centsToDecimalString(s.amountOwedCents)),
          })),
        },
      },
    });
  });
}

export async function deleteExpense(tripId: string, userId: string, expenseId: string) {
  await requireExpenseEditAccess(tripId, userId, expenseId);
  await prisma.expense.delete({ where: { id: expenseId } });
}

export async function getBalances(tripId: string, userId: string) {
  await requireTripMembership(tripId, userId);

  const [expenses, shares] = await Promise.all([
    prisma.expense.findMany({ where: { tripId }, select: { paidById: true, amount: true } }),
    prisma.expenseShare.findMany({
      where: { expense: { tripId } },
      select: { userId: true, amountOwed: true },
    }),
  ]);

  const rawBalances = computeBalances(
    expenses.map((e) => ({
      paidByUserId: e.paidById,
      amountCents: decimalToCents(e.amount.toFixed(2)),
    })),
    shares.map((s) => ({
      userId: s.userId,
      amountOwedCents: decimalToCents(s.amountOwed.toFixed(2)),
    }))
  );

  const userIds = [...new Set(rawBalances.map((b) => b.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return rawBalances.map((b) => ({
    userId: b.userId,
    name: userMap.get(b.userId)?.name ?? null,
    netBalanceCents: b.netBalanceCents,
  }));
}

export async function getSettlement(tripId: string, userId: string) {
  await requireTripMembership(tripId, userId);

  const balances = await getBalances(tripId, userId);
  const userMap = new Map(balances.map((b) => [b.userId, b.name]));

  const txns = simplifyDebts(
    balances.map((b) => ({ userId: b.userId, netBalanceCents: b.netBalanceCents }))
  );

  return txns.map((t) => ({
    fromUserId: t.fromUserId,
    fromName: userMap.get(t.fromUserId) ?? null,
    toUserId: t.toUserId,
    toName: userMap.get(t.toUserId) ?? null,
    amountCents: t.amountCents,
  }));
}
