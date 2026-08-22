import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { rangeStart, todayISO } from "@/lib/rugira";

export type NewSimStats = {
  allTime: number;
  today: number;
  week: number;
  month: number;
  year: number;
};

async function quantitySince(from?: string) {
  let query = supabase.from("transactions").select("quantity, sale_date").eq("category", "new_sim");
  if (from) query = query.gte("sale_date", from);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).reduce((n, r) => n + Number(r.quantity), 0);
}

/** Real New SIM Card quantities straight from the transactions table. */
export function useNewSimStats() {
  return useQuery<NewSimStats>({
    queryKey: ["new-sim-stats", todayISO()],
    staleTime: 10_000,
    queryFn: async () => {
      const [allTime, today, week, month, year] = await Promise.all([
        quantitySince(),
        quantitySince(rangeStart("daily")),
        quantitySince(rangeStart("weekly")),
        quantitySince(rangeStart("monthly")),
        quantitySince(rangeStart("yearly")),
      ]);
      return { allTime, today, week, month, year };
    },
  });
}
