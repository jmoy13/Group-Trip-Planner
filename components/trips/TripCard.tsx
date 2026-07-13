import Link from "next/link";
import { MountainScene } from "@/components/illustrations/Mountain";
import { AvatarStack } from "@/components/layout/Avatar";
import { CalendarIcon, CheckCircleIcon, MapPinIcon } from "@/components/icons";
import { TRIP_STATUS_BADGE_CLASSES, TRIP_STATUS_LABELS, PAST_TRIP_STATUSES } from "@/lib/trip-status";

interface TripCardProps {
  id: string;
  name: string;
  status: string;
  role: "OWNER" | "MEMBER";
  memberCount: number;
  members: { id: string; name: string | null; image?: string | null }[];
  location: string | null;
  dateRange: { start: Date; end: Date } | null;
  progress: { completed: number; total: number };
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** Deterministic small hue shift so cards don't all look pixel-identical, without pretending
 *  each trip has a real cover photo (none is stored — see claude.md's decisions log). */
function hueShift(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return (hash % 30) - 15;
}

export function TripCard({
  id,
  name,
  status,
  role,
  memberCount,
  members,
  location,
  dateRange,
  progress,
}: TripCardProps) {
  const isPast = PAST_TRIP_STATUSES.has(status);
  const progressPct = Math.round((progress.completed / progress.total) * 100);

  return (
    <Link
      href={`/trips/${id}`}
      className="flex gap-4 rounded-xl border border-sage-200 p-4 transition-colors hover:border-sage-300 hover:bg-sage-50"
    >
      <div
        className="h-28 w-40 shrink-0 overflow-hidden rounded-lg"
        style={{ filter: `hue-rotate(${hueShift(id)}deg)` }}
      >
        <MountainScene className="h-full w-full" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-sage-900">{name}</h3>
          <span className="shrink-0 rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-600">
            {role === "OWNER" ? "Owner" : "Member"}
          </span>
        </div>

        {(dateRange || location) && (
          <div className="flex flex-wrap items-center gap-1.5 text-sm text-sage-500">
            {dateRange && (
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                {dateFormatter.format(dateRange.start)} – {dateFormatter.format(dateRange.end)}
              </span>
            )}
            {dateRange && location && <span className="text-sage-300">·</span>}
            {location && (
              <span className="flex items-center gap-1">
                <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                {location}
              </span>
            )}
          </div>
        )}

        {members.length > 0 && <AvatarStack people={members} max={4} />}

        {!isPast && (
          <div className="mt-1 flex items-center gap-2">
            <span className="whitespace-nowrap text-xs text-sage-500">
              {progress.completed} of {progress.total} tasks completed
            </span>
            <div className="h-1.5 flex-1 rounded-full bg-sage-100">
              <div className="h-1.5 rounded-full bg-sage-700" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-xs font-medium text-sage-600">{progressPct}%</span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <span
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${TRIP_STATUS_BADGE_CLASSES[status] ?? "bg-sage-100 text-sage-600"}`}
        >
          {isPast ? <CheckCircleIcon className="h-3 w-3" /> : <CalendarIcon className="h-3 w-3" />}
          {TRIP_STATUS_LABELS[status] ?? status}
        </span>
        <span className="whitespace-nowrap text-xs text-sage-500">
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </span>
      </div>
    </Link>
  );
}
