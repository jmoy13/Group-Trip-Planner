import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getTripMembership } from "@/lib/auth/permissions";
import { getTripForMember } from "@/lib/services/trips";
import { listDateOptions, listDestinationOptions } from "@/lib/services/voting";
import { StartVotingButton } from "@/components/voting/StartVotingButton";
import { FinalizeTripPanel } from "@/components/voting/FinalizeTripPanel";

interface TripOverviewPageProps {
  params: Promise<{ tripId: string }>;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function TripOverviewPage({ params }: TripOverviewPageProps) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  const [trip, membership] = await Promise.all([
    getTripForMember(tripId, user!.id),
    getTripMembership(tripId, user!.id),
  ]);
  const isOwner = membership?.role === "OWNER";

  let finalizedDestinationName: string | null = null;
  let destinationOptions: Awaited<ReturnType<typeof listDestinationOptions>> = [];
  let dateOptions: Awaited<ReturnType<typeof listDateOptions>> = [];

  if (trip.status === "FINALIZED" && trip.finalDestinationId) {
    destinationOptions = await listDestinationOptions(tripId, user!.id);
    finalizedDestinationName =
      destinationOptions.find((option) => option.id === trip.finalDestinationId)?.name ?? null;
  } else if (trip.status === "VOTING") {
    [destinationOptions, dateOptions] = await Promise.all([
      listDestinationOptions(tripId, user!.id),
      listDateOptions(tripId, user!.id),
    ]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-zinc-200 p-4">
        <h2 className="font-medium text-zinc-900">{trip.name}</h2>
        {trip.description && <p className="mt-1 text-sm text-zinc-500">{trip.description}</p>}
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-zinc-400">Status</dt>
            <dd className="text-zinc-900">{trip.status}</dd>
          </div>
          <div>
            <dt className="text-zinc-400">Currency</dt>
            <dd className="text-zinc-900">{trip.currency}</dd>
          </div>
        </dl>
      </div>

      {trip.status === "PLANNING" && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">
            Propose destinations and dates once voting opens.
          </p>
          {isOwner && <StartVotingButton tripId={tripId} />}
        </div>
      )}

      {trip.status === "FINALIZED" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="font-medium text-emerald-900">Trip finalized</h3>
          <p className="mt-1 text-sm text-emerald-800">
            {finalizedDestinationName ?? "Destination"}
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

      {trip.status === "VOTING" && (
        <>
          <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
            Vote on{" "}
            <Link href={`/trips/${tripId}/destinations`} className="font-medium text-zinc-700 underline">
              destinations
            </Link>{" "}
            and{" "}
            <Link href={`/trips/${tripId}/dates`} className="font-medium text-zinc-700 underline">
              dates
            </Link>
            .
          </div>
          {isOwner && (
            <FinalizeTripPanel
              tripId={tripId}
              destinations={destinationOptions.map((option) => ({
                id: option.id,
                label: option.name,
                voteCount: option.votes.length,
              }))}
              dateOptions={dateOptions.map((option) => ({
                id: option.id,
                label: `${dateFormatter.format(option.startDate)} – ${dateFormatter.format(option.endDate)}`,
                voteCount: option.votes.length,
              }))}
            />
          )}
        </>
      )}

      <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
        Expense tracking lands in an upcoming milestone.
      </div>
    </div>
  );
}
