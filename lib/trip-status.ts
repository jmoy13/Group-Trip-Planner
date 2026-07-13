/** Shared trip-status presentation shared by the trips list and trip overview page. */
export const TRIP_STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning",
  VOTING: "Voting Open",
  FINALIZED: "Upcoming",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const TRIP_STATUS_BADGE_CLASSES: Record<string, string> = {
  PLANNING: "bg-sage-100 text-sage-600",
  VOTING: "bg-blue-50 text-blue-700",
  FINALIZED: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  ARCHIVED: "bg-sage-100 text-sage-500",
};

/** Trips that haven't happened (or are still being planned) vs. ones that are over — used to
 *  split the trips list into "Upcoming" / "Past" sections. */
export const UPCOMING_TRIP_STATUSES = new Set(["PLANNING", "VOTING", "FINALIZED"]);
export const PAST_TRIP_STATUSES = new Set(["COMPLETED", "ARCHIVED"]);
