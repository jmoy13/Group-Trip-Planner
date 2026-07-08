import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getTripMembership } from "@/lib/auth/permissions";
import { getTripForMember } from "@/lib/services/trips";
import { listItineraryItems } from "@/lib/services/itinerary";
import { ItineraryDayGroup } from "@/components/itinerary/ItineraryDayGroup";
import { CreateItineraryItemForm } from "@/components/itinerary/CreateItineraryItemForm";

interface ItineraryPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function ItineraryPage({ params }: ItineraryPageProps) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  const trip = await getTripForMember(tripId, user!.id);

  if (trip.status === "PLANNING" || trip.status === "VOTING") {
    return (
      <div className="rounded-lg border border-dashed border-sage-300 p-6 text-center text-sm text-sage-500">
        Itinerary unlocks once the destination and dates are finalized —{" "}
        <Link href={`/trips/${tripId}/destinations`} className="underline">
          go vote
        </Link>
        .
      </div>
    );
  }

  const [membership, items] = await Promise.all([
    getTripMembership(tripId, user!.id),
    listItineraryItems(tripId, user!.id),
  ]);
  const isOwner = membership?.role === "OWNER";

  const dayIndexes = [...new Set(items.map((item) => item.dayIndex))].sort((a, b) => a - b);
  const defaultDay = dayIndexes.at(-1) ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-medium text-sage-900">Itinerary</h2>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-sage-300 p-6 text-center text-sm text-sage-500">
          No itinerary items yet — add the first one.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {dayIndexes.map((dayIndex) => (
            <ItineraryDayGroup
              key={dayIndex}
              tripId={tripId}
              dayIndex={dayIndex}
              items={items.filter((item) => item.dayIndex === dayIndex)}
              currentUserId={user!.id}
              isOwner={isOwner}
            />
          ))}
        </div>
      )}

      <CreateItineraryItemForm tripId={tripId} defaultDay={defaultDay} />
    </div>
  );
}
