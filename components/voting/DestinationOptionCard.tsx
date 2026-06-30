import { voteDestinationAction } from "@/app/(dashboard)/trips/[tripId]/destinations/actions";

interface Vote {
  user: { id: string; name: string | null; image: string | null };
}

interface DestinationOptionCardProps {
  tripId: string;
  id: string;
  name: string;
  notes: string | null;
  imageUrl: string | null;
  votes: Vote[];
  currentUserId: string;
  canVote: boolean;
}

export function DestinationOptionCard({
  tripId,
  id,
  name,
  notes,
  imageUrl,
  votes,
  currentUserId,
  canVote,
}: DestinationOptionCardProps) {
  const hasVoted = votes.some((vote) => vote.user.id === currentUserId);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4">
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={name} className="h-32 w-full rounded-md object-cover" />
      )}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-zinc-900">{name}</h3>
        <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
          {votes.length} {votes.length === 1 ? "vote" : "votes"}
        </span>
      </div>
      {notes && <p className="text-sm text-zinc-500">{notes}</p>}
      {votes.length > 0 && (
        <p className="text-xs text-zinc-400">
          Voted by {votes.map((vote) => vote.user.name ?? "Someone").join(", ")}
        </p>
      )}
      {canVote && (
        <form action={voteDestinationAction}>
          <input type="hidden" name="tripId" value={tripId} />
          <input type="hidden" name="optionId" value={id} />
          <button
            type="submit"
            className={`w-fit rounded-md px-3 py-1.5 text-sm font-medium ${
              hasVoted
                ? "bg-zinc-900 text-white"
                : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {hasVoted ? "Voted" : "Vote"}
          </button>
        </form>
      )}
    </div>
  );
}
