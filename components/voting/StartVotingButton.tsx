import { startVotingAction } from "@/app/(dashboard)/trips/[tripId]/actions";
import { Button } from "@/components/ui/Button";

export function StartVotingButton({ tripId }: { tripId: string }) {
  return (
    <form action={startVotingAction}>
      <input type="hidden" name="tripId" value={tripId} />
      <Button type="submit" className="w-auto">
        Start voting
      </Button>
    </form>
  );
}
