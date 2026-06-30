"use client";

import { useActionState } from "react";
import { finalizeTripAction } from "@/app/(dashboard)/trips/[tripId]/actions";
import { Button } from "@/components/ui/Button";

interface OptionSummary {
  id: string;
  label: string;
  voteCount: number;
}

interface FinalizeTripPanelProps {
  tripId: string;
  destinations: OptionSummary[];
  dateOptions: OptionSummary[];
}

export function FinalizeTripPanel({ tripId, destinations, dateOptions }: FinalizeTripPanelProps) {
  const [state, action, pending] = useActionState(finalizeTripAction, undefined);

  if (destinations.length === 0 || dateOptions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
        Propose at least one destination and one date range before finalizing.
      </div>
    );
  }

  const leadingDestination = [...destinations].sort((a, b) => b.voteCount - a.voteCount)[0];
  const leadingDateOption = [...dateOptions].sort((a, b) => b.voteCount - a.voteCount)[0];

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
      <input type="hidden" name="tripId" value={tripId} />
      <h3 className="font-medium text-zinc-900">Finalize trip</h3>
      <p className="text-sm text-zinc-500">
        Defaults to the leading destination and dates — override either before confirming.
      </p>
      <div className="flex flex-col gap-1">
        <label htmlFor="finalDestinationId" className="text-sm font-medium text-zinc-700">
          Destination
        </label>
        <select
          id="finalDestinationId"
          name="finalDestinationId"
          defaultValue={leadingDestination.id}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
        >
          {destinations.map((destination) => (
            <option key={destination.id} value={destination.id}>
              {destination.label} ({destination.voteCount}{" "}
              {destination.voteCount === 1 ? "vote" : "votes"})
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="finalDateOptionId" className="text-sm font-medium text-zinc-700">
          Dates
        </label>
        <select
          id="finalDateOptionId"
          name="finalDateOptionId"
          defaultValue={leadingDateOption.id}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
        >
          {dateOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label} ({option.voteCount} {option.voteCount === 1 ? "vote" : "votes"})
            </option>
          ))}
        </select>
      </div>
      {state?.success === false && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-auto">
        {pending ? "Finalizing…" : "Finalize trip"}
      </Button>
    </form>
  );
}
