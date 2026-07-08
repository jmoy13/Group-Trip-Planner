"use client";

import { useActionState } from "react";
import { createTripAction } from "@/app/(dashboard)/trips/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function CreateTripForm() {
  const [state, action, pending] = useActionState(createTripAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input id="name" name="name" label="Trip name" placeholder="Summer in Portugal" required />
      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-sage-700">
          Description <span className="text-sage-400">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
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
          defaultValue="USD"
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
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create trip"}
      </Button>
    </form>
  );
}
