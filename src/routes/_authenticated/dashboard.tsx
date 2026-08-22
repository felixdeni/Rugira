import { createFileRoute, Link } from "@tanstack/react-router";
import { Coins, Layers, Loader2, PlusCircle, Receipt, Smartphone, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TransactionList } from "@/components/TransactionList";
import { Button, Card, StatCard } from "@/components/ui";
import { useAuth } from "@/lib/useAuth";
import { useTransactions } from "@/lib/useTransactions";
import { money, newSimQuantity, sumTotals, totalsByCategory } from "@/lib/rugira";
import { useNewSimStats } from "@/lib/useNewSimStats";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "RUGIRA Dashboard | Today's Sales & Earnings" },
      { name: "description", content: "Live RUGIRA dashboard with today's sales, category totals and 40/60 earnings split." },
      { property: "og:title", content: "RUGIRA Dashboard" },
      { property: "og:description", content: "Today's sales, category totals and earnings in RUGIRA." },
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
  const newSims = newSimQuantity(rows);

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
              <StatCard label="Net (after Airtel Money)" value={money(totals.net)} tone="sky" icon={<Layers className="size-5" />} hint={`Airtel Money ${money(totals.airtime)}`} />
              <StatCard label="Employee 40%" value={money(totals.employee)} tone="yellow" icon={<Wallet className="size-5" />} />
              {role === "boss" ? (
                <StatCard label="Boss 60%" value={money(totals.boss)} icon={<Coins className="size-5" />} />
              ) : (
                <StatCard label="Items sold" value={String(totals.quantity)} icon={<Coins className="size-5" />} />
              )}
            </div>

            {role === "boss" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <StatCard
                    label="Total New SIM Cards"
                    value={String(newSims)}
                    tone="sky"
                    icon={<Smartphone className="size-5" />}
                    hint="Quantity recorded today"
                  />
                  <StatCard label="Items sold" value={String(totals.quantity)} tone="yellow" icon={<Coins className="size-5" />} />
                </div>
                <NewSimStatistics />
              </>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

function NewSimStatistics() {
  const { data, isLoading } = useNewSimStats();

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <Smartphone className="size-5 text-primary" />
        <h2 className="font-display text-lg font-bold">New SIM Card statistics</h2>
      </div>
      {isLoading || !data ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading live totals…
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "All time", value: data.allTime },
            { label: "Today", value: data.today },
            { label: "This week", value: data.week },
            { label: "This month", value: data.month },
            { label: "This year", value: data.year },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card/60 p-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold brand-text">{s.value}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
