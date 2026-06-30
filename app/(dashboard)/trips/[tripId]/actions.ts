"use server";

import { revalidatePath } from "next/cache";
import { PermissionError, requireUser } from "@/lib/auth/permissions";
import * as votingService from "@/lib/services/voting";
import { FinalizeTripSchema } from "@/lib/validation/voting";

type ActionResult = { success: true } | { success: false; error: string };

export async function startVotingAction(formData: FormData) {
  const tripId = formData.get("tripId");
  if (typeof tripId !== "string") return;

  const user = await requireUser();
  await votingService.startVoting(tripId, user.id);
  revalidatePath(`/trips/${tripId}`);
}

export async function finalizeTripAction(
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

  const parsed = FinalizeTripSchema.safeParse({
    tripId,
    finalDestinationId: formData.get("finalDestinationId"),
    finalDateOptionId: formData.get("finalDateOptionId"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await votingService.finalizeTrip(tripId, user.id, parsed.data);
  } catch (err) {
    if (err instanceof PermissionError) return { success: false, error: err.message };
    throw err;
  }

  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}
