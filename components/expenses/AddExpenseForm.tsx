"use client";

import { useActionState, useState } from "react";
import { createExpenseAction } from "@/app/(dashboard)/trips/[tripId]/expenses/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type SplitType = "EQUAL" | "EXACT_AMOUNT" | "PERCENTAGE";

interface Member {
  id: string;
  name: string | null;
  email: string;
}

interface AddExpenseFormProps {
  tripId: string;
  currency: string;
  members: Member[];
  categories: { id: string; name: string }[];
}

export function AddExpenseForm({ tripId, currency, members, categories }: AddExpenseFormProps) {
  const [state, action, pending] = useActionState(createExpenseAction, undefined);
  const [splitType, setSplitType] = useState<SplitType>("EQUAL");
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set(members.map((m) => m.id))
  );
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [expenseAmount, setExpenseAmount] = useState("");

  // Close/reset form on success using the render-time state-diff pattern (not useEffect)
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state?.success) {
      setSplitType("EQUAL");
      setSelectedParticipants(new Set(members.map((m) => m.id)));
      setExactAmounts({});
      setPercentages({});
      setExpenseAmount("");
    }
  }

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
    <form action={action} className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4">
      <p className="text-sm font-medium text-zinc-700">Add expense</p>
      <input type="hidden" name="tripId" value={tripId} />
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
            id="description"
            name="description"
            label="Description"
            placeholder="Dinner at restaurant"
            required
          />
        </div>
        <div className="w-36">
          <Input
            id="amount"
            name="amount"
            label={`Amount (${currency})`}
            placeholder="50.00"
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="min-w-40 flex-1">
          <label htmlFor="paidById" className="text-sm font-medium text-zinc-700">
            Paid by
          </label>
          <select
            id="paidById"
            name="paidById"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name ?? m.email}
              </option>
            ))}
          </select>
        </div>
        {categories.length > 0 && (
          <div className="min-w-40 flex-1">
            <label htmlFor="categoryId" className="text-sm font-medium text-zinc-700">
              Category (optional)
            </label>
            <select
              id="categoryId"
              name="categoryId"
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
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
                  className="w-28 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400"
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
                    className="w-16 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400"
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
              expenseAmount && Math.abs(exactTotal - Number(expenseAmount)) < 0.01
                ? "text-green-600"
                : "text-zinc-400"
            }`}
          >
            Total entered: {currency} {exactTotal.toFixed(2)}
            {expenseAmount ? ` / ${expenseAmount}` : ""}
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

      {state?.success === false && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-auto self-end">
        {pending ? "Adding…" : "Add expense"}
      </Button>
    </form>
  );
}
