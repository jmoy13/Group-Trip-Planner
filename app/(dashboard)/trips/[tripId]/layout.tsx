import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getTripMembership } from "@/lib/auth/permissions";
import { getTripForMember } from "@/lib/services/trips";
import { AppShell } from "@/components/layout/AppShell";
import type { SidebarNavItem } from "@/components/layout/SidebarNavLinks";
import {
  HomeIcon,
  MapPinIcon,
  CalendarIcon,
  ListIcon,
  WalletIcon,
  PieChartIcon,
  UsersIcon,
  GearIcon,
} from "@/components/icons";

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

  const nav: SidebarNavItem[] = [
    { href: `/trips/${tripId}`, label: "Trip Overview", icon: <HomeIcon />, exact: true },
    { href: `/trips/${tripId}/destinations`, label: "Destinations", icon: <MapPinIcon /> },
    { href: `/trips/${tripId}/dates`, label: "Dates", icon: <CalendarIcon /> },
    ...(isFinalized
      ? [
          { href: `/trips/${tripId}/itinerary`, label: "Itinerary", icon: <ListIcon /> },
          { href: `/trips/${tripId}/expenses`, label: "Expenses", icon: <WalletIcon /> },
          { href: `/trips/${tripId}/budget`, label: "Budget", icon: <PieChartIcon /> },
        ]
      : []),
    { href: `/trips/${tripId}/members`, label: "Members", icon: <UsersIcon /> },
    ...(membership.role === "OWNER"
      ? [{ href: `/trips/${tripId}/settings`, label: "Settings", icon: <GearIcon /> }]
      : []),
  ];

  return (
    <AppShell
      breadcrumb={[{ label: "My Trips", href: "/trips" }, { label: trip.name }]}
      userName={user.name ?? user.email ?? "You"}
      userEmail={user.email ?? ""}
      userImage={user.image}
      nav={nav}
    >
      {children}
    </AppShell>
  );
}
