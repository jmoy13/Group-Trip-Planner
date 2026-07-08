"use client";

import { useActionState } from "react";
import { proposeDateAction } from "@/app/(dashboard)/trips/[tripId]/dates/actions";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";

export function ProposeDateForm({ tripId }: { tripId: string }) {
  const [state, action, pending] = useActionState(proposeDateAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-sage-200 p-4">
      <input type="hidden" name="tripId" value={tripId} />
      <h3 className="font-medium text-sage-900">Propose dates</h3>
      <div className="flex gap-3">
        <DatePicker id="startDate" name="startDate" label="Start date" required />
        <DatePicker id="endDate" name="endDate" label="End date" required />
      </div>
      {state?.success === false && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-auto">
        {pending ? "Adding…" : "Add date range"}
      </Button>
    </form>
  );
}
