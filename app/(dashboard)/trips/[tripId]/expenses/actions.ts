"use server";

import { revalidatePath } from "next/cache";
import { PermissionError, requireUser } from "@/lib/auth/permissions";
import * as expenseService from "@/lib/services/expenses";
import { CreateExpenseSchema, UpdateExpenseSchema } from "@/lib/validation/expenses";

type ActionResult = { success: true } | { success: false; error: string };

function parseExpenseFormData(formData: FormData) {
  const splitType = formData.get("splitType") as string;
  const base = {
    description: formData.get("description"),
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId") || undefined,
    paidById: formData.get("paidById"),
    splitType,
  };

  if (splitType === "EQUAL") {
    const raw = formData.get("participantIds");
    let participantIds: string[] = [];
    try {
      participantIds = JSON.parse(typeof raw === "string" ? raw : "[]");
    } catch {
      /* empty */
    }
    return { ...base, participantIds };
  }

  const raw = formData.get("participants");
  let participants: unknown[] = [];
  try {
    participants = JSON.parse(typeof raw === "string" ? raw : "[]");
  } catch {
    /* empty */
  }
  return { ...base, participants };
}

export async function createExpenseAction(
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

  const parsed = CreateExpenseSchema.safeParse(parseExpenseFormData(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await expenseService.createExpense(tripId, user.id, parsed.data);
  } catch (err) {
    if (err instanceof PermissionError) return { success: false, error: err.message };
    if (err instanceof Error) return { success: false, error: err.message };
    throw err;
  }

  revalidatePath(`/trips/${tripId}/expenses`);
  return { success: true };
}

export async function updateExpenseAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const tripId = formData.get("tripId");
  const expenseId = formData.get("expenseId");
  if (typeof tripId !== "string" || typeof expenseId !== "string") {
    return { success: false, error: "Missing trip or expense." };
  }

  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "You must be signed in." };
  }

  const parsed = UpdateExpenseSchema.safeParse(parseExpenseFormData(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await expenseService.updateExpense(tripId, user.id, expenseId, parsed.data);
  } catch (err) {
    if (err instanceof PermissionError) return { success: false, error: err.message };
    if (err instanceof Error) return { success: false, error: err.message };
    throw err;
  }

  revalidatePath(`/trips/${tripId}/expenses`);
  return { success: true };
}

export async function deleteExpenseAction(formData: FormData) {
  const tripId = formData.get("tripId");
  const expenseId = formData.get("expenseId");
  if (typeof tripId !== "string" || typeof expenseId !== "string") return;

  const user = await requireUser();
  await expenseService.deleteExpense(tripId, user.id, expenseId);
  revalidatePath(`/trips/${tripId}/expenses`);
}
