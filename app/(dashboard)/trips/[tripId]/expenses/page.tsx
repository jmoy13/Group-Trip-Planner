import { getCurrentUser } from "@/lib/auth/session";
import { getTripMembership } from "@/lib/auth/permissions";
import { getTripForMember } from "@/lib/services/trips";
import { prisma } from "@/lib/db";
import * as expenseService from "@/lib/services/expenses";
import { AddExpenseForm } from "@/components/expenses/AddExpenseForm";
import { ExpenseRow } from "@/components/expenses/ExpenseRow";
import { BalancesPanel } from "@/components/expenses/BalancesPanel";
import { SettlementPanel } from "@/components/expenses/SettlementPanel";

interface ExpensesPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function ExpensesPage({ params }: ExpensesPageProps) {
  const { tripId } = await params;
  const user = await getCurrentUser();

  const [trip, membership, expenses, balances, settlement, categories, memberships] =
    await Promise.all([
      getTripForMember(tripId, user!.id),
      getTripMembership(tripId, user!.id),
      expenseService.listExpenses(tripId, user!.id),
      expenseService.getBalances(tripId, user!.id),
      expenseService.getSettlement(tripId, user!.id),
      prisma.budgetCategory.findMany({
        where: { tripId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.tripMembership.findMany({
        where: { tripId, status: "ACCEPTED" },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);

  const isOwner = membership?.role === "OWNER";
  const members = memberships.map((m) => ({
    id: m.userId,
    name: m.user.name,
    email: m.user.email,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-medium text-zinc-900">Expenses</h2>

      {expenses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          No expenses recorded yet — add the first one below.
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200">
          {expenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              tripId={tripId}
              id={expense.id}
              description={expense.description}
              amount={expense.amount.toFixed(2)}
              currency={trip.currency}
              paidById={expense.paidById}
              paidByName={expense.paidBy.name}
              categoryId={expense.categoryId}
              splitType={expense.splitType}
              shares={expense.shares.map((s) => ({
                userId: s.userId,
                name: s.user.name,
                amountOwed: s.amountOwed.toFixed(2),
              }))}
              members={members}
              categories={categories}
              canEdit={isOwner || expense.paidById === user!.id}
            />
          ))}
        </ul>
      )}

      <AddExpenseForm
        tripId={tripId}
        currency={trip.currency}
        members={members}
        categories={categories}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-zinc-700">Balances</h3>
          <BalancesPanel currency={trip.currency} balances={balances} />
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-zinc-700">Settlement</h3>
          <SettlementPanel currency={trip.currency} transactions={settlement} />
        </div>
      </div>
    </div>
  );
}
