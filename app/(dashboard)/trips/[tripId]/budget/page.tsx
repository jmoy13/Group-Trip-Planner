import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getTripMembership } from "@/lib/auth/permissions";
import { getTripForMember } from "@/lib/services/trips";
import { listBudgetCategories, getBudgetActuals } from "@/lib/services/budget";
import { CreateBudgetCategoryForm } from "@/components/budget/CreateBudgetCategoryForm";
import { BudgetCategoryRow } from "@/components/budget/BudgetCategoryRow";

interface BudgetPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function BudgetPage({ params }: BudgetPageProps) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  const trip = await getTripForMember(tripId, user!.id);

  if (trip.status === "PLANNING" || trip.status === "VOTING") {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
        Budget unlocks once the destination and dates are finalized —{" "}
        <Link href={`/trips/${tripId}/destinations`} className="underline">
          go vote
        </Link>
        .
      </div>
    );
  }

  const [membership, categories, actuals] = await Promise.all([
    getTripMembership(tripId, user!.id),
    listBudgetCategories(tripId, user!.id),
    getBudgetActuals(tripId, user!.id),
  ]);
  const isOwner = membership?.role === "OWNER";

  const totalPlanned = categories.reduce((sum, c) => sum + c.plannedAmount.toNumber(), 0);
  const totalSpent = categories.reduce(
    (sum, c) => sum + (actuals.get(c.id) ?? 0),
    0
  );
  const uncategorizedSpent = actuals.get("__uncategorized__") ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-zinc-900">Budget</h2>
        <div className="text-right text-sm">
          <p className="text-zinc-900">
            {trip.currency} {totalSpent.toFixed(2)}{" "}
            <span className="text-zinc-400">/ {totalPlanned.toFixed(2)} planned</span>
          </p>
          {uncategorizedSpent > 0 && (
            <p className="text-xs text-zinc-400">
              + {trip.currency} {uncategorizedSpent.toFixed(2)} uncategorized
            </p>
          )}
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          No budget categories yet —{" "}
          {isOwner ? "add the first one below." : "ask the trip owner to add one."}
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200">
          {categories.map((category) => (
            <BudgetCategoryRow
              key={category.id}
              tripId={tripId}
              id={category.id}
              name={category.name}
              plannedAmount={category.plannedAmount.toFixed(2)}
              actualAmount={actuals.get(category.id) ?? 0}
              currency={trip.currency}
              canManage={isOwner}
            />
          ))}
        </ul>
      )}

      {isOwner && <CreateBudgetCategoryForm tripId={tripId} currency={trip.currency} />}
    </div>
  );
}
