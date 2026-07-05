"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/permissions";
import { acceptInvitation, declineInvitation } from "@/lib/services/invitations";

export async function acceptInvitationAction(formData: FormData) {
  const token = formData.get("token");
  if (typeof token !== "string") return;

  const user = await requireUser();
  if (!user.email) return;

  const trip = await acceptInvitation(token, user.id, user.email);
  redirect(`/trips/${trip.id}`);
}

export async function declineInvitationAction(formData: FormData) {
  const token = formData.get("token");
  if (typeof token !== "string") return;

  const user = await requireUser();
  if (!user.email) return;

  await declineInvitation(token, user.email);
  redirect("/invites");
}
