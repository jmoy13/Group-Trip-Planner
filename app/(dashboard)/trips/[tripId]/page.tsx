import Link from "next/link";
import type { ComponentType } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { getTripMembership } from "@/lib/auth/permissions";
import { getTripForMember, listMembers } from "@/lib/services/trips";
import { listDateOptions, listDestinationOptions } from "@/lib/services/voting";
import { listBudgetCategories, getBudgetActuals } from "@/lib/services/budget";
import { listItineraryItems } from "@/lib/services/itinerary";
import { listPendingTripInvitations } from "@/lib/services/invitations";
import { TRIP_STATUS_LABELS, TRIP_STATUS_BADGE_CLASSES } from "@/lib/trip-status";
import { StartVotingButton } from "@/components/voting/StartVotingButton";
import { FinalizeTripPanel } from "@/components/voting/FinalizeTripPanel";
import { DestinationsMapLoader } from "@/components/voting/DestinationsMapLoader";
import { ShareTripButton } from "@/components/trips/ShareTripButton";
import { MountainScene } from "@/components/illustrations/Mountain";
import { Avatar, AvatarStack } from "@/components/layout/Avatar";
import {
  MapPinIcon,
  CalendarIcon,
  WalletIcon,
  PieChartIcon,
  UsersIcon,
  PencilIcon,
  ListIcon,
} from "@/components/icons";

