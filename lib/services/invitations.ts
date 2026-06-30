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
