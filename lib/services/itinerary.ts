import "server-only";
import { prisma } from "@/lib/db";
import { PermissionError, requireTripFinalized, requireTripMembership } from "@/lib/auth/permissions";
import type { CreateItineraryItemInput, UpdateItineraryItemInput } from "@/lib/validation/itinerary";

export async function listItineraryItems(tripId: string, userId: string) {
  await requireTripMembership(tripId, userId);
  return prisma.itineraryItem.findMany({
    where: { tripId },
    include: { createdBy: { select: { id: true, name: true } } },
    orderBy: [{ dayIndex: "asc" }, { order: "asc" }],
  });
}

export async function createItineraryItem(
  tripId: string,
  userId: string,
  input: CreateItineraryItemInput
) {
  await requireTripMembership(tripId, userId);
  await requireTripFinalized(tripId, userId);

  const lastInDay = await prisma.itineraryItem.findFirst({
    where: { tripId, dayIndex: input.dayIndex },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  return prisma.itineraryItem.create({
    data: {
      tripId,
      title: input.title,
      description: input.description,
      location: input.location,
      startTime: input.startTime,
      endTime: input.endTime,
      dayIndex: input.dayIndex,
      order: (lastInDay?.order ?? -1) + 1,
      createdById: userId,
    },
  });
}

async function requireItemEditAccess(tripId: string, userId: string, itemId: string) {
  const membership = await requireTripMembership(tripId, userId);
  const item = await prisma.itineraryItem.findFirst({ where: { id: itemId, tripId } });
  if (!item) throw new PermissionError("Itinerary item not found for this trip.");
  if (item.createdById !== userId && membership.role !== "OWNER") {
    throw new PermissionError("Only the item's creator or the trip owner can edit this item.");
  }
  return item;
}

export async function updateItineraryItem(
  tripId: string,
  userId: string,
  itemId: string,
  input: UpdateItineraryItemInput
) {
  await requireItemEditAccess(tripId, userId, itemId);

  return prisma.itineraryItem.update({
    where: { id: itemId },
    data: {
      title: input.title,
      description: input.description,
      location: input.location,
      startTime: input.startTime,
      endTime: input.endTime,
      dayIndex: input.dayIndex,
    },
  });
}

export async function deleteItineraryItem(tripId: string, userId: string, itemId: string) {
  await requireItemEditAccess(tripId, userId, itemId);
  await prisma.itineraryItem.delete({ where: { id: itemId } });
}

/** Persists a new within-day order after a drag-and-drop reorder. Any member may reorder. */
export async function reorderItineraryItems(
  tripId: string,
  userId: string,
  dayIndex: number,
  orderedItemIds: string[]
) {
  await requireTripMembership(tripId, userId);

  const items = await prisma.itineraryItem.findMany({
    where: { tripId, dayIndex, id: { in: orderedItemIds } },
    select: { id: true },
  });
  if (items.length !== orderedItemIds.length) {
    throw new PermissionError("Itinerary items do not match this trip and day.");
  }

  await prisma.$transaction(
    orderedItemIds.map((id, index) =>
      prisma.itineraryItem.update({ where: { id }, data: { order: index } })
    )
  );
}
