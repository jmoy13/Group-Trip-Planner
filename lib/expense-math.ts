// Pure, dependency-free money math — no Prisma, no "server-only" import, so this file is
// directly unit-testable in isolation (see lib/expense-math.test.ts).
//
// Convention: every amount in this file is an INTEGER number of cents. Never use floats for
// money. Convert to/from Prisma's Decimal only at the service-layer boundary (see
// decimalToCents / centsToDecimalString below).


export function distributeCentsByWeights(totalCents: number, weights: number[]): number[] {
  if(weights.length === 0) return [];
  if(totalCents === 0) return new Array(weights.length).fill(0);
  const sumWeights = weights.reduce((sum, weight) => sum + weight, 0);
  if (sumWeights === 0) {
    throw new Error("Sum of weights cannot be zero when totalCents is non-zero");
  }

  const result = new Array(weights.length).fill(0);
  let distributedSum = 0;

  // Track original index, floored val, and remainder for sorting tie breakers
  const items = weights.map((weight, index) => {
    const exactShare = (totalCents * weight) / sumWeights;
    const flooredShare = Math.floor(exactShare);
    result[index] = flooredShare;
    distributedSum += flooredShare;
    
    const remainder = (totalCents * weight) % sumWeights; // Calculate remainder
    return { index, remainder };
  });

  let leftoverCents = totalCents - distributedSum;
  
  items.sort((a,b) => {
    if (b.remainder !== a.remainder) {
      return b.remainder - a.remainder; // Sort by remainder descending
    }
    return a.index - b.index; // Tie-breaker: original index ascending
  });
  // Distribute the leftover cents 1-by-1 to the largest remainders
  for (let i = 0; i < leftoverCents; i++) {
    const targetIndex = items[i].index;
    result[targetIndex] += 1;
  }

  return result;
}

export interface ExpenseRecord {
  paidByUserId: string;
  amountCents: number;
}

export interface ShareRecord {
  userId: string;
  amountOwedCents: number;
}

export interface Balance {
  userId: string;
  netBalanceCents: number;
}

export function computeBalances(expenses: ExpenseRecord[], shares: ShareRecord[]): Balance[] {
  const balanceMap = new Map<string, number>();
  
  //Process money paid out (Creditor)
  for (const expense of expenses) {
    const current = balanceMap.get(expense.paidByUserId) || 0;
    balanceMap.set(expense.paidByUserId, current + expense.amountCents);
  }

  //Process money owed (Debtor)
  for (const share of shares) {
    const current = balanceMap.get(share.userId) || 0;
    balanceMap.set(share.userId, current - share.amountOwedCents);
  }

  // Convert the map to an array of Balance objects
  const balances: Balance[] = [];
  for (const [userId, netBalanceCents] of balanceMap.entries()) {
    balances.push({ userId, netBalanceCents });
  }

  return balances;
}

export interface SettlementTransaction {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
}
  
export function simplifyDebts(balances: Balance[]): SettlementTransaction[] {
  // Work on a mutable deep copy of balances, ignoring anyone who is already settled (0)
  const activeBalances = balances
    .map(b => ({ ...b }))
    .filter(b => b.netBalanceCents !== 0);

  const transactions: SettlementTransaction[] = [];

  while (activeBalances.length > 0) {
    // Sort so that the biggest debtor is first, and the biggest creditor is last
    activeBalances.sort((a, b) => a.netBalanceCents - b.netBalanceCents);

    const debtor = activeBalances[0];
    const creditor = activeBalances[activeBalances.length - 1];

    // Sanity check: if min is positive or max is negative, the balances don't sum to 0
    if (debtor.netBalanceCents >= 0 || creditor.netBalanceCents <= 0) {
      break; 
    }

    // Determine the settlement amount (the maximum possible between the two)
    const amountToSettle = Math.min(-debtor.netBalanceCents, creditor.netBalanceCents);

    transactions.push({
      fromUserId: debtor.userId,
      toUserId: creditor.userId,
      amountCents: amountToSettle
    });

    // Apply the transaction
    debtor.netBalanceCents += amountToSettle;
    creditor.netBalanceCents -= amountToSettle;

    // Filter out anyone who has hit exactly 0
    for (let i = activeBalances.length - 1; i >= 0; i--) {
      if (activeBalances[i].netBalanceCents === 0) {
        activeBalances.splice(i, 1);
      }
    }
  }

  return transactions;
}

export function decimalToCents(amount: string | number): number {
  // Force it safely to a clean string format
  const str = typeof amount === 'number' ? amount.toFixed(10) : amount.trim();
  
  const isNegative = str.startsWith('-');
  const cleanStr = isNegative ? str.slice(1) : str;

  const parts = cleanStr.split('.');
  const integerPart = parts[0] || '0';
  let fractionalPart = parts[1] || '00';

  // Format fractional part to exactly 2 places (truncate any sub-cents, or pad zeros)
  fractionalPart = fractionalPart.padEnd(2, '0').slice(0, 2);

  const totalCents = parseInt(integerPart, 10) * 100 + parseInt(fractionalPart, 10);
  
  return isNegative ? -totalCents : totalCents;
}

export function centsToDecimalString(cents: number): string {
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);

  const dollars = Math.floor(absCents / 100);
  const remainingCents = absCents % 100;

  const centsStr = remainingCents.toString().padStart(2, '0');
  
  return `${isNegative ? '-' : ''}${dollars}.${centsStr}`;
}
