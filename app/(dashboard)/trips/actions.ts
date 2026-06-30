"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { PermissionError, requireUser } from "@/lib/auth/permissions";
import * as tripsService from "@/lib/services/trips";
import { CreateTripSchema, UpdateTripSchema } from "@/lib/validation/trips";

type ActionResult = { success: true } | { success: false; error: string };

export async function createTripAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "You must be signed in." };
  }

  const parsed = CreateTripSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    currency: formData.get("currency") || "USD",
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const trip = await tripsService.createTrip(user.id, parsed.data);
  redirect(`/trips/${trip.id}`);
}

export async function updateTripAction(
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

  const parsed = UpdateTripSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    currency: formData.get("currency") || "USD",
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await tripsService.updateTrip(tripId, user.id, parsed.data);
  } catch (err) {
    if (err instanceof PermissionError) return { success: false, error: err.message };
    throw err;
  }

  revalidatePath(`/trips/${tripId}/settings`);
  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}

export async function deleteTripAction(formData: FormData) {
  const tripId = formData.get("tripId");
  if (typeof tripId !== "string") return;

  const user = await requireUser();
  await tripsService.deleteTrip(tripId, user.id);
  redirect("/trips");
}

export async function removeMemberAction(formData: FormData) {
  const tripId = formData.get("tripId");
  const memberUserId = formData.get("userId");
  if (typeof tripId !== "string" || typeof memberUserId !== "string") return;

  const user = await requireUser();
  await tripsService.removeMember(tripId, user.id, memberUserId);
  revalidatePath(`/trips/${tripId}/members`);
}
