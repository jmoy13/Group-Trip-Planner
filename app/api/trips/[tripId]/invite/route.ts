import { NextRequest, NextResponse } from "next/server";
import { PermissionError, requireUser } from "@/lib/auth/permissions";
import { createInvitation } from "@/lib/services/invitations";
import { InviteMemberSchema } from "@/lib/validation/trips";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;

  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = InviteMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  try {
    const invitation = await createInvitation(tripId, user.id, parsed.data.email);
    return NextResponse.json({ id: invitation.id, email: invitation.email }, { status: 201 });
  } catch (err) {
    if (err instanceof PermissionError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
