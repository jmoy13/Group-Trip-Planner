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

export interface TripSummary {
  id: string;
  name: string;
  description: string | null;
  status: string;
  role: "OWNER" | "MEMBER";
  memberCount: number;
  members: { id: string; name: string | null; image: string | null }[];
  location: string | null;
  dateRange: { start: Date; end: Date } | null;
  progress: { completed: number; total: number };
}

const FINALIZED_STATUSES = new Set(["FINALIZED", "COMPLETED", "ARCHIVED"]);

/** Richer version of `listUserTrips` for the trips-list dashboard card: pulls in a preview of
 *  member avatars, the current (or leading, pre-finalize) destination/dates, and a 6-step
 *  lifecycle progress count — the same steps the trip overview page's "Progress" stat card uses
 *  (see app/(dashboard)/trips/[tripId]/page.tsx), so the two surfaces agree on what "done" means. */
export async function listUserTripsWithSummary(userId: string): Promise<TripSummary[]> {
  const trips = await listUserTrips(userId);

  return Promise.all(
    trips.map(async (trip) => {
      const isFinalized = FINALIZED_STATUSES.has(trip.status);

      const [members, destinationCount, dateOptionCount, budgetCount, itineraryCount, leadingDestination, leadingDateOption] =
        await Promise.all([
          prisma.tripMembership.findMany({
            where: { tripId: trip.id, status: "ACCEPTED" },
            take: 5,
            orderBy: { joinedAt: "asc" },
            include: { user: { select: { id: true, name: true, image: true } } },
          }),
          prisma.destinationOption.count({ where: { tripId: trip.id } }),
          prisma.dateOption.count({ where: { tripId: trip.id } }),
          prisma.budgetCategory.count({ where: { tripId: trip.id } }),
          prisma.itineraryItem.count({ where: { tripId: trip.id } }),
          trip.finalDestinationId
            ? prisma.destinationOption.findUnique({
                where: { id: trip.finalDestinationId },
                select: { name: true },
              })
            : trip.status === "VOTING"
              ? prisma.destinationOption.findFirst({
                  where: { tripId: trip.id },
                  orderBy: { votes: { _count: "desc" } },
                  select: { name: true },
                })
              : null,
          trip.finalStartDate && trip.finalEndDate
            ? null
            : trip.status === "VOTING"
              ? prisma.dateOption.findFirst({
                  where: { tripId: trip.id },
                  orderBy: { votes: { _count: "desc" } },
                  select: { startDate: true, endDate: true },
                })
              : null,
        ]);

      const completedSteps = [
        true, // trip created
        destinationCount > 0,
        dateOptionCount > 0,
        isFinalized,
        budgetCount > 0,
        itineraryCount > 0,
      ].filter(Boolean).length;

      const dateRange =
        trip.finalStartDate && trip.finalEndDate
          ? { start: trip.finalStartDate, end: trip.finalEndDate }
          : leadingDateOption
            ? { start: leadingDateOption.startDate, end: leadingDateOption.endDate }
            : null;

      return {
        id: trip.id,
        name: trip.name,
        description: trip.description,
        status: trip.status,
        role: trip.memberships[0]?.role ?? "MEMBER",
        memberCount: trip._count.memberships,
        members: members.map((m) => ({ id: m.userId, name: m.user.name, image: m.user.image })),
        location: leadingDestination?.name ?? null,
        dateRange,
        progress: { completed: completedSteps, total: 6 },
      };
    })
  );
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
