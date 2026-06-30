import { removeMemberAction } from "@/app/(dashboard)/trips/actions";

export function RemoveMemberButton({ tripId, userId }: { tripId: string; userId: string }) {
  return (
    <form action={removeMemberAction}>
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="userId" value={userId} />
      <button type="submit" className="text-xs text-red-600 hover:underline">
        Remove
      </button>
    </form>
  );
}
