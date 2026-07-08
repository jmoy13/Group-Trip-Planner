import { getCurrentUser } from "@/lib/auth/session";
import { listPendingInvitationsForUser } from "@/lib/services/invitations";
import { acceptInvitationAction, declineInvitationAction } from "@/app/invite/actions";
import { Button } from "@/components/ui/Button";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function InvitesPage() {
  const user = await getCurrentUser();
  const invitations = user?.email ? await listPendingInvitationsForUser(user.email) : [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-sage-900">Invites</h1>

      {invitations.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-sage-300 py-16 text-center">
          <h2 className="font-medium text-sage-900">No pending invites</h2>
          <p className="max-w-sm text-sm text-sage-500">
            Invitations from trip owners will show up here once they&apos;re sent.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-sage-200 rounded-lg border border-sage-200">
          {invitations.map((invitation) => (
            <li key={invitation.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sage-900">
                  {invitation.trip.name}
                </p>
                <p className="text-xs text-sage-400">
                  Expires {dateFormatter.format(invitation.expiresAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <form action={acceptInvitationAction}>
                  <input type="hidden" name="token" value={invitation.token} />
                  <Button type="submit" className="w-auto">
                    Accept
                  </Button>
                </form>
                <form action={declineInvitationAction}>
                  <input type="hidden" name="token" value={invitation.token} />
                  <Button type="submit" variant="secondary" className="w-auto">
                    Decline
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
