"use client";

import { useActionState } from "react";
import { createBudgetCategoryAction } from "@/app/(dashboard)/trips/[tripId]/budget/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function CreateBudgetCategoryForm({ tripId, currency }: { tripId: string; currency: string }) {
  const [state, action, pending] = useActionState(createBudgetCategoryAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-2 rounded-lg border border-sage-200 p-4">
      <input type="hidden" name="tripId" value={tripId} />
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input id="name" name="name" label="Category name" placeholder="Lodging" required />
        </div>
        <div className="flex-1">
          <Input
            id="plannedAmount"
            name="plannedAmount"
            label={`Planned amount (${currency})`}
            placeholder="500.00"
            required
          />
        </div>
        <Button type="submit" disabled={pending} className="w-auto">
          {pending ? "Adding…" : "Add category"}
        </Button>
      </div>
      {state?.success === false && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
