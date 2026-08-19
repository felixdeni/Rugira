import { categoryLabel, money, type Transaction } from "@/lib/rwema";

export function TransactionList({ rows, showBoss }: { rows: Transaction[]; showBoss: boolean }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No transactions in this period.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="text-muted-foreground">
          <tr>
            <th className="py-2 font-medium">Category</th>
            <th className="py-2 font-medium">Date</th>
            <th className="py-2 text-right font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Gross</th>
            <th className="py-2 text-right font-medium">Net</th>
            <th className="py-2 text-right font-medium">Emp 40%</th>
            {showBoss ? <th className="py-2 text-right font-medium">Boss 60%</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border/60">
              <td className="py-2 font-medium">{categoryLabel(r.category)}</td>
              <td className="py-2 text-muted-foreground">{r.sale_date}</td>
              <td className="py-2 text-right">{r.quantity}</td>
              <td className="py-2 text-right">{money(Number(r.gross))}</td>
              <td className="py-2 text-right">{money(Number(r.net))}</td>
              <td className="py-2 text-right">{money(Number(r.employee_amount))}</td>
              {showBoss ? <td className="py-2 text-right">{money(Number(r.boss_amount))}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
