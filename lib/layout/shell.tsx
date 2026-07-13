import "server-only";
import { HomeIcon, MailIcon } from "@/components/icons";
import type { SidebarNavItem } from "@/components/layout/SidebarNavLinks";
import { getCurrentUser } from "@/lib/auth/session";
import { countPendingInvitationsForUser } from "@/lib/services/invitations";

/** Shared shell data (user + sidebar nav) for dashboard pages outside a specific trip's
 *  context — the trips list, invites inbox, and new-trip form. Trip-scoped pages build their
 *  own nav in `app/(dashboard)/trips/[tripId]/layout.tsx` instead, since that nav depends on
 *  the trip's role/status. */
export async function getGenericShellData() {
  const user = await getCurrentUser();
  const pendingInviteCount = user?.email ? await countPendingInvitationsForUser(user.email) : 0;

  const nav: SidebarNavItem[] = [
    { href: "/trips", label: "My Trips", icon: <HomeIcon />, exact: true },
    { href: "/invites", label: "Invites", icon: <MailIcon />, badge: pendingInviteCount },
  ];

  return {
    user: user!,
    nav,
  };
}
