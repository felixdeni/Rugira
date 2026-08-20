export type SaleCategory = "new_sim" | "sim_swap" | "movies_songs" | "phone_software";

export const EMPLOYEE_SHARE = 0.4;
export const BOSS_SHARE = 0.6;

/** All dates and times in Rwema are Africa/Kigali. */
export const TIME_ZONE = "Africa/Kigali";

export const CATEGORIES: {
  value: SaleCategory;
  label: string;
  hasAirtime: boolean;
}[] = [
  { value: "new_sim", label: "New SIM Card", hasAirtime: true },
  { value: "sim_swap", label: "SIM Swap", hasAirtime: false },
  { value: "movies_songs", label: "Movies & Songs", hasAirtime: false },
  { value: "phone_software", label: "Phone Software", hasAirtime: false },
];

export function categoryLabel(value: SaleCategory) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export type Transaction = {
  id: string;
  user_id: string;
  category: SaleCategory;
  quantity: number;
  price: number;
  airtime: number;
  sale_date: string;
  note: string | null;
  gross: number;
  net: number;
  employee_amount: number;
  boss_amount: number;
  created_at: string;
};

/** Mirrors the database generated columns exactly. */
export function computeSale(input: {
  category: SaleCategory;
  quantity: number;
  price: number;
  airtime: number;
}) {
  const gross = round2(input.quantity * input.price);
  const net = round2(input.category === "new_sim" ? gross - input.airtime : gross);
  return {
    gross,
    net,
    employee: round2(net * EMPLOYEE_SHARE),
    boss: round2(net * BOSS_SHARE),
  };
}

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export type Totals = {
  count: number;
  quantity: number;
  gross: number;
  airtime: number;
  net: number;
  employee: number;
  boss: number;
};

export function emptyTotals(): Totals {
  return { count: 0, quantity: 0, gross: 0, airtime: 0, net: 0, employee: 0, boss: 0 };
}

export function sumTotals(rows: Transaction[]): Totals {
  return rows.reduce((acc, r) => {
    acc.count += 1;
    acc.quantity += Number(r.quantity);
    acc.gross += Number(r.gross);
    acc.airtime += Number(r.airtime);
    acc.net += Number(r.net);
    acc.employee += Number(r.employee_amount);
    acc.boss += Number(r.boss_amount);
    return acc;
  }, emptyTotals());
}

export function totalsByCategory(rows: Transaction[]) {
  return CATEGORIES.map((c) => ({
    category: c.value,
    label: c.label,
    totals: sumTotals(rows.filter((r) => r.category === c.value)),
  }));
}

/** Total quantity of real New SIM Card transactions in the given rows. */
export function newSimQuantity(rows: Transaction[]) {
  return rows.filter((r) => r.category === "new_sim").reduce((n, r) => n + Number(r.quantity), 0);
}

const currency = new Intl.NumberFormat("en-RW", {
  style: "currency",
  currency: "RWF",
  maximumFractionDigits: 0,
});

export function money(n: number) {
  return currency.format(Number.isFinite(n) ? n : 0);
}

/** Date in YYYY-MM-DD, always in Africa/Kigali. */
export function todayISO(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Exact time of a transaction (Africa/Kigali), e.g. 14:35. */
export function saleTime(iso: string) {
  return timeFmt.format(new Date(iso));
}

/** Date + exact time (Africa/Kigali). */
export function saleDateTime(iso: string) {
  return `${todayISO(new Date(iso))} ${saleTime(iso)}`;
}

export type RangeKey = "daily" | "weekly" | "monthly" | "yearly";

export function rangeStart(key: RangeKey, now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (key) {
    case "daily":
      return todayISO(d);
    case "weekly": {
      const day = (d.getDay() + 6) % 7; // Monday start
      d.setDate(d.getDate() - day);
      return todayISO(d);
    }
    case "monthly":
      return todayISO(new Date(now.getFullYear(), now.getMonth(), 1));
    case "yearly":
      return todayISO(new Date(now.getFullYear(), 0, 1));
  }
}

export const RANGE_LABELS: Record<RangeKey, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};
