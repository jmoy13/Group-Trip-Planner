import "server-only";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { PermissionError, requireTripOwner } from "@/lib/auth/permissions";
import { sendInvitationEmail } from "@/lib/services/email";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createInvitation(tripId: string, inviterUserId: string, email: string) {
  await requireTripOwner(tripId, inviterUserId);

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new PermissionError("Trip not found.");

  const existingMember = await prisma.tripMembership.findFirst({
    where: { tripId, status: "ACCEPTED", user: { email } },
  });
  if (existingMember) {
    throw new PermissionError("That person is already a member of this trip.");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

  const existingInvitation = await prisma.tripInvitation.findFirst({
    where: { tripId, email, status: "INVITED" },
  });

  const invitation = existingInvitation
    ? await prisma.tripInvitation.update({
        where: { id: existingInvitation.id },
        data: { token, expiresAt },
      })
    : await prisma.tripInvitation.create({
        data: { tripId, email, token, invitedBy: inviterUserId, expiresAt },
      });

  await sendInvitationEmail({ to: email, tripName: trip.name, token });

  return invitation;
}

export function getInvitationByToken(token: string) {
  return prisma.tripInvitation.findUnique({
    where: { token },
    include: { trip: { select: { id: true, name: true } } },
  });
}

/** Pending, unexpired invitations addressed to this email — the in-app "Invites" inbox. */
export function listPendingInvitationsForUser(email: string) {
  return prisma.tripInvitation.findMany({
    where: { email, status: "INVITED", expiresAt: { gt: new Date() } },
    include: { trip: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/** Count only, for sidebar badges — avoids fetching full invitation rows just to show a number. */
export function countPendingInvitationsForUser(email: string) {
  return prisma.tripInvitation.count({
    where: { email, status: "INVITED", expiresAt: { gt: new Date() } },
  });
}

/** Small preview (trip dates + inviter name) for the trips-list dashboard's Invites rail —
 *  `TripInvitation.invitedBy` is a plain userId string, not a Prisma relation (see claude.md's
 *  decisions log on why `proposedBy`/`invitedBy`-style fields stay plain strings), so the
 *  inviter's name is resolved with one extra batched lookup rather than a join. */
export async function listPendingInvitationsForUserPreview(email: string, limit = 2) {
  const invitations = await prisma.tripInvitation.findMany({
    where: { email, status: "INVITED", expiresAt: { gt: new Date() } },
    include: {
      trip: { select: { id: true, name: true, finalStartDate: true, finalEndDate: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const inviterIds = [...new Set(invitations.map((i) => i.invitedBy))];
  const inviters = await prisma.user.findMany({
    where: { id: { in: inviterIds } },
    select: { id: true, name: true },
  });
  const inviterNames = new Map(inviters.map((u) => [u.id, u.name]));

  return invitations.map((invitation) => ({
    ...invitation,
    inviterName: inviterNames.get(invitation.invitedBy) ?? "Someone",
  }));
}

/** Outstanding (not yet accepted/declined) invitations for a trip — owner-only, since invitee
 *  email addresses are sensitive per the security checklist in claude.md §7. Used by the trip
 *  overview's Members panel to show "Pending" rows alongside accepted members. */
export async function listPendingTripInvitations(tripId: string, userId: string) {
  await requireTripOwner(tripId, userId);
  return prisma.tripInvitation.findMany({
    where: { tripId, status: "INVITED", expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
}

export async function declineInvitation(token: string, userEmail: string) {
  const invitation = await getInvitationByToken(token);
  if (!invitation) throw new PermissionError("This invitation link is invalid.");
  if (invitation.status !== "INVITED") {
    throw new PermissionError("This invitation has already been used.");
  }
  if (invitation.email !== userEmail) {
    throw new PermissionError(
      `This invitation was sent to ${invitation.email}. Sign in with that email to decline it.`
    );
  }

  await prisma.tripInvitation.update({
    where: { id: invitation.id },
    data: { status: "DECLINED" },
  });
}

export async function acceptInvitation(token: string, userId: string, userEmail: string) {
  const invitation = await getInvitationByToken(token);
  if (!invitation) throw new PermissionError("This invitation link is invalid.");
  if (invitation.status !== "INVITED") {
    throw new PermissionError("This invitation has already been used.");
  }
  if (invitation.expiresAt < new Date()) {
    throw new PermissionError("This invitation has expired.");
  }
  if (invitation.email !== userEmail) {
    throw new PermissionError(
      `This invitation was sent to ${invitation.email}. Sign in with that email to accept it.`
    );
  }

  const trip = await prisma.$transaction(async (tx) => {
    await tx.tripMembership.upsert({
      where: { tripId_userId: { tripId: invitation.tripId, userId } },
      create: { tripId: invitation.tripId, userId, role: "MEMBER", status: "ACCEPTED" },
      update: { status: "ACCEPTED" },
    });
    await tx.tripInvitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });
    return tx.trip.findUniqueOrThrow({ where: { id: invitation.tripId } });
  });

  return trip;
}
