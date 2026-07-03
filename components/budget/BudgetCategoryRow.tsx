"use client";

import { useActionState, useState } from "react";
import {
  deleteBudgetCategoryAction,
  updateBudgetCategoryAction,
} from "@/app/(dashboard)/trips/[tripId]/budget/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface BudgetCategoryRowProps {
  tripId: string;
  id: string;
  name: string;
  plannedAmount: string;
  actualAmount: number;
  currency: string;
  canManage: boolean;
}

export function BudgetCategoryRow({
  tripId,
  id,
  name,
  plannedAmount,
  actualAmount,
  currency,
  canManage,
}: BudgetCategoryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, action, pending] = useActionState(updateBudgetCategoryAction, undefined);

  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state?.success) setIsEditing(false);
  }

  const planned = parseFloat(plannedAmount);
  const pct = planned > 0 ? Math.min(100, (actualAmount / planned) * 100) : 0;
  const overBudget = pct >= 100;

  if (isEditing) {
    return (
      <li className="flex flex-col gap-2 px-4 py-3">
        <form action={action} className="flex items-end gap-2">
          <input type="hidden" name="tripId" value={tripId} />
          <input type="hidden" name="categoryId" value={id} />
          <div className="flex-1">
            <Input id={`name-${id}`} name="name" label="Name" defaultValue={name} required />
          </div>
          <div className="flex-1">
            <Input
              id={`amount-${id}`}
              name="plannedAmount"
              label={`Planned (${currency})`}
              defaultValue={plannedAmount}
              required
            />
          </div>
          <Button type="submit" disabled={pending} className="w-auto">
            {pending ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-auto"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
        </form>
        {state?.success === false && <p className="text-sm text-red-600">{state.error}</p>}
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-900">{name}</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            {currency} {actualAmount.toFixed(2)}{" "}
            <span className="text-zinc-400">/ {plannedAmount}</span>
          </span>
          {canManage && (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs text-zinc-600 hover:underline"
              >
                Edit
              </button>
              <form action={deleteBudgetCategoryAction}>
                <input type="hidden" name="tripId" value={tripId} />
                <input type="hidden" name="categoryId" value={id} />
                <button type="submit" className="text-xs text-red-600 hover:underline">
                  Delete
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full transition-all ${overBudget ? "bg-red-500" : "bg-zinc-900"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {overBudget && (
        <p className="text-xs text-red-600">
          Over budget by {currency} {(actualAmount - planned).toFixed(2)}
        </p>
      )}
    </li>
  );
}
