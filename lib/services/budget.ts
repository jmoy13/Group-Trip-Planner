import "server-only";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  PermissionError,
  requireTripFinalized,
  requireTripMembership,
  requireTripOwner,
} from "@/lib/auth/permissions";
import type { CreateBudgetCategoryInput, UpdateBudgetCategoryInput } from "@/lib/validation/budget";

export async function listBudgetCategories(tripId: string, userId: string) {
  await requireTripMembership(tripId, userId);
  return prisma.budgetCategory.findMany({
    where: { tripId },
    orderBy: { name: "asc" },
  });
}

export async function createBudgetCategory(
  tripId: string,
  userId: string,
  input: CreateBudgetCategoryInput
) {
  await requireTripOwner(tripId, userId);
  await requireTripFinalized(tripId, userId);
  return prisma.budgetCategory.create({
    data: {
      tripId,
      name: input.name,
      plannedAmount: new Prisma.Decimal(input.plannedAmount),
    },
  });
}

export async function updateBudgetCategory(
  tripId: string,
  userId: string,
  categoryId: string,
  input: UpdateBudgetCategoryInput
) {
  await requireTripOwner(tripId, userId);

  const category = await prisma.budgetCategory.findFirst({ where: { id: categoryId, tripId } });
  if (!category) throw new PermissionError("Budget category not found for this trip.");

  return prisma.budgetCategory.update({
    where: { id: categoryId },
    data: { name: input.name, plannedAmount: new Prisma.Decimal(input.plannedAmount) },
  });
}

export async function deleteBudgetCategory(tripId: string, userId: string, categoryId: string) {
  await requireTripOwner(tripId, userId);

  const category = await prisma.budgetCategory.findFirst({ where: { id: categoryId, tripId } });
  if (!category) throw new PermissionError("Budget category not found for this trip.");

  await prisma.budgetCategory.delete({ where: { id: categoryId } });
}

/** Returns a map of categoryId → actual amount spent (as a plain number). The special key
 *  `"__uncategorized__"` holds the total of expenses with no category. */
export async function getBudgetActuals(tripId: string, userId: string) {
  await requireTripMembership(tripId, userId);
  const rows = await prisma.expense.groupBy({
    by: ["categoryId"],
    where: { tripId },
    _sum: { amount: true },
  });
  return rows.reduce((map, row) => {
    const key = row.categoryId ?? "__uncategorized__";
    map.set(key, row._sum.amount?.toNumber() ?? 0);
    return map;
  }, new Map<string, number>());
}
