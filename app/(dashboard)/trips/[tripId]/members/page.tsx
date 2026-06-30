import { getCurrentUser } from "@/lib/auth/session";
import { getTripMembership } from "@/lib/auth/permissions";
import { listMembers } from "@/lib/services/trips";
import { InviteMemberForm } from "@/components/trips/InviteMemberForm";
import { RemoveMemberButton } from "@/components/trips/RemoveMemberButton";

interface MembersPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  const [members, viewerMembership] = await Promise.all([
    listMembers(tripId, user!.id),
    getTripMembership(tripId, user!.id),
  ]);
  const isOwner = viewerMembership?.role === "OWNER";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="font-medium text-zinc-900">Members ({members.length})</h2>
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {member.user.name ?? member.user.email}
                </p>
                <p className="text-xs text-zinc-500">{member.user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                  {member.role === "OWNER" ? "Owner" : "Member"}
                </span>
                {isOwner && member.role !== "OWNER" && (
                  <RemoveMemberButton tripId={tripId} userId={member.userId} />
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {isOwner && (
        <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4">
          <h2 className="font-medium text-zinc-900">Invite someone</h2>
          <InviteMemberForm tripId={tripId} />
        </div>
      )}
    </div>
  );
}
