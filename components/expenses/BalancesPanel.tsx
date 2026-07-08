interface BalancesPanelProps {
  currency: string;
  balances: { userId: string; name: string | null; netBalanceCents: number }[];
}

export function BalancesPanel({ currency, balances }: BalancesPanelProps) {
  if (balances.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-sage-300 p-4 text-center text-sm text-sage-500">
        No expenses yet — balances will appear here.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-sage-200 rounded-lg border border-sage-200">
      {balances.map((b) => {
        const abs = Math.abs(b.netBalanceCents);
        const dollars = Math.floor(abs / 100);
        const cents = (abs % 100).toString().padStart(2, "0");
        const isPositive = b.netBalanceCents > 0;
        const isZero = b.netBalanceCents === 0;

        return (
          <li key={b.userId} className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-medium text-sage-900">{b.name ?? "Unknown"}</p>
            <span
              className={`text-sm font-medium ${
                isZero ? "text-sage-400" : isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {isZero
                ? "Settled"
                : `${isPositive ? "+" : "-"}${currency} ${dollars}.${cents}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
