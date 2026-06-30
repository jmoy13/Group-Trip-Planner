"use server";

import { revalidatePath } from "next/cache";
import { PermissionError, requireUser } from "@/lib/auth/permissions";
import * as itineraryService from "@/lib/services/itinerary";
import { CreateItineraryItemSchema, UpdateItineraryItemSchema } from "@/lib/validation/itinerary";

type ActionResult = { success: true } | { success: false; error: string };

export async function createItineraryItemAction(
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

  const parsed = CreateItineraryItemSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    dayIndex: formData.get("dayIndex"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await itineraryService.createItineraryItem(tripId, user.id, parsed.data);
  } catch (err) {
    if (err instanceof PermissionError) return { success: false, error: err.message };
    throw err;
  }

  revalidatePath(`/trips/${tripId}/itinerary`);
  return { success: true };
}

export async function updateItineraryItemAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const tripId = formData.get("tripId");
  const itemId = formData.get("itemId");
  if (typeof tripId !== "string" || typeof itemId !== "string") {
    return { success: false, error: "Missing trip or item." };
  }

  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "You must be signed in." };
  }

  const parsed = UpdateItineraryItemSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    dayIndex: formData.get("dayIndex"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await itineraryService.updateItineraryItem(tripId, user.id, itemId, parsed.data);
  } catch (err) {
    if (err instanceof PermissionError) return { success: false, error: err.message };
    throw err;
  }

  revalidatePath(`/trips/${tripId}/itinerary`);
  return { success: true };
}

export async function deleteItineraryItemAction(formData: FormData) {
  const tripId = formData.get("tripId");
  const itemId = formData.get("itemId");
  if (typeof tripId !== "string" || typeof itemId !== "string") return;

  const user = await requireUser();
  await itineraryService.deleteItineraryItem(tripId, user.id, itemId);
  revalidatePath(`/trips/${tripId}/itinerary`);
}

export async function reorderItineraryItemsAction(
  tripId: string,
  dayIndex: number,
  orderedItemIds: string[]
) {
  const user = await requireUser();
  await itineraryService.reorderItineraryItems(tripId, user.id, dayIndex, orderedItemIds);
  revalidatePath(`/trips/${tripId}/itinerary`);
}
