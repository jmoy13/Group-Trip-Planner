"use client";

import { useActionState } from "react";
import { createItineraryItemAction } from "@/app/(dashboard)/trips/[tripId]/itinerary/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function CreateItineraryItemForm({
  tripId,
  defaultDay,
}: {
  tripId: string;
  defaultDay: number;
}) {
  const [state, action, pending] = useActionState(createItineraryItemAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
      <input type="hidden" name="tripId" value={tripId} />
      <h3 className="font-medium text-zinc-900">Add an itinerary item</h3>
      <div className="flex gap-2">
        <Input id="title" name="title" label="Title" placeholder="Walking tour" required />
        <Input
          id="dayIndex"
          name="dayIndex"
          type="number"
          min={1}
          label="Day"
          defaultValue={defaultDay}
          required
        />
      </div>
      <div className="flex gap-2">
        <Input id="startTime" name="startTime" type="datetime-local" label="Start (optional)" />
        <Input id="endTime" name="endTime" type="datetime-local" label="End (optional)" />
      </div>
      <Input id="location" name="location" label="Location (optional)" />
      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-zinc-700">
          Description <span className="text-zinc-400">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>
      {state?.success === false && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-auto">
        {pending ? "Adding…" : "Add item"}
      </Button>
    </form>
  );
}
