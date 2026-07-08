import { voteDateAction } from "@/app/(dashboard)/trips/[tripId]/dates/actions";

interface Vote {
  user: { id: string; name: string | null; image: string | null };
}

interface DateOptionCardProps {
  tripId: string;
  id: string;
  startDate: Date;
  endDate: Date;
  votes: Vote[];
  currentUserId: string;
  canVote: boolean;
}

const formatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function DateOptionCard({
  tripId,
  id,
  startDate,
  endDate,
  votes,
  currentUserId,
  canVote,
}: DateOptionCardProps) {
  const hasVoted = votes.some((vote) => vote.user.id === currentUserId);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-sage-200 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-sage-900">
          {formatter.format(startDate)} – {formatter.format(endDate)}
        </h3>
        <span className="shrink-0 rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-600">
          {votes.length} {votes.length === 1 ? "vote" : "votes"}
        </span>
      </div>
      {votes.length > 0 && (
        <p className="text-xs text-sage-400">
          Voted by {votes.map((vote) => vote.user.name ?? "Someone").join(", ")}
        </p>
      )}
      {canVote && (
        <form action={voteDateAction}>
          <input type="hidden" name="tripId" value={tripId} />
          <input type="hidden" name="optionId" value={id} />
          <button
            type="submit"
            className={`w-fit rounded-md px-3 py-1.5 text-sm font-medium ${
              hasVoted
                ? "bg-sage-900 text-white"
                : "border border-sage-300 text-sage-700 hover:bg-sage-50"
            }`}
          >
            {hasVoted ? "Voted" : "Vote"}
          </button>
        </form>
      )}
    </div>
  );
}
