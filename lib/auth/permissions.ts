import "server-only";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export class UnauthenticatedError extends Error {
  constructor(message = "You must be signed in.") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export class PermissionError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "PermissionError";
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}

export function getTripMembership(tripId: string, userId: string) {
  return prisma.tripMembership.findUnique({
    where: { tripId_userId: { tripId, userId } },
  });
}

/** Throws unless the user has an ACCEPTED membership on the trip. */
export async function requireTripMembership(tripId: string, userId: string) {
  const membership = await getTripMembership(tripId, userId);
  if (!membership || membership.status !== "ACCEPTED") {
    throw new PermissionError("You are not a member of this trip.");
  }
  return membership;
}

/** Throws unless the user is the OWNER of the trip. */
export async function requireTripOwner(tripId: string, userId: string) {
  const membership = await requireTripMembership(tripId, userId);
  if (membership.role !== "OWNER") {
    throw new PermissionError("Only the trip owner can do that.");
  }
  return membership;
}
