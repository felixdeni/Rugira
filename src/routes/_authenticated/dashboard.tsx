import { createFileRoute, Link } from "@tanstack/react-router";
import { Coins, Layers, Loader2, PlusCircle, Receipt, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, StatCard } from "@/components/ui";
import { useAuth } from "@/lib/useAuth";
import { useTransactions } from "@/lib/useTransactions";
import { money, sumTotals, totalsByCategory } from "@/lib/rwema";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Rwema Dashboard | Today's Sales & Earnings" },
      { name: "description", content: "Live Rwema dashboard with today's sales, category totals and 40/60 earnings split." },
      { property: "og:title", content: "Rwema Dashboard" },
      { property: "og:description", content: "Today's sales, category totals and earnings in Rwema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { role, fullName } = useAuth();
  const { data, isLoading, error } = useTransactions("daily");
  const rows = data ?? [];
  const totals = sumTotals(rows);
  const byCategory = totalsByCategory(rows);

  return (
    <AppShell role={role} name={fullName}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Today</h1>
            <p className="text-sm text-muted-foreground">
              {role === "boss" ? "All sales recorded today" : "Your sales recorded today"}
            </p>
          </div>
          {role === "employee" ? (
            <Link to="/record">
              <Button>
                <PlusCircle className="size-4" />
                Record sale
              </Button>
            </Link>
          ) : null}
        </div>

        {isLoading ? (
          <Card className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" /> Loading live data…
          </Card>
        ) : error ? (
          <Card className="text-destructive">Could not load sales: {(error as Error).message}</Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Gross sales" value={money(totals.gross)} icon={<Receipt className="size-5" />} hint={`${totals.count} transactions`} />
              <StatCard label="Net (after airtime)" value={money(totals.net)} tone="sky" icon={<Layers className="size-5" />} hint={`Airtime ${money(totals.airtime)}`} />
              <StatCard label="Employee 40%" value={money(totals.employee)} tone="yellow" icon={<Wallet className="size-5" />} />
              {role === "boss" ? (
                <StatCard label="Boss 60%" value={money(totals.boss)} icon={<Coins className="size-5" />} />
              ) : (
                <StatCard label="Items sold" value={String(totals.quantity)} icon={<Coins className="size-5" />} />
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {byCategory.map((c) => (
                <Card key={c.category} className="space-y-2">
                  <p className="font-display font-bold">{c.label}</p>
                  <p className="text-2xl font-bold brand-text">{money(c.totals.gross)}</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Quantity: {c.totals.quantity}</p>
                    <p>Net: {money(c.totals.net)}</p>
                    <p>Employee 40%: {money(c.totals.employee)}</p>
                    {role === "boss" ? <p>Boss 60%: {money(c.totals.boss)}</p> : null}
                  </div>
                </Card>
              ))}
            </div>

            <Card className="space-y-3">
              <h2 className="font-display text-lg font-bold">Today's transactions</h2>
              <TransactionList rows={rows} showBoss={role === "boss"} />
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}

export function TransactionList({
  rows,
  showBoss,
}: {
  rows: ReturnType<typeof sumTotals> extends never ? never : import("@/lib/rwema").Transaction[];
  showBoss: boolean;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No transactions yet.</p>;
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
              <td className="py-2 font-medium">{categoryName(r.category)}</td>
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

function categoryName(c: string) {
  if (c === "new_sim") return "New SIM Card";
  if (c === "sim_swap") return "SIM Swap";
  return "Movies & Songs";
}
