import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getServerSession } from "@/lib/auth/session";
import { getInvitationByToken } from "@/lib/services/invitations";
import { acceptInvitationAction } from "@/app/invite/actions";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return <InviteMessage title="Invalid invitation">This invitation link is invalid.</InviteMessage>;
  }
  if (invitation.status !== "INVITED") {
    return (
      <InviteMessage title="Invitation already used">
        This invitation has already been accepted or declined.
      </InviteMessage>
    );
  }
  if (invitation.expiresAt < new Date()) {
    return (
      <InviteMessage title="Invitation expired">
        This invitation has expired. Ask the trip owner to send a new one.
      </InviteMessage>
    );
  }

  const session = await getServerSession();
  const callbackUrl = `/invite/${token}`;

  if (!session) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-lg font-semibold text-zinc-900">You&apos;re invited!</h1>
        <p className="text-sm text-zinc-500">
          Join <span className="font-medium text-zinc-700">{invitation.trip.name}</span>. Sign in
          or create an account with <span className="font-medium">{invitation.email}</span> to
          accept.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href={`/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}&email=${encodeURIComponent(invitation.email)}`}
          >
            <Button>Create account</Button>
          </Link>
          <Link
            href={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}&email=${encodeURIComponent(invitation.email)}`}
          >
            <Button variant="secondary">Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (session.user.email !== invitation.email) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-lg font-semibold text-zinc-900">Wrong account</h1>
        <p className="text-sm text-zinc-500">
          This invitation was sent to{" "}
          <span className="font-medium text-zinc-700">{invitation.email}</span>, but you&apos;re
          signed in as <span className="font-medium text-zinc-700">{session.user.email}</span>.
        </p>
        <SignOutButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-center">
      <h1 className="text-lg font-semibold text-zinc-900">You&apos;re invited!</h1>
      <p className="text-sm text-zinc-500">
        Join <span className="font-medium text-zinc-700">{invitation.trip.name}</span> as a
        member.
      </p>
      <form action={acceptInvitationAction}>
        <input type="hidden" name="token" value={token} />
        <Button type="submit">Accept invitation</Button>
      </form>
    </div>
  );
}

function InviteMessage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 text-center">
      <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
      <p className="text-sm text-zinc-500">{children}</p>
      <Link href="/trips" className="mt-2 text-sm font-medium text-zinc-900 hover:underline">
        Go to your trips
      </Link>
    </div>
  );
}
