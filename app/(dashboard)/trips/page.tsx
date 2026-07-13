import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TripCard } from "@/components/trips/TripCard";
import { AppShell } from "@/components/layout/AppShell";
import { MountainScene } from "@/components/illustrations/Mountain";
import { MailIcon, CalendarIcon, ArrowRightIcon } from "@/components/icons";
import { getGenericShellData } from "@/lib/layout/shell";
import { listUserTripsWithSummary } from "@/lib/services/trips";
import { listPendingInvitationsForUserPreview } from "@/lib/services/invitations";
import { acceptInvitationAction, declineInvitationAction } from "@/app/invite/actions";
import { UPCOMING_TRIP_STATUSES } from "@/lib/trip-status";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function TripsPage() {
  const { user, nav } = await getGenericShellData();
  const [trips, invitePreviews] = await Promise.all([
    listUserTripsWithSummary(user.id),
    user.email ? listPendingInvitationsForUserPreview(user.email) : [],
  ]);

  const upcomingTrips = trips.filter((t) => UPCOMING_TRIP_STATUSES.has(t.status));
  const pastTrips = trips.filter((t) => !UPCOMING_TRIP_STATUSES.has(t.status));

  return (
    <AppShell
      breadcrumb={[{ label: "My Trips" }]}
      userName={user.name ?? user.email ?? "You"}
      userEmail={user.email ?? ""}
      userImage={user.image}
      nav={nav}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sage-900">My Trips</h1>
          <p className="text-sm text-sage-500">All your upcoming adventures in one place.</p>
        </div>
        <Link href="/trips/new">
          <Button className="flex w-auto items-center gap-2">+ Create Trip</Button>
        </Link>
      </div>

      <div className="flex gap-6 border-b border-sage-200 text-sm font-medium">
        <span className="border-b-2 border-sage-800 px-1 pb-3 text-sage-900">My Trips</span>
        <Link href="/invites" className="px-1 pb-3 text-sage-500 hover:text-sage-900">
          Invites
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {trips.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-sage-300 py-16 text-center">
              <h2 className="font-medium text-sage-900">No trips yet</h2>
              <p className="max-w-sm text-sm text-sage-500">
                Create a trip to start voting on destinations and dates with your group.
              </p>
              <Link href="/trips/new" className="mt-2">
                <Button className="w-auto">Create your first trip</Button>
              </Link>
            </div>
          ) : (
            <>
              {upcomingTrips.length > 0 && (
                <section className="flex flex-col gap-3">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-sage-700">
                    <CalendarIcon className="h-4 w-4" />
                    Upcoming Trips
                  </h2>
                  <div className="flex flex-col gap-4">
                    {upcomingTrips.map((trip) => (
                      <TripCard key={trip.id} {...trip} />
                    ))}
                  </div>
                </section>
              )}

              {pastTrips.length > 0 && (
                <section className="flex flex-col gap-3">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-sage-700">
                    <CalendarIcon className="h-4 w-4" />
                    Past Trips
                  </h2>
                  <div className="flex flex-col gap-4">
                    {pastTrips.map((trip) => (
                      <TripCard key={trip.id} {...trip} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className="rounded-2xl border border-sage-200 p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-sage-900">
                <MailIcon className="h-4 w-4" />
                Invites
                {invitePreviews.length > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {invitePreviews.length}
                  </span>
                )}
              </h2>
              <Link href="/invites" className="text-xs text-sage-500 hover:underline">
                View all
              </Link>
            </div>

            {invitePreviews.length === 0 ? (
              <p className="mt-3 text-sm text-sage-500">No pending invites right now.</p>
            ) : (
              <div className="mt-3 flex flex-col gap-4">
                {invitePreviews.map((invitation) => (
                  <div key={invitation.id} className="flex flex-col gap-2 border-b border-sage-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
                        <MountainScene className="h-full w-full" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-sage-900">
                          {invitation.trip.name}
                        </p>
                        <p className="truncate text-xs text-sage-500">
                          Invited by {invitation.inviterName}
                        </p>
                      </div>
                    </div>
                    {invitation.trip.finalStartDate && invitation.trip.finalEndDate && (
                      <p className="flex items-center gap-1.5 text-xs text-sage-500">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {dateFormatter.format(invitation.trip.finalStartDate)} –{" "}
                        {dateFormatter.format(invitation.trip.finalEndDate)}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <form action={declineInvitationAction} className="flex-1">
                        <input type="hidden" name="token" value={invitation.token} />
                        <Button type="submit" variant="secondary" className="w-full">
                          Decline
                        </Button>
                      </form>
                      <form action={acceptInvitationAction} className="flex-1">
                        <input type="hidden" name="token" value={invitation.token} />
                        <Button type="submit" className="w-full">
                          Accept
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link
              href="/invites"
              className="mt-4 flex items-center justify-center gap-1.5 text-sm font-medium text-sage-700 hover:underline"
            >
              View all invites
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
