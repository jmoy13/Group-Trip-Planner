import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getTripMembership } from "@/lib/auth/permissions";
import { getTripForMember } from "@/lib/services/trips";
import { UpdateTripForm } from "@/components/trips/UpdateTripForm";
import { DeleteTripButton } from "@/components/trips/DeleteTripButton";

interface TripSettingsPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function TripSettingsPage({ params }: TripSettingsPageProps) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  const membership = await getTripMembership(tripId, user!.id);
  if (membership?.role !== "OWNER") notFound();

  const trip = await getTripForMember(tripId, user!.id);

  return (
    <div className="flex max-w-md flex-col gap-8">
      <div>
        <h2 className="mb-3 font-medium text-zinc-900">Trip settings</h2>
        <UpdateTripForm trip={trip} />
      </div>
      <div className="rounded-lg border border-red-200 p-4">
        <h2 className="mb-2 font-medium text-red-700">Danger zone</h2>
        <p className="mb-3 text-sm text-zinc-500">
          Deleting a trip removes it and all its data permanently.
        </p>
        <DeleteTripButton tripId={tripId} tripName={trip.name} />
      </div>
    </div>
  );
}
