import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { useTransactions } from "@/lib/useTransactions";
import {
  CATEGORIES,
  categoryLabel,
  computeSale,
  money,
  saleTime,
  sumTotals,
  todayISO,
  type SaleCategory,
} from "@/lib/rwema";

export const Route = createFileRoute("/_authenticated/record")({
  head: () => ({
    meta: [
      { title: "Record Today's Sales | Rwema" },
      { name: "description", content: "Record today's New SIM Card, SIM Swap and Movies & Songs sales in Rwema." },
      { property: "og:title", content: "Record Today's Sales | Rwema" },
      { property: "og:description", content: "Fast daily sales entry with automatic 40/60 earnings calculation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RecordPage,
});

function RecordPage() {
  const { role, fullName, user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useTransactions("daily");
  const rows = (data ?? []).filter((r) => r.user_id === user?.id);

  const [category, setCategory] = useState<SaleCategory>("new_sim");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [airtime, setAirtime] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const qty = Number(quantity) || 0;
  const unitPrice = Number(price) || 0;
  const air = category === "new_sim" ? Number(airtime) || 0 : 0;
  const preview = computeSale({ category, quantity: qty, price: unitPrice, airtime: air });

  if (role && role !== "employee") {
    return (
      <AppShell role={role} name={fullName}>
        <Card>
          <h1 className="text-xl font-bold">Sales recording is for employees</h1>
          <p className="text-sm text-muted-foreground">As Boss you can view all sales and reports.</p>
        </Card>
      </AppShell>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0) {
      toast.error("Enter a quantity greater than zero.");
      return;
    }
    if (category !== "new_sim" && unitPrice <= 0) {
      toast.error("Enter a price greater than zero.");
      return;
    }
    if (category === "new_sim" && air <= 0) {
      toast.error("Airtime is never free — enter the airtime amount.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: user!.id,
      category,
      quantity: qty,
      price: unitPrice,
      airtime: air,
      sale_date: todayISO(),
      note: description.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Sale recorded");
    setQuantity("1");
    setPrice("");
    setAirtime("");
    setDescription("");
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Transaction removed");
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  };

  const totals = sumTotals(rows);

  return (
    <AppShell role={role} name={fullName}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Record today's sale</h1>
          <p className="text-sm text-muted-foreground">Only today's transactions can be recorded ({todayISO()}).</p>
        </div>

        <Card>
          <form className="space-y-4" onSubmit={submit}>
            <Field label="Category">
              <Select value={category} onChange={(e) => setCategory(e.target.value as SaleCategory)}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Quantity">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </Field>
              <Field label={category === "new_sim" ? "SIM price (can be 0)" : "Price"}>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required={category !== "new_sim"}
                />
              </Field>
            </div>

            {category === "new_sim" ? (
              <Field label="Airtime (required, never free)">
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0"
                  value={airtime}
                  onChange={(e) => setAirtime(e.target.value)}
                  required
                />
              </Field>
            ) : null}

            <Field label="Description (optional)">
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any extra detail about this sale"
                maxLength={280}
              />
            </Field>

            <div className="grid gap-2 rounded-2xl bg-muted/70 p-4 text-sm sm:grid-cols-2">
              <p>Gross: <span className="font-semibold">{money(preview.gross)}</span></p>
              <p>Net: <span className="font-semibold">{money(preview.net)}</span></p>
              <p>Employee 40%: <span className="font-semibold text-primary">{money(preview.employee)}</span></p>
              <p>Boss 60%: <span className="font-semibold text-secondary">{money(preview.boss)}</span></p>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="size-5 animate-spin" /> : <PlusCircle className="size-5" />}
              Save transaction
            </Button>
          </form>
        </Card>

        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold">Recorded today</h2>
            <p className="text-sm text-muted-foreground">
              Gross {money(totals.gross)} · Your 40% {money(totals.employee)}
            </p>
          </div>
          {isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing recorded yet today.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{categoryLabel(r.category)}</p>
                    <p className="text-xs text-muted-foreground">
                      {saleTime(r.created_at)} · {r.quantity} × {money(Number(r.price))}
                      {r.category === "new_sim" ? ` · airtime ${money(Number(r.airtime))}` : ""}
                    </p>
                    {r.note ? <p className="truncate text-xs text-muted-foreground">{r.note}</p> : null}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{money(Number(r.net))}</p>
                    <p className="text-xs text-primary">40%: {money(Number(r.employee_amount))}</p>
                  </div>
                  <Button variant="ghost" size="sm" aria-label="Delete transaction" onClick={() => remove(r.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
