import { getCurrentUser } from "@/lib/auth/session";
import { getTripForMember } from "@/lib/services/trips";
import { listDestinationOptions } from "@/lib/services/voting";
import { ProposeDestinationForm } from "@/components/voting/ProposeDestinationForm";
import { DestinationOptionCard } from "@/components/voting/DestinationOptionCard";
import { DestinationsMapLoader } from "@/components/voting/DestinationsMapLoader";

interface DestinationsPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function DestinationsPage({ params }: DestinationsPageProps) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  const [trip, options] = await Promise.all([
    getTripForMember(tripId, user!.id),
    listDestinationOptions(tripId, user!.id),
  ]);

  const canVote = trip.status === "VOTING";
  const isFinalized =
    trip.status === "FINALIZED" || trip.status === "COMPLETED" || trip.status === "ARCHIVED";

  // Once voting is over, the map should only plot the winning destination, not every option.
  const mapOptions = isFinalized
    ? options.filter((o) => o.id === trip.finalDestinationId)
    : options;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-medium text-zinc-900">Destinations</h2>

      {options.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          No destinations proposed yet — add the first one.
        </div>
      ) : (
        <>
          <DestinationsMapLoader
            destinations={mapOptions.map((o) => ({
              id: o.id,
              name: o.name,
              latitude: o.latitude,
              longitude: o.longitude,
              voteCount: o.votes.length,
            }))}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {options.map((option) => (
              <DestinationOptionCard
                key={option.id}
                tripId={tripId}
                id={option.id}
                name={option.name}
                notes={option.notes}
                imageUrl={option.imageUrl}
                votes={option.votes}
                currentUserId={user!.id}
                canVote={canVote}
              />
            ))}
          </div>
        </>
      )}

      {canVote ? (
        <ProposeDestinationForm tripId={tripId} />
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
