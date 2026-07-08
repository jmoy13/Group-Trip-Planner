import Link from "next/link";

interface TripCardProps {
  id: string;
  name: string;
  description: string | null;
  status: string;
  role: string;
  memberCount: number;
}

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning",
  VOTING: "Voting",
  FINALIZED: "Finalized",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export function TripCard({ id, name, description, status, role, memberCount }: TripCardProps) {
  return (
    <Link
      href={`/trips/${id}`}
      className="flex flex-col gap-2 rounded-lg border border-sage-200 p-4 transition-colors hover:border-sage-300 hover:bg-sage-50"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-medium text-sage-900">{name}</h2>
        <span className="shrink-0 rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-600">
          {role === "OWNER" ? "Owner" : "Member"}
        </span>
      </div>
      {description && <p className="line-clamp-2 text-sm text-sage-500">{description}</p>}
      <div className="mt-1 flex items-center gap-3 text-xs text-sage-400">
        <span>{STATUS_LABELS[status] ?? status}</span>
        <span>·</span>
        <span>
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </span>
      </div>
    </Link>
  );
}
