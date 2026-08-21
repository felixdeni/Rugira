import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, Loader2, Smartphone } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, StatCard } from "@/components/ui";
import { TransactionList } from "@/components/TransactionList";
import { useAuth } from "@/lib/useAuth";
import { useTransactions } from "@/lib/useTransactions";
import { money, newSimQuantity, RANGE_LABELS, rangeStart, sumTotals, todayISO, totalsByCategory, type RangeKey } from "@/lib/rugira";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "RUGIRA Reports | Daily, Weekly, Monthly, Yearly" },
      { name: "description", content: "RUGIRA sales reports by period and category with employee 40% and boss 60% earnings." },
      { property: "og:title", content: "RUGIRA Reports" },
      { property: "og:description", content: "Daily, weekly, monthly and yearly RUGIRA sales reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reports,
});

function Reports() {
  const { role, fullName } = useAuth();
  const ranges: RangeKey[] = role === "boss" ? ["daily", "weekly", "monthly", "yearly"] : ["daily", "weekly"];
  const [range, setRange] = useState<RangeKey>("daily");
  const active = ranges.includes(range) ? range : "daily";
  const { data, isLoading, error } = useTransactions(active);
  const rows = data ?? [];
  const totals = sumTotals(rows);
  const newSims = newSimQuantity(rows);

  return (
    <AppShell role={role} name={fullName}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            {rangeStart(active)} → {todayISO()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-2xl px-4 py-2 text-sm font-semibold transition",
                active === r
                  ? "brand-gradient text-primary-foreground shadow-md shadow-primary/25"
                  : "border border-border bg-card/60 text-muted-foreground hover:text-foreground",
              )}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <Card className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" /> Loading report…
          </Card>
        ) : error ? (
          <Card className="text-destructive">Could not load report: {(error as Error).message}</Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Gross" value={money(totals.gross)} icon={<BarChart3 className="size-5" />} hint={`${totals.count} transactions`} />
              <StatCard label="Net" value={money(totals.net)} tone="sky" icon={<BarChart3 className="size-5" />} hint={`Airtel Money ${money(totals.airtime)}`} />
              <StatCard label="Employee 40%" value={money(totals.employee)} tone="yellow" icon={<BarChart3 className="size-5" />} />
              {role === "boss" ? (
                <StatCard label="Boss 60%" value={money(totals.boss)} icon={<BarChart3 className="size-5" />} />
              ) : (
                <StatCard label="Items sold" value={String(totals.quantity)} icon={<BarChart3 className="size-5" />} />
              )}
            </div>

            {role === "boss" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <StatCard
                  label="Total New SIM Cards"
                  value={String(newSims)}
                  tone="sky"
                  icon={<Smartphone className="size-5" />}
                  hint={`${RANGE_LABELS[active]} period`}
                />
                <StatCard label="Items sold" value={String(totals.quantity)} tone="yellow" icon={<BarChart3 className="size-5" />} />
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {totalsByCategory(rows).map((c) => (
                <Card key={c.category} className="space-y-1">
                  <p className="font-display font-bold">{c.label}</p>
                  <p className="text-xl font-bold brand-text">{money(c.totals.gross)}</p>
                  <p className="text-sm text-muted-foreground">Quantity: {c.totals.quantity}</p>
                  <p className="text-sm text-muted-foreground">Net: {money(c.totals.net)}</p>
                  <p className="text-sm text-muted-foreground">Employee 40%: {money(c.totals.employee)}</p>
                  {role === "boss" ? (
                    <p className="text-sm text-muted-foreground">Boss 60%: {money(c.totals.boss)}</p>
                  ) : null}
                </Card>
              ))}
            </div>

            <Card className="space-y-3">
              <h2 className="font-display text-lg font-bold">{RANGE_LABELS[active]} transactions</h2>
              <TransactionList rows={rows} showBoss={role === "boss"} />
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
