import { getCurrentUser } from "@/lib/auth/session";
import { getTripForMember } from "@/lib/services/trips";
import { listDateOptions } from "@/lib/services/voting";
import { ProposeDateForm } from "@/components/voting/ProposeDateForm";
import { DateOptionCard } from "@/components/voting/DateOptionCard";

interface DatesPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function DatesPage({ params }: DatesPageProps) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  const [trip, options] = await Promise.all([
    getTripForMember(tripId, user!.id),
    listDateOptions(tripId, user!.id),
  ]);

  const canVote = trip.status === "VOTING";

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-medium text-zinc-900">Dates</h2>

      {options.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          No date ranges proposed yet — add the first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {options.map((option) => (
            <DateOptionCard
              key={option.id}
              tripId={tripId}
              id={option.id}
              startDate={option.startDate}
              endDate={option.endDate}
              votes={option.votes}
              currentUserId={user!.id}
              canVote={canVote}
            />
          ))}
        </div>
      )}

      {canVote ? (
        <ProposeDateForm tripId={tripId} />
      ) : (
        <p className="text-sm text-zinc-400">
          {trip.status === "PLANNING"
            ? "Voting hasn't started yet."
            : "Voting is closed for this trip."}
        </p>
      )}
    </div>
  );
}
