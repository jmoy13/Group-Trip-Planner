import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getTripMembership } from "@/lib/auth/permissions";
import { getTripForMember } from "@/lib/services/trips";

interface TripLayoutProps {
  children: React.ReactNode;
  params: Promise<{ tripId: string }>;
}

export default async function TripLayout({ children, params }: TripLayoutProps) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const membership = await getTripMembership(tripId, user.id);
  if (!membership || membership.status !== "ACCEPTED") notFound();

  const trip = await getTripForMember(tripId, user.id).catch(() => null);
  if (!trip) notFound();

  const isFinalized =
    trip.status === "FINALIZED" || trip.status === "COMPLETED" || trip.status === "ARCHIVED";

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sage-200 pb-4">
        <div>
          <Link href="/trips" className="text-xs text-sage-400 hover:underline">
            ← All trips
          </Link>
          <h1 className="text-xl font-semibold text-sage-900">{trip.name}</h1>
        </div>
        <nav className="flex gap-4 text-sm text-sage-500">
          <Link href={`/trips/${tripId}`} className="hover:text-sage-900">
            Overview
          </Link>
          <Link href={`/trips/${tripId}/destinations`} className="hover:text-sage-900">
            Destinations
          </Link>
          <Link href={`/trips/${tripId}/dates`} className="hover:text-sage-900">
            Dates
          </Link>
          {isFinalized && (
            <>
              <Link href={`/trips/${tripId}/budget`} className="hover:text-sage-900">
                Budget
              </Link>
              <Link href={`/trips/${tripId}/itinerary`} className="hover:text-sage-900">
                Itinerary
              </Link>
              <Link href={`/trips/${tripId}/expenses`} className="hover:text-sage-900">
                Expenses
              </Link>
            </>
          )}
          <Link href={`/trips/${tripId}/members`} className="hover:text-sage-900">
            Members
          </Link>
          {membership.role === "OWNER" && (
            <Link href={`/trips/${tripId}/settings`} className="hover:text-sage-900">
              Settings
            </Link>
          )}
        </nav>
      </div>
      {children}
    </div>
  );
}
