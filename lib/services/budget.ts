import "server-only";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { PermissionError, requireTripMembership, requireTripOwner } from "@/lib/auth/permissions";
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
