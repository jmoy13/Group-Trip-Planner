"use client";

import { useActionState } from "react";
import { updateTripAction } from "@/app/(dashboard)/trips/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface UpdateTripFormProps {
  trip: { id: string; name: string; description: string | null; currency: string };
}

export function UpdateTripForm({ trip }: UpdateTripFormProps) {
  const [state, action, pending] = useActionState(updateTripAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="tripId" value={trip.id} />
      <Input id="name" name="name" label="Trip name" defaultValue={trip.name} required />
      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-sage-700">
          Description <span className="text-sage-400">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={trip.description ?? ""}
          className="rounded-md border border-sage-300 bg-white px-3 py-2 text-sm text-sage-900 outline-none focus:ring-2 focus:ring-sage-400"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="currency" className="text-sm font-medium text-sage-700">
          Currency
        </label>
        <select
          id="currency"
          name="currency"
          defaultValue={trip.currency}
          className="rounded-md border border-sage-300 bg-white px-3 py-2 text-sm text-sage-900 outline-none focus:ring-2 focus:ring-sage-400"
        >
          <option value="USD">USD — US Dollar</option>
          <option value="EUR">EUR — Euro</option>
          <option value="GBP">GBP — British Pound</option>
          <option value="JPY">JPY — Japanese Yen</option>
          <option value="CAD">CAD — Canadian Dollar</option>
          <option value="AUD">AUD — Australian Dollar</option>
        </select>
      </div>
      {state?.success === false && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success === true && <p className="text-sm text-emerald-600">Saved.</p>}
      <Button type="submit" disabled={pending} className="w-auto">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
