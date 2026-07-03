"use client";

import { useActionState, useState } from "react";
import {
  updateExpenseAction,
  deleteExpenseAction,
} from "@/app/(dashboard)/trips/[tripId]/expenses/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type SplitType = "EQUAL" | "EXACT_AMOUNT" | "PERCENTAGE";

const SPLIT_LABELS: Record<SplitType, string> = {
  EQUAL: "Equal",
  EXACT_AMOUNT: "Exact",
  PERCENTAGE: "%",
};

interface Share {
  userId: string;
  name: string | null;
  amountOwed: string;
}

interface Member {
  id: string;
  name: string | null;
  email: string;
}

interface ExpenseRowProps {
  tripId: string;
  id: string;
  description: string;
  amount: string;
  currency: string;
  paidById: string;
  paidByName: string | null;
  categoryId: string | null;
  splitType: SplitType;
  shares: Share[];
  members: Member[];
  categories: { id: string; name: string }[];
  canEdit: boolean;
}

export function ExpenseRow({
  tripId,
  id,
  description,
  amount,
  currency,
  paidById,
  paidByName,
  categoryId,
  splitType,
  shares,
  members,
  categories,
  canEdit,
}: ExpenseRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, action, pending] = useActionState(updateExpenseAction, undefined);

  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state?.success) setIsEditing(false);
  }

  if (isEditing) {
    return (
      <li className="px-4 py-4">
        <EditForm
          tripId={tripId}
          expenseId={id}
          initialDescription={description}
          initialAmount={amount}
          initialPaidById={paidById}
          initialCategoryId={categoryId}
          initialSplitType={splitType}
          initialShares={shares}
          currency={currency}
          members={members}
          categories={categories}
          action={action}
          pending={pending}
          error={state?.success === false ? state.error : undefined}
          onCancel={() => setIsEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-4 px-4 py-3">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-zinc-900">{description}</p>
          <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500">
            {SPLIT_LABELS[splitType]}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">
          {currency} {amount} · paid by {paidByName ?? "Unknown"}
        </p>
      </div>
      {canEdit && (
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs text-zinc-600 hover:underline"
          >
            Edit
          </button>
          <form action={deleteExpenseAction}>
            <input type="hidden" name="tripId" value={tripId} />
            <input type="hidden" name="expenseId" value={id} />
            <button type="submit" className="text-xs text-red-600 hover:underline">
              Delete
            </button>
          </form>
        </div>
      )}
    </li>
  );
}

interface EditFormProps {
  tripId: string;
  expenseId: string;
  initialDescription: string;
  initialAmount: string;
  initialPaidById: string;
  initialCategoryId: string | null;
  initialSplitType: SplitType;
  initialShares: Share[];
  currency: string;
  members: Member[];
  categories: { id: string; name: string }[];
  action: (formData: FormData) => void;
  pending: boolean;
  error: string | undefined;
  onCancel: () => void;
}

function EditForm({
  tripId,
  expenseId,
  initialDescription,
  initialAmount,
  initialPaidById,
  initialCategoryId,
  initialSplitType,
  initialShares,
  currency,
  members,
  categories,
  action,
  pending,
  error,
  onCancel,
}: EditFormProps) {
  const [splitType, setSplitType] = useState<SplitType>(initialSplitType);
  const [expenseAmount, setExpenseAmount] = useState(initialAmount);

  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set(initialShares.map((s) => s.userId))
  );

  const initialExact: Record<string, string> = {};
  for (const s of initialShares) initialExact[s.userId] = s.amountOwed;
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>(initialExact);

  // Derive default percentages from stored amounts (best approximation for edit pre-fill)
  const initialPct: Record<string, string> = {};
  const totalCentsForPct = Math.round(Number(initialAmount) * 100);
  for (const s of initialShares) {
    const shareCents = Math.round(Number(s.amountOwed) * 100);
    initialPct[s.userId] =
      totalCentsForPct > 0 ? ((shareCents / totalCentsForPct) * 100).toFixed(2) : "0";
  }
  const [percentages, setPercentages] = useState<Record<string, string>>(initialPct);

  const toggleParticipant = (id: string) => {
    setSelectedParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const participantList = members.filter((m) => selectedParticipants.has(m.id));
  const exactTotal = participantList.reduce(
    (sum, m) => sum + Number(exactAmounts[m.id] ?? "0"),
    0
  );
  const pctTotal = participantList.reduce(
    (sum, m) => sum + Number(percentages[m.id] ?? "0"),
    0
  );

  const participantIdsJson = JSON.stringify([...selectedParticipants]);
  const exactParticipantsJson = JSON.stringify(
    participantList.map((m) => ({ userId: m.id, amount: exactAmounts[m.id] ?? "0" }))
  );
  const pctParticipantsJson = JSON.stringify(
    participantList.map((m) => ({ userId: m.id, percentage: percentages[m.id] ?? "0" }))
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="expenseId" value={expenseId} />
      <input type="hidden" name="splitType" value={splitType} />
      {splitType === "EQUAL" && (
        <input type="hidden" name="participantIds" value={participantIdsJson} />
      )}
      {splitType === "EXACT_AMOUNT" && (
        <input type="hidden" name="participants" value={exactParticipantsJson} />
      )}
      {splitType === "PERCENTAGE" && (
        <input type="hidden" name="participants" value={pctParticipantsJson} />
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1">
          <Input
            id={`desc-${expenseId}`}
            name="description"
            label="Description"
            defaultValue={initialDescription}
            required
          />
        </div>
        <div className="w-36">
          <Input
            id={`amount-${expenseId}`}
            name="amount"
            label={`Amount (${currency})`}
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="min-w-40 flex-1">
          <label htmlFor={`paidBy-${expenseId}`} className="text-sm font-medium text-zinc-700">
            Paid by
          </label>
          <select
            id={`paidBy-${expenseId}`}
            name="paidById"
            defaultValue={initialPaidById}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name ?? m.email}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-40 flex-1">
          <label htmlFor={`cat-${expenseId}`} className="text-sm font-medium text-zinc-700">
            Category
          </label>
          <select
            id={`cat-${expenseId}`}
            name="categoryId"
            defaultValue={initialCategoryId ?? ""}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-zinc-700">Split type</p>
        <div className="flex gap-2">
          {(["EQUAL", "EXACT_AMOUNT", "PERCENTAGE"] as SplitType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSplitType(type)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                splitType === type
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {type === "EQUAL" ? "Equal" : type === "EXACT_AMOUNT" ? "Exact amount" : "Percentage"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700">Participants</p>
        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <label key={member.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedParticipants.has(member.id)}
                onChange={() => toggleParticipant(member.id)}
                className="rounded border-zinc-300"
              />
              <span className="flex-1 text-sm text-zinc-700">{member.name ?? member.email}</span>
              {splitType === "EXACT_AMOUNT" && selectedParticipants.has(member.id) && (
                <input
                  type="text"
                  placeholder="0.00"
                  value={exactAmounts[member.id] ?? ""}
                  onChange={(e) =>
                    setExactAmounts((prev) => ({ ...prev, [member.id]: e.target.value }))
                  }
                  className="w-28 rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
                />
              )}
              {splitType === "PERCENTAGE" && selectedParticipants.has(member.id) && (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="0"
                    value={percentages[member.id] ?? ""}
                    onChange={(e) =>
                      setPercentages((prev) => ({ ...prev, [member.id]: e.target.value }))
                    }
                    className="w-16 rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
                  />
                  <span className="text-xs text-zinc-400">%</span>
                </div>
              )}
            </label>
          ))}
        </div>
        {splitType === "EXACT_AMOUNT" && (
          <p
            className={`mt-2 text-xs ${
              Math.abs(exactTotal - Number(expenseAmount)) < 0.01
                ? "text-green-600"
                : "text-zinc-400"
            }`}
          >
            Total entered: {currency} {exactTotal.toFixed(2)} / {expenseAmount}
          </p>
        )}
        {splitType === "PERCENTAGE" && (
          <p
            className={`mt-2 text-xs ${
              Math.abs(pctTotal - 100) < 0.01 ? "text-green-600" : "text-zinc-400"
            }`}
          >
            Total: {pctTotal.toFixed(0)}% / 100%
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="w-auto">
          Cancel
        </Button>
        <Button type="submit" disabled={pending} className="w-auto">
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
