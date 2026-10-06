import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, Loader2, Smartphone } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, StatCard } from "@/components/ui";
import { TransactionList } from "@/components/TransactionList";
import { useAuth } from "@/lib/useAuth";
import { useTransactions } from "@/lib/useTransactions";
import {
  addWeeks,
  money,
  newSimQuantity,
  RANGE_LABELS,
  rangeStart,
  sumTotals,
  todayISO,
  totalsByCategory,
  weekEndISO,
  weekLabel,
  weekStartISO,
  type RangeKey,
} from "@/lib/rugira";
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

  // Anchor date used to pick the week. Defaults to today.
  const [weekAnchorISO, setWeekAnchorISO] = useState<string>(todayISO());

  const { data, isLoading, error } = useTransactions(active);
  const rows = data ?? [];

  // Compute selected week's Monday → Sunday (Africa/Kigali).
  const weekStart = useMemo(() => weekStartISO(new Date(weekAnchorISO)), [weekAnchorISO]);
  const weekEnd = useMemo(() => weekEndISO(new Date(weekAnchorISO)), [weekAnchorISO]);

  // Current real week (based on today).
  const currentWeekStart = useMemo(() => weekStartISO(new Date()), []);
  const isCurrentWeek = weekStart === currentWeekStart;

  // Filter rows to the selected week when in weekly mode.
  const filteredRows = useMemo(() => {
    if (active !== "weekly") return rows;
    return rows.filter((r) => {
      const d = todayISO(new Date(r.sale_date));
      return d >= weekStart && d <= weekEnd;
    });
  }, [rows, active, weekStart, weekEnd]);

  // Sort transactions by date (newest first) for the weekly view
  const sortedRows = useMemo(() => {
    if (active !== "weekly") return filteredRows;
    return [...filteredRows].sort(
      (a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
    );
  }, [filteredRows, active]);

  const totals = sumTotals(filteredRows);
  const newSims = newSimQuantity(filteredRows);

  // Week navigation handlers.
  function goPrevWeek() {
    setWeekAnchorISO(todayISO(addWeeks(new Date(weekAnchorISO), -1)));
  }
  function goNextWeek() {
    setWeekAnchorISO(todayISO(addWeeks(new Date(weekAnchorISO), 1)));
  }
  function goThisWeek() {
    setWeekAnchorISO(todayISO());
  }

  // Quick-pick: jump to a specific week offset from current
  function goToWeekOffset(weeksAgo: number) {
    setWeekAnchorISO(todayISO(addWeeks(new Date(), -weeksAgo)));
  }

  return (
    <AppShell role={role} name={fullName}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            {active === "weekly"
              ? `${weekStart} → ${weekEnd}`
              : `${rangeStart(active)} → ${todayISO()}`}
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

        {active === "weekly" ? (
          <Card className="space-y-4">
            {/* Week selector header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">
                    {isCurrentWeek ? "Current week" : "Selected week"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {weekLabel(weekStart, weekEnd)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={goPrevWeek}
                  className="flex items-center gap-1 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm font-semibold hover:text-foreground"
                >
                  <ChevronLeft className="size-4" /> Previous
                </button>

                <button
                  onClick={goThisWeek}
                  disabled={isCurrentWeek}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-semibold transition",
                    isCurrentWeek
                      ? "cursor-not-allowed border border-border bg-card/40 text-muted-foreground/60"
                      : "border border-border bg-card/60 hover:text-foreground",
                  )}
                >
                  This week
                </button>

                <button
                  onClick={goNextWeek}
                  className="flex items-center gap-1 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm font-semibold hover:text-foreground"
                >
                  Next <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            {/* Date picker to select week + quick picks */}
            <div className="flex flex-wrap items-end gap-4 border-t border-border pt-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold">Pick any date in the week</span>
                <input
                  type="date"
                  value={weekAnchorISO}
                  max={todayISO()}
                  onChange={(e) => setWeekAnchorISO(e.target.value || todayISO())}
                  className="rounded-xl border border-border bg-card/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
              </label>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Quick pick</span>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={goThisWeek}
                    className="rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-xs font-semibold hover:text-foreground"
                  >
                    This week
                  </button>
                  <button
                    onClick={() => goToWeekOffset(1)}
                    className="rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-xs font-semibold hover:text-foreground"
                  >
                    Last week
                  </button>
                  <button
                    onClick={() => goToWeekOffset(2)}
                    className="rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-xs font-semibold hover:text-foreground"
                  >
                    2 weeks ago
                  </button>
                  <button
                    onClick={() => goToWeekOffset(4)}
                    className="rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-xs font-semibold hover:text-foreground"
                  >
                    4 weeks ago
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Any date you pick is snapped to that week's Monday → Sunday.
              </p>
            </div>

            {/* Weekly totals summary strip */}
            {!isLoading && !error && (
              <div className="flex flex-wrap gap-4 rounded-2xl border border-border bg-card/40 p-3 text-sm">
                <span>
                  <span className="text-muted-foreground">Transactions: </span>
                  <span className="font-bold">{totals.count}</span>
                </span>
                <span>
                  <span className="text-muted-foreground">Gross: </span>
                  <span className="font-bold brand-text">{money(totals.gross)}</span>
                </span>
                <span>
                  <span className="text-muted-foreground">Net: </span>
                  <span className="font-bold">{money(totals.net)}</span>
                </span>
                <span>
                  <span className="text-muted-foreground">Items: </span>
                  <span className="font-bold">{totals.quantity}</span>
                </span>
              </div>
            )}
          </Card>
        ) : null}

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
              {totalsByCategory(filteredRows).map((c) => (
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold">
                  {active === "weekly"
                    ? `Week ${weekLabel(weekStart, weekEnd)} transactions`
                    : `${RANGE_LABELS[active]} transactions`}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {sortedRows.length} transaction{sortedRows.length === 1 ? "" : "s"} · Gross {money(totals.gross)}
                </p>
              </div>
              <TransactionList rows={sortedRows} showBoss={role === "boss"} />
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}