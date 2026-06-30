import "server-only";
import { prisma } from "@/lib/db";
import { PermissionError, requireTripMembership, requireTripOwner } from "@/lib/auth/permissions";
import type { CreateTripInput, UpdateTripInput } from "@/lib/validation/trips";

export function createTrip(userId: string, data: CreateTripInput) {
  return prisma.trip.create({
    data: {
      name: data.name,
      description: data.description,
      currency: data.currency,
      memberships: {
        create: { userId, role: "OWNER", status: "ACCEPTED" },
      },
    },
  });
}

export function listUserTrips(userId: string) {
  return prisma.trip.findMany({
    where: { memberships: { some: { userId, status: "ACCEPTED" } } },
    orderBy: { createdAt: "desc" },
    include: {
      memberships: { where: { userId }, select: { role: true } },
      _count: { select: { memberships: { where: { status: "ACCEPTED" } } } },
    },
  });
}

export async function getTripForMember(tripId: string, userId: string) {
  await requireTripMembership(tripId, userId);
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new PermissionError("Trip not found.");
  return trip;
}

export async function updateTrip(tripId: string, userId: string, data: UpdateTripInput) {
  await requireTripOwner(tripId, userId);
  return prisma.trip.update({
    where: { id: tripId },
    data: {
      name: data.name,
      description: data.description,
      currency: data.currency,
    },
  });
}

export async function deleteTrip(tripId: string, userId: string) {
  await requireTripOwner(tripId, userId);
  await prisma.trip.delete({ where: { id: tripId } });
}

export async function listMembers(tripId: string, userId: string) {
  await requireTripMembership(tripId, userId);
  return prisma.tripMembership.findMany({
    where: { tripId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { joinedAt: "asc" },
  });
}

export async function removeMember(tripId: string, actorUserId: string, targetUserId: string) {
  await requireTripOwner(tripId, actorUserId);

  const target = await prisma.tripMembership.findUnique({
    where: { tripId_userId: { tripId, userId: targetUserId } },
  });
  if (!target) throw new PermissionError("That member is not part of this trip.");
  if (target.role === "OWNER") {
    throw new PermissionError("The trip owner cannot be removed.");
  }

  await prisma.tripMembership.delete({
    where: { tripId_userId: { tripId, userId: targetUserId } },
  });
}
