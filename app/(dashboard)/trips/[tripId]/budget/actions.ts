"use server";

import { revalidatePath } from "next/cache";
import { PermissionError, requireUser } from "@/lib/auth/permissions";
import * as budgetService from "@/lib/services/budget";
import { CreateBudgetCategorySchema, UpdateBudgetCategorySchema } from "@/lib/validation/budget";

type ActionResult = { success: true } | { success: false; error: string };

export async function createBudgetCategoryAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const tripId = formData.get("tripId");
  if (typeof tripId !== "string") return { success: false, error: "Missing trip." };

  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "You must be signed in." };
  }

  const parsed = CreateBudgetCategorySchema.safeParse({
    name: formData.get("name"),
    plannedAmount: formData.get("plannedAmount"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await budgetService.createBudgetCategory(tripId, user.id, parsed.data);
  } catch (err) {
    if (err instanceof PermissionError) return { success: false, error: err.message };
    throw err;
  }

  revalidatePath(`/trips/${tripId}/budget`);
  return { success: true };
}

export async function updateBudgetCategoryAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const tripId = formData.get("tripId");
  const categoryId = formData.get("categoryId");
  if (typeof tripId !== "string" || typeof categoryId !== "string") {
    return { success: false, error: "Missing trip or category." };
  }

  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "You must be signed in." };
  }

  const parsed = UpdateBudgetCategorySchema.safeParse({
    name: formData.get("name"),
    plannedAmount: formData.get("plannedAmount"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await budgetService.updateBudgetCategory(tripId, user.id, categoryId, parsed.data);
  } catch (err) {
    if (err instanceof PermissionError) return { success: false, error: err.message };
    throw err;
  }

  revalidatePath(`/trips/${tripId}/budget`);
  return { success: true };
}

export async function deleteBudgetCategoryAction(formData: FormData) {
  const tripId = formData.get("tripId");
  const categoryId = formData.get("categoryId");
  if (typeof tripId !== "string" || typeof categoryId !== "string") return;

  const user = await requireUser();
  await budgetService.deleteBudgetCategory(tripId, user.id, categoryId);
  revalidatePath(`/trips/${tripId}/budget`);
}
