interface SettlementPanelProps {
  currency: string;
  transactions: { fromName: string | null; toName: string | null; amountCents: number }[];
}

export function SettlementPanel({ currency, transactions }: SettlementPanelProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-sage-300 p-4 text-center text-sm text-sage-500">
        Everyone is settled up.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-sage-200 rounded-lg border border-sage-200">
      {transactions.map((t, i) => {
        const dollars = Math.floor(t.amountCents / 100);
        const cents = (t.amountCents % 100).toString().padStart(2, "0");
        return (
          <li key={i} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="font-medium text-sage-900">{t.fromName ?? "Unknown"}</span>
              <span className="text-sage-400">→</span>
              <span className="font-medium text-sage-900">{t.toName ?? "Unknown"}</span>
            </div>
            <span className="text-sm font-medium text-sage-900">
              {currency} {dollars}.{cents}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
