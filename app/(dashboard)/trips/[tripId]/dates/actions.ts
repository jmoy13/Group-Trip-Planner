"use server";

import { revalidatePath } from "next/cache";
import { PermissionError, requireUser } from "@/lib/auth/permissions";
import * as votingService from "@/lib/services/voting";
import { ProposeDateOptionSchema } from "@/lib/validation/voting";

type ActionResult = { success: true } | { success: false; error: string };

export async function proposeDateAction(
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

  const parsed = ProposeDateOptionSchema.safeParse({
    tripId,
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await votingService.proposeDateOption(tripId, user.id, parsed.data);
  } catch (err) {
    if (err instanceof PermissionError) return { success: false, error: err.message };
    throw err;
  }

  revalidatePath(`/trips/${tripId}/dates`);
  return { success: true };
}

export async function voteDateAction(formData: FormData) {
  const tripId = formData.get("tripId");
  const dateOptionId = formData.get("optionId");
  if (typeof tripId !== "string" || typeof dateOptionId !== "string") return;

  const user = await requireUser();
  await votingService.castDateVote(tripId, user.id, dateOptionId);
  revalidatePath(`/trips/${tripId}/dates`);
}
