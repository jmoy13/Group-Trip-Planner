import { getCurrentUser } from "@/lib/auth/session";
import { getTripMembership } from "@/lib/auth/permissions";
import { getTripForMember } from "@/lib/services/trips";
import { listBudgetCategories } from "@/lib/services/budget";
import { CreateBudgetCategoryForm } from "@/components/budget/CreateBudgetCategoryForm";
import { BudgetCategoryRow } from "@/components/budget/BudgetCategoryRow";

interface BudgetPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function BudgetPage({ params }: BudgetPageProps) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  const [trip, membership, categories] = await Promise.all([
    getTripForMember(tripId, user!.id),
    getTripMembership(tripId, user!.id),
    listBudgetCategories(tripId, user!.id),
  ]);
  const isOwner = membership?.role === "OWNER";

  const total = categories.reduce((sum, category) => sum + category.plannedAmount.toNumber(), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-zinc-900">Budget</h2>
        <p className="text-sm text-zinc-500">
          Total planned: {trip.currency} {total.toFixed(2)}
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          No budget categories yet —{" "}
          {isOwner ? "add the first one." : "ask the trip owner to add one."}
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
              currency={trip.currency}
              canManage={isOwner}
            />
          ))}
        </ul>
      )}

      <p className="text-sm text-zinc-400">
        Actual spending per category will appear here once expense tracking lands (milestone 6).
      </p>

      {isOwner && <CreateBudgetCategoryForm tripId={tripId} currency={trip.currency} />}
    </div>
  );
}
