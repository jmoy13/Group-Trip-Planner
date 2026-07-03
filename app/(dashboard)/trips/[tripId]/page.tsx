import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getTripMembership } from "@/lib/auth/permissions";
import { getTripForMember, listMembers } from "@/lib/services/trips";
import { listDateOptions, listDestinationOptions } from "@/lib/services/voting";
import { listBudgetCategories, getBudgetActuals } from "@/lib/services/budget";
import { listItineraryItems } from "@/lib/services/itinerary";
import * as expenseService from "@/lib/services/expenses";
import { StartVotingButton } from "@/components/voting/StartVotingButton";
import { FinalizeTripPanel } from "@/components/voting/FinalizeTripPanel";

interface TripOverviewPageProps {
  params: Promise<{ tripId: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning",
  VOTING: "Voting open",
  FINALIZED: "Finalized",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const STATUS_COLORS: Record<string, string> = {
  PLANNING: "bg-zinc-100 text-zinc-600",
  VOTING: "bg-blue-50 text-blue-700",
  FINALIZED: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  ARCHIVED: "bg-zinc-100 text-zinc-500",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function DashboardSection({
  title,
  href,
  hrefLabel = "View all →",
  children,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-700">{title}</h3>
        {href && (
          <Link href={href} className="text-xs text-zinc-400 hover:text-zinc-700 hover:underline">
            {hrefLabel}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export default async function TripOverviewPage({ params }: TripOverviewPageProps) {
  const { tripId } = await params;
  const user = await getCurrentUser();

  const [trip, membership, members, categories, actuals, itineraryItems, expenses, settlement] =
    await Promise.all([
      getTripForMember(tripId, user!.id),
      getTripMembership(tripId, user!.id),
      listMembers(tripId, user!.id),
      listBudgetCategories(tripId, user!.id),
      getBudgetActuals(tripId, user!.id),
      listItineraryItems(tripId, user!.id),
      expenseService.listExpenses(tripId, user!.id),
      expenseService.getSettlement(tripId, user!.id),
    ]);

  const isOwner = membership?.role === "OWNER";

  // Voting data only needed for VOTING / FINALIZED states
  let destinationOptions: Awaited<ReturnType<typeof listDestinationOptions>> = [];
  let dateOptions: Awaited<ReturnType<typeof listDateOptions>> = [];
  if (trip.status !== "PLANNING") {
    [destinationOptions, dateOptions] = await Promise.all([
      listDestinationOptions(tripId, user!.id),
      listDateOptions(tripId, user!.id),
    ]);
  }

  const finalizedDestinationName = trip.finalDestinationId
    ? (destinationOptions.find((o) => o.id === trip.finalDestinationId)?.name ?? null)
    : null;

  const totalPlanned = categories.reduce((s, c) => s + c.plannedAmount.toNumber(), 0);
  const totalSpent = expenses.reduce((s, e) => s + e.amount.toNumber(), 0);
  const recentExpenses = expenses.slice(0, 3);
  const upcomingItems = itineraryItems.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      {/* Trip summary header */}
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-zinc-200 p-4">
        <div className="flex flex-col gap-2">
          {trip.description && <p className="text-sm text-zinc-500">{trip.description}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[trip.status] ?? "bg-zinc-100 text-zinc-600"}`}
            >
              {STATUS_LABELS[trip.status] ?? trip.status}
            </span>
            {finalizedDestinationName && (
              <span className="text-sm font-medium text-zinc-900">{finalizedDestinationName}</span>
            )}
            {trip.finalStartDate && trip.finalEndDate && (
              <span className="text-sm text-zinc-500">
                {dateFormatter.format(trip.finalStartDate)} –{" "}
                {dateFormatter.format(trip.finalEndDate)}
              </span>
            )}
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="text-zinc-400">Total spent</p>
          <p className="font-medium text-zinc-900">
            {trip.currency} {totalSpent.toFixed(2)}
          </p>
          {totalPlanned > 0 && (
            <p className="text-xs text-zinc-400">
              of {trip.currency} {totalPlanned.toFixed(2)} planned
            </p>
          )}
        </div>
      </div>

      {/* Planning → start voting */}
      {trip.status === "PLANNING" && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">
            Propose destinations and dates once voting opens.
          </p>
          {isOwner && <StartVotingButton tripId={tripId} />}
        </div>
      )}

      {/* Finalized banner */}
      {trip.status === "FINALIZED" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="font-medium text-emerald-900">Trip finalized</h3>
          <p className="mt-1 text-sm text-emerald-800">
            {finalizedDestinationName ?? "Destination TBD"}
            {trip.finalStartDate && trip.finalEndDate && (
              <>
                {" · "}
                {dateFormatter.format(trip.finalStartDate)} –{" "}
                {dateFormatter.format(trip.finalEndDate)}
              </>
            )}
          </p>
        </div>
      )}

      {/* Voting open → vote links + finalize panel */}
      {trip.status === "VOTING" && (
        <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">
            Vote on{" "}
            <Link
              href={`/trips/${tripId}/destinations`}
              className="font-medium text-zinc-700 underline"
            >
              destinations
            </Link>{" "}
            and{" "}
            <Link
              href={`/trips/${tripId}/dates`}
              className="font-medium text-zinc-700 underline"
            >
              dates
            </Link>
            .
          </p>
          {isOwner && (
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
        </div>
      )}

      {/* Budget + Members */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <DashboardSection title="Budget" href={`/trips/${tripId}/budget`}>
          {categories.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500">
              No budget categories yet —{" "}
              {isOwner ? (
                <Link href={`/trips/${tripId}/budget`} className="underline">
                  add one
                </Link>
              ) : (
                "ask the trip owner to add one"
              )}
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200">
              {categories.map((cat) => {
                const planned = cat.plannedAmount.toNumber();
                const actual = actuals.get(cat.id) ?? 0;
                const pct = planned > 0 ? Math.min(100, (actual / planned) * 100) : 0;
                return (
                  <li key={cat.id} className="flex flex-col gap-1.5 px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-900">{cat.name}</span>
                      <span className="text-xs text-zinc-500">
                        {trip.currency} {actual.toFixed(2)}{" "}
                        <span className="text-zinc-400">/ {planned.toFixed(2)}</span>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-red-500" : "bg-zinc-900"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </DashboardSection>

        <DashboardSection title="Members" href={`/trips/${tripId}/members`} hrefLabel="Manage →">
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200">
            {members.map((m) => (
              <li key={m.userId} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {m.user.name ?? m.user.email}
                  </p>
                  {m.user.name && (
                    <p className="truncate text-xs text-zinc-400">{m.user.email}</p>
                  )}
                </div>
                <span className="ml-3 shrink-0 text-xs text-zinc-500">
                  {m.role === "OWNER" ? "Owner" : "Member"}
                </span>
              </li>
            ))}
          </ul>
        </DashboardSection>
      </div>

      {/* Recent expenses + Settlement */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <DashboardSection title="Recent expenses" href={`/trips/${tripId}/expenses`}>
          {recentExpenses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500">
              No expenses yet —{" "}
              <Link href={`/trips/${tripId}/expenses`} className="underline">
                add the first one
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200">
              {recentExpenses.map((e) => (
                <li key={e.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-900">{e.description}</p>
                    <p className="text-xs text-zinc-400">
                      Paid by {e.paidBy.name ?? "Unknown"}
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 text-sm font-medium text-zinc-900">
                    {trip.currency} {e.amount.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>

        <DashboardSection title="Settlement">
          {settlement.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 p-4 text-center text-sm text-zinc-500">
              {expenses.length === 0 ? "No expenses yet" : "All settled up ✓"}
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200">
              {settlement.map((t, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span>
                    <span className="font-medium text-zinc-900">{t.fromName ?? t.fromUserId}</span>
                    <span className="text-zinc-400"> → </span>
                    <span className="font-medium text-zinc-900">{t.toName ?? t.toUserId}</span>
                  </span>
                  <span className="ml-3 shrink-0 font-medium text-zinc-900">
                    {trip.currency} {(t.amountCents / 100).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>
      </div>

      {/* Upcoming itinerary */}
      <DashboardSection title="Itinerary" href={`/trips/${tripId}/itinerary`}>
        {upcomingItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500">
            No itinerary items yet —{" "}
            <Link href={`/trips/${tripId}/itinerary`} className="underline">
              plan your days
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200">
            {upcomingItems.map((item) => (
              <li key={item.id} className="flex items-start gap-4 px-4 py-3">
                <span className="shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                  Day {item.dayIndex}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">{item.title}</p>
                  {item.location && (
                    <p className="truncate text-xs text-zinc-400">{item.location}</p>
                  )}
                </div>
                {item.startTime && (
                  <span className="shrink-0 text-xs text-zinc-400">
                    {new Intl.DateTimeFormat("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(item.startTime)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>
    </div>
  );
}