interface TripOverviewPageProps {
  params: Promise<{ tripId: string }>;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function dayCount(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

function StatCard({
  icon: Icon,
  label,
  href,
  hrefLabel = "View options →",
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-sage-200 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sage-500">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sage-100">
          <Icon className="h-3.5 w-3.5 text-sage-700" />
        </span>
        {label}
      </div>
      <div className="flex flex-1 flex-col gap-0.5">{children}</div>
      {href && (
        <Link href={href} className="text-xs text-sage-500 hover:text-sage-800 hover:underline">
          {hrefLabel}
        </Link>
      )}
    </div>
  );
}

export default async function TripOverviewPage({ params }: TripOverviewPageProps) {
  const { tripId } = await params;
  const user = await getCurrentUser();

  const [trip, membership, members, categories, actuals, itineraryItems] = await Promise.all([
    getTripForMember(tripId, user!.id),
    getTripMembership(tripId, user!.id),
    listMembers(tripId, user!.id),
    listBudgetCategories(tripId, user!.id),
    getBudgetActuals(tripId, user!.id),
    listItineraryItems(tripId, user!.id),
  ]);

  const isOwner = membership?.role === "OWNER";
  const isFinalized =
    trip.status === "FINALIZED" || trip.status === "COMPLETED" || trip.status === "ARCHIVED";

  // Voting data only needed for VOTING / FINALIZED states
  let destinationOptions: Awaited<ReturnType<typeof listDestinationOptions>> = [];
  let dateOptions: Awaited<ReturnType<typeof listDateOptions>> = [];
  if (trip.status !== "PLANNING") {
    [destinationOptions, dateOptions] = await Promise.all([
      listDestinationOptions(tripId, user!.id),
      listDateOptions(tripId, user!.id),
    ]);
  }

  // Pending (not-yet-accepted) invitations are only visible to the owner — see the security
  // checklist in claude.md §7 on not leaking invitee emails beyond who needs them.
  const pendingInvitations = isOwner ? await listPendingTripInvitations(tripId, user!.id) : [];

  // Falls back to the first proposed option when nobody has voted yet, so a proposal is never
  // reported as "no proposals" just because it has zero votes so far.
  const leadingDestination = destinationOptions.reduce<{ id: string; name: string; votes: number } | null>(
    (leader, o) =>
      !leader || o.votes.length > leader.votes ? { id: o.id, name: o.name, votes: o.votes.length } : leader,
    null
  );
  const leadingDateOption = dateOptions.reduce<
    { id: string; startDate: Date; endDate: Date; votes: number } | null
  >(
    (leader, o) =>
      !leader || o.votes.length > leader.votes
        ? { id: o.id, startDate: o.startDate, endDate: o.endDate, votes: o.votes.length }
        : leader,
    null
  );

  const finalizedDestinationName = trip.finalDestinationId
    ? (destinationOptions.find((o) => o.id === trip.finalDestinationId)?.name ?? null)
    : null;

  const highlightedDestinationId = trip.finalDestinationId ?? leadingDestination?.id ?? null;

  // Once voting is over, the map should only plot the winning destination, not every option.
  const mapDestinationOptions = isFinalized
    ? destinationOptions.filter((o) => o.id === trip.finalDestinationId)
    : destinationOptions;

  const hasVotedDestination = destinationOptions.some((o) =>
    o.votes.some((v) => v.user.id === user!.id)
  );
  const hasVotedDates = dateOptions.some((o) => o.votes.some((v) => v.user.id === user!.id));

  const totalPlanned = categories.reduce((s, c) => s + c.plannedAmount.toNumber(), 0);
  const totalSpent = [...actuals.values()].reduce((s, v) => s + v, 0);
  const budgetPct = totalPlanned > 0 ? Math.min(100, (totalSpent / totalPlanned) * 100) : 0;

  // A simple 6-step lifecycle checklist behind the "Progress" stat card.
  const steps = [
    true, // trip created
    destinationOptions.length > 0,
    dateOptions.length > 0,
    isFinalized,
    categories.length > 0,
    itineraryItems.length > 0,
  ];
  const completedSteps = steps.filter(Boolean).length;
  const progressPct = Math.round((completedSteps / steps.length) * 100);

  // Hero date range: final dates once finalized, else whichever proposal is currently leading.
  const heroRange =
    trip.finalStartDate && trip.finalEndDate
      ? { start: trip.finalStartDate, end: trip.finalEndDate }
      : leadingDateOption
        ? { start: leadingDateOption.startDate, end: leadingDateOption.endDate }
        : null;
  const heroLocation = finalizedDestinationName ?? leadingDestination?.name ?? null;

  const memberMap = new Map(
    members.map((m) => [m.userId, { id: m.userId, name: m.user.name, image: m.user.image }])
  );

  function pendingVoters(options: { votes: { user: { id: string } }[] }[]) {
    const voted = new Set(options.flatMap((o) => o.votes.map((v) => v.user.id)));
    return members.filter((m) => !voted.has(m.userId)).map((m) => memberMap.get(m.userId)!);
  }

  interface NextUpTask {
    id: string;
    icon: ComponentType<{ className?: string }>;
    title: string;
    description: string;
    href: string;
    cta: string;
    people: { id: string; name: string | null; image?: string | null }[];
  }

  const tasks: NextUpTask[] = [];
  if (trip.status === "VOTING") {
    if (!hasVotedDestination) {
      tasks.push({
        id: "vote-destinations",
        icon: MapPinIcon,
        title: "Vote on destinations",
        description: "Help the group decide where to go.",
        href: `/trips/${tripId}/destinations`,
        cta: "Vote Now",
        people: pendingVoters(destinationOptions),
      });
    }
    if (!hasVotedDates) {
      tasks.push({
        id: "vote-dates",
        icon: CalendarIcon,
        title: "Vote on dates",
        description: "Pick the best dates that work for everyone.",
        href: `/trips/${tripId}/dates`,
        cta: "Vote Now",
        people: pendingVoters(dateOptions),
      });
    }
  }
  if (trip.status === "FINALIZED") {
    if (categories.length === 0) {
      tasks.push({
        id: "review-budget",
        icon: WalletIcon,
        title: "Review budget",
        description: "Add to the budget or adjust expenses.",
        href: `/trips/${tripId}/budget`,
        cta: "Review",
        people: members.map((m) => memberMap.get(m.userId)!),
      });
    }
    if (itineraryItems.length === 0) {
      tasks.push({
        id: "add-itinerary",
        icon: ListIcon,
        title: "Add to itinerary",
        description: "Suggest activities, restaurants, and must-sees.",
        href: `/trips/${tripId}/itinerary`,
        cta: "Add Items",
        people: members.map((m) => memberMap.get(m.userId)!),
      });
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        {/* Hero */}
        <div className="flex flex-col gap-5 rounded-2xl border border-sage-200 p-5 sm:flex-row">
          <div className="aspect-video w-full overflow-hidden rounded-xl sm:w-64 sm:shrink-0">
            <MountainScene className="h-full w-full" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span
                className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${TRIP_STATUS_BADGE_CLASSES[trip.status] ?? "bg-sage-100 text-sage-600"}`}
              >
                {TRIP_STATUS_LABELS[trip.status] ?? trip.status}
              </span>
              <div className="flex gap-2">
                <ShareTripButton tripId={tripId} />
                <Link
                  href={`/trips/${tripId}/members`}
                  className="flex items-center gap-2 rounded-lg bg-sage-800 px-4 py-2 text-sm font-medium text-white hover:bg-sage-900"
                >
                  <UsersIcon className="h-4 w-4" />
                  Invite
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-sage-900">{trip.name}</h1>
              {isOwner && (
                <Link
                  href={`/trips/${tripId}/settings`}
                  className="text-sage-400 hover:text-sage-700"
                  aria-label="Edit trip"
                >
                  <PencilIcon className="h-4 w-4" />
                </Link>
              )}
            </div>

            {heroRange && (
              <p className="flex items-center gap-1.5 text-sm text-sage-600">
                <CalendarIcon className="h-4 w-4 shrink-0" />
                {dateFormatter.format(heroRange.start)} – {dateFormatter.format(heroRange.end)}
                <span className="text-sage-400">({dayCount(heroRange.start, heroRange.end)} days)</span>
              </p>
            )}
            {heroLocation && (
              <p className="flex items-center gap-1.5 text-sm text-sage-600">
                <MapPinIcon className="h-4 w-4 shrink-0" />
                {heroLocation}
              </p>
            )}
            {trip.description && <p className="text-sm text-sage-500">{trip.description}</p>}
          </div>
        </div>

        {/* Planning → start voting */}
        {trip.status === "PLANNING" && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-sage-200 p-4">
            <p className="text-sm text-sage-500">
              Propose destinations and dates once voting opens.
            </p>
            {isOwner && <StartVotingButton tripId={tripId} />}
          </div>
        )}

        {/* Voting open → finalize panel (owner only) */}
        {trip.status === "VOTING" && isOwner && (
          <FinalizeTripPanel
            tripId={tripId}
            destinations={destinationOptions.map((o) => ({
              id: o.id,
              label: o.name,
              voteCount: o.votes.length,
            }))}
            dateOptions={dateOptions.map((o) => ({
              id: o.id,
              label: `${dateFormatter.format(o.startDate)} – ${dateFormatter.format(o.endDate)}`,
              voteCount: o.votes.length,
            }))}
          />
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={MapPinIcon}
            label="Destination"
            href={trip.status !== "PLANNING" ? `/trips/${tripId}/destinations` : undefined}
          >
            {trip.status === "PLANNING" ? (
              <p className="text-sm text-sage-400">Not started</p>
            ) : isFinalized ? (
              <p className="text-sm font-semibold text-sage-900">
                {finalizedDestinationName ?? "TBD"}
              </p>
            ) : leadingDestination ? (
              <>
                <p className="text-sm font-semibold text-sage-900">
                  {leadingDestination.votes > 0 ? "Leading: " : ""}
                  {leadingDestination.name}
                </p>
                <p className="text-xs text-sage-500">
                  {leadingDestination.votes > 0
                    ? `${leadingDestination.votes} ${leadingDestination.votes === 1 ? "vote" : "votes"}`
                    : "Awaiting votes"}
                </p>
              </>
            ) : (
              <p className="text-sm text-sage-400">No proposals yet</p>
            )}
          </StatCard>

          <StatCard
            icon={CalendarIcon}
            label="Dates"
            href={trip.status !== "PLANNING" ? `/trips/${tripId}/dates` : undefined}
          >
            {trip.status === "PLANNING" ? (
              <p className="text-sm text-sage-400">Not started</p>
            ) : isFinalized && trip.finalStartDate && trip.finalEndDate ? (
              <p className="text-sm font-semibold text-sage-900">
                {shortDateFormatter.format(trip.finalStartDate)} –{" "}
                {shortDateFormatter.format(trip.finalEndDate)}
              </p>
            ) : leadingDateOption ? (
              <>
                <p className="text-sm font-semibold text-sage-900">
                  {leadingDateOption.votes > 0 ? "Leading: " : ""}
                  {shortDateFormatter.format(leadingDateOption.startDate)} –{" "}
                  {shortDateFormatter.format(leadingDateOption.endDate)}
                </p>
                <p className="text-xs text-sage-500">
                  {leadingDateOption.votes > 0
                    ? `${leadingDateOption.votes} ${leadingDateOption.votes === 1 ? "vote" : "votes"}`
                    : "Awaiting votes"}
                </p>
              </>
            ) : (
              <p className="text-sm text-sage-400">No proposals yet</p>
            )}
          </StatCard>

          <StatCard
            icon={WalletIcon}
            label="Budget"
            href={isFinalized ? `/trips/${tripId}/budget` : undefined}
          >
            {isFinalized ? (
              <>
                <p className="text-sm font-semibold text-sage-900">
                  {trip.currency} {totalSpent.toFixed(2)}
                </p>
                <p className="text-xs text-sage-500">
                  of {trip.currency} {totalPlanned.toFixed(2)} goal
                </p>
              </>
            ) : (
              <p className="text-sm text-sage-400">Available once finalized</p>
            )}
          </StatCard>

          <StatCard icon={PieChartIcon} label="Progress">
            <p className="text-sm font-semibold text-sage-900">
              {completedSteps} of {steps.length} steps
            </p>
            <p className="text-xs text-sage-500">completed</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-sage-100">
                <div
                  className="h-1.5 rounded-full bg-sage-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs font-medium text-sage-600">{progressPct}%</span>
            </div>
          </StatCard>
        </div>

        {/* Next Up */}
        <div className="flex flex-col gap-3 rounded-2xl border border-sage-200 p-5">
          <h2 className="font-semibold text-sage-900">Next Up</h2>
          {tasks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-sage-300 p-4 text-center text-sm text-sage-500">
              {trip.status === "PLANNING"
                ? "Nothing to do yet — waiting for the trip owner to start voting."
                : "You're all caught up."}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-sage-200">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-800 text-white">
                      <task.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-sage-900">{task.title}</p>
                      <p className="text-xs text-sage-500">{task.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {task.people.length > 0 && <AvatarStack people={task.people} />}
                    <Link
                      href={task.href}
                      className="rounded-lg bg-sage-800 px-4 py-2 text-sm font-medium text-white hover:bg-sage-900"
                    >
                      {task.cta}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Destination map */}
        {trip.status !== "PLANNING" && destinationOptions.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-sage-700">Destination map</h3>
              <Link
                href={`/trips/${tripId}/destinations`}
                className="text-xs text-sage-400 hover:text-sage-700 hover:underline"
              >
                View all →
              </Link>
            </div>
            <DestinationsMapLoader
              destinations={mapDestinationOptions.map((o) => ({
                id: o.id,
                name: o.name,
                latitude: o.latitude,
                longitude: o.longitude,
                voteCount: o.votes.length,
              }))}
              highlightId={highlightedDestinationId}
              heightClassName="h-56"
            />
          </div>
        )}
      </div>

      {/* Right rail */}
      <div className="flex flex-col gap-6 lg:col-span-1">
        <div className="rounded-2xl border border-sage-200 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sage-900">
              Members ({members.length + pendingInvitations.length})
            </h2>
            <Link
              href={`/trips/${tripId}/members`}
              className="text-xs text-sage-500 hover:underline"
            >
              Manage
            </Link>
          </div>
          <ul className="mt-3 flex flex-col divide-y divide-sage-200">
            {members.map((m) => (
              <li key={m.userId} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar id={m.userId} name={m.user.name} image={m.user.image} />
                  <p className="truncate text-sm text-sage-900">
                    {m.user.name ?? m.user.email}
                    {m.userId === user!.id ? " (You)" : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-600">
                  {m.role === "OWNER" ? "Trip Owner" : "Accepted"}
                </span>
              </li>
            ))}
            {pendingInvitations.map((invitation) => (
              <li key={invitation.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar id={invitation.id} name={invitation.email} />
                  <p className="truncate text-sm text-sage-500">{invitation.email}</p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Pending
                </span>
              </li>
            ))}
          </ul>
          {isOwner && (
            <Link
              href={`/trips/${tripId}/members`}
              className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-sage-300 py-2 text-sm font-medium text-sage-700 hover:bg-sage-50"
            >
              + Invite More People
            </Link>
          )}
        </div>

        {isFinalized && (
          <div className="rounded-2xl border border-sage-200 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sage-900">Budget Summary</h2>
              <Link
                href={`/trips/${tripId}/budget`}
                className="text-xs text-sage-500 hover:underline"
              >
                View details
              </Link>
            </div>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-sage-500">Total Budget</dt>
                <dd className="font-medium text-sage-900">
                  {trip.currency} {totalPlanned.toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sage-500">Spent</dt>
                <dd className="font-medium text-sage-900">
                  {trip.currency} {totalSpent.toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sage-500">Remaining</dt>
                <dd
                  className={`font-medium ${totalPlanned - totalSpent < 0 ? "text-red-600" : "text-sage-900"}`}
                >
                  {trip.currency} {(totalPlanned - totalSpent).toFixed(2)}
                </dd>
              </div>
            </dl>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-sage-100">
                <div
                  className={`h-2 rounded-full ${budgetPct >= 100 ? "bg-red-500" : "bg-sage-700"}`}
                  style={{ width: `${budgetPct}%` }}
                />
              </div>
              <span className="text-xs font-medium text-sage-600">{budgetPct.toFixed(0)}%</span>
            </div>
            <Link
              href={`/trips/${tripId}/expenses`}
              className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-sage-800 py-2 text-sm font-medium text-white hover:bg-sage-900"
            >
              Add Expense
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
