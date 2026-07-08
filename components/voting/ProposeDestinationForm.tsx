"use client";

import { useActionState } from "react";
import { proposeDestinationAction } from "@/app/(dashboard)/trips/[tripId]/destinations/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ProposeDestinationForm({ tripId }: { tripId: string }) {
  const [state, action, pending] = useActionState(proposeDestinationAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-sage-200 p-4">
      <input type="hidden" name="tripId" value={tripId} />
      <h3 className="font-medium text-sage-900">Propose a destination</h3>
      <Input id="name" name="name" label="Name" placeholder="Lisbon, Portugal" required />
      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-sage-700">
          Notes <span className="text-sage-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="rounded-md border border-sage-300 bg-white px-3 py-2 text-sm text-sage-900 outline-none focus:ring-2 focus:ring-sage-400"
        />
      </div>
      <Input id="imageUrl" name="imageUrl" label="Image URL (optional)" placeholder="https://…" />
      {state?.success === false && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-auto">
        {pending ? "Adding…" : "Add destination"}
      </Button>
    </form>
  );
}
