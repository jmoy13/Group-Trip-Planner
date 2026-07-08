import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TripCard } from "@/components/trips/TripCard";
import { getCurrentUser } from "@/lib/auth/session";
import { listUserTrips } from "@/lib/services/trips";

export default async function TripsPage() {
  const user = await getCurrentUser();
  const trips = user ? await listUserTrips(user.id) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-sage-900">Your trips</h1>
        <Link href="/trips/new">
          <Button className="w-auto">New trip</Button>
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-sage-300 py-16 text-center">
          <h2 className="font-medium text-sage-900">No trips yet</h2>
          <p className="max-w-sm text-sm text-sage-500">
            Create a trip to start voting on destinations and dates with your group.
          </p>
          <Link href="/trips/new" className="mt-2">
            <Button className="w-auto">Create your first trip</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              id={trip.id}
              name={trip.name}
              description={trip.description}
              status={trip.status}
              role={trip.memberships[0]?.role ?? "MEMBER"}
              memberCount={trip._count.memberships}
            />
          ))}
        </div>
      )}
    </div>
  );
}
