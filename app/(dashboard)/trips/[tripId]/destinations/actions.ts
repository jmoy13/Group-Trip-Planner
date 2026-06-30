"use server";

import { revalidatePath } from "next/cache";
import { PermissionError, requireUser } from "@/lib/auth/permissions";
import * as votingService from "@/lib/services/voting";
import { ProposeDestinationSchema } from "@/lib/validation/voting";

type ActionResult = { success: true } | { success: false; error: string };

export async function proposeDestinationAction(
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

  const parsed = ProposeDestinationSchema.safeParse({
    tripId,
    name: formData.get("name"),
    notes: formData.get("notes"),
    imageUrl: formData.get("imageUrl"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await votingService.proposeDestination(tripId, user.id, parsed.data);
  } catch (err) {
    if (err instanceof PermissionError) return { success: false, error: err.message };
    throw err;
  }

  revalidatePath(`/trips/${tripId}/destinations`);
  return { success: true };
}

export async function voteDestinationAction(formData: FormData) {
  const tripId = formData.get("tripId");
  const destinationId = formData.get("optionId");
  if (typeof tripId !== "string" || typeof destinationId !== "string") return;

  const user = await requireUser();
  await votingService.castDestinationVote(tripId, user.id, destinationId);
  revalidatePath(`/trips/${tripId}/destinations`);
}
