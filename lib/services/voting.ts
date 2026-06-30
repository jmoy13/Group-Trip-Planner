import "server-only";
import { prisma } from "@/lib/db";
import { PermissionError, requireTripMembership, requireTripOwner } from "@/lib/auth/permissions";
import type {
  FinalizeTripInput,
  ProposeDateOptionInput,
  ProposeDestinationInput,
} from "@/lib/validation/voting";

async function requireVotingPhase(tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { status: true },
  });

  if (!trip) {
    throw new PermissionError("Trip not found.");
  }

  if (trip.status !== "VOTING") {
    throw new PermissionError("This trip is not currently accepting votes.");
  }
}

export async function proposeDestination(
  tripId: string,
  userId: string,
  input: ProposeDestinationInput
) {
  await requireTripMembership(tripId, userId);
  await requireVotingPhase(tripId);

  return prisma.destinationOption.create({
    data: {
      tripId,
      name: input.name,
      notes: input.notes,
      imageUrl: input.imageUrl,
      proposedBy: userId,
    },
  });
}

export async function proposeDateOption(
  tripId: string,
  userId: string,
  input: ProposeDateOptionInput
) {
  await requireTripMembership(tripId, userId);
  await requireVotingPhase(tripId);

  return prisma.dateOption.create({
    data: {
      tripId,
      startDate: input.startDate,
      endDate: input.endDate,
      proposedBy: userId,
    },
  });
}

export async function castDestinationVote(tripId: string, userId: string, destinationId: string) {
  await requireTripMembership(tripId, userId);
  await requireVotingPhase(tripId);

  return prisma.$transaction(async (tx) => {
    // confirm the option actually belongs to this trip — don't trust the client
    const option = await tx.destinationOption.findFirst({
      where: { id: destinationId, tripId },
      select: { id: true },
    });
    if (!option) {
      throw new PermissionError("Destination option not found for this trip.");
    }

    // remove any existing vote by this user across ALL destinations in this trip
    await tx.destinationVote.deleteMany({
      where: { userId, destination: { tripId } },
    });

    return tx.destinationVote.create({
      data: { destinationId, userId },
    });
  });
}

export async function castDateVote(tripId: string, userId: string, dateOptionId: string) {
  await requireTripMembership(tripId, userId);
  await requireVotingPhase(tripId);

  return prisma.$transaction(async (tx) => {
    const option = await tx.dateOption.findFirst({
      where: { id: dateOptionId, tripId },
      select: { id: true },
    });
    if (!option) {
      throw new PermissionError("Date option not found for this trip.");
    }

    await tx.dateOptionVote.deleteMany({
      where: { userId, dateOption: { tripId } },
    });

    return tx.dateOptionVote.create({
      data: { dateOptionId, userId },
    });
  });
}

export async function listDestinationOptions(tripId: string, userId: string) {
  await requireTripMembership(tripId, userId);

  // no voting-phase gate — results stay viewable after finalize
  return prisma.destinationOption.findMany({
    where: { tripId },
    include: {
      votes: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function listDateOptions(tripId: string, userId: string) {
  await requireTripMembership(tripId, userId);

  return prisma.dateOption.findMany({
    where: { tripId },
    include: {
      votes: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
    orderBy: { startDate: "asc" },
  });
}

export async function finalizeTrip(tripId: string, userId: string, input: FinalizeTripInput) {
  await requireTripOwner(tripId, userId);

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new PermissionError("Trip not found.");
  if (trip.status !== "VOTING") {
    throw new PermissionError("Only a trip that's currently voting can be finalized.");
  }

  const [destination, dateOption] = await Promise.all([
    prisma.destinationOption.findFirst({ where: { id: input.finalDestinationId, tripId } }),
    prisma.dateOption.findFirst({ where: { id: input.finalDateOptionId, tripId } }),
  ]);
  if (!destination) throw new PermissionError("Selected destination is not part of this trip.");
  if (!dateOption) throw new PermissionError("Selected dates are not part of this trip.");

  return prisma.trip.update({
    where: { id: tripId },
    data: {
      status: "FINALIZED",
      finalDestinationId: destination.id,
      finalStartDate: dateOption.startDate,
      finalEndDate: dateOption.endDate,
    },
  });
}

export async function startVoting(tripId: string, userId: string) {
  await requireTripOwner(tripId, userId);

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new PermissionError("Trip not found.");
  if (trip.status !== "PLANNING") {
    throw new PermissionError("Voting can only be opened from the planning phase.");
  }

  return prisma.trip.update({ where: { id: tripId }, data: { status: "VOTING" } });
}
