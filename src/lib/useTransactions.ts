import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { rangeStart, todayISO, type RangeKey, type Transaction } from "@/lib/rugira";

async function fetchRange(from: string, to: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .gte("sale_date", from)
    .lte("sale_date", to)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Transaction[];
}

export function useTransactions(range: RangeKey) {
  const from = rangeStart(range);
  const to = todayISO();
  return useQuery({
    queryKey: ["transactions", from, to],
    queryFn: () => fetchRange(from, to),
    staleTime: 10_000,
  });
}

export const transactionsKey = ["transactions"];
