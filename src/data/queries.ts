import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { sampleDailyRows, sampleMonthlyRows, sampleWeeklyRows } from "@/fixtures/sample-rows";
import type { Row } from "@/lib/types";
import { hasSupabaseEnv, supabase } from "@/data/supabase";

const fetchRows = async (table: string): Promise<Row[]> => {
  if (!hasSupabaseEnv) {
    if (table === "weekly_metrics") return sampleWeeklyRows;
    if (table === "monthly_metrics") return sampleMonthlyRows;
    return sampleDailyRows;
  }

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("ngay", { ascending: false })
    .limit(22);

  if (error) {
    throw error;
  }

  return [...(data ?? [])].reverse() as Row[];
};

export const useDaily = (): UseQueryResult<Row[]> =>
  useQuery({
    queryKey: ["daily"],
    queryFn: () => fetchRows("daily_metrics"),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

export const useWeekly = (): UseQueryResult<Row[]> =>
  useQuery({
    queryKey: ["weekly"],
    queryFn: () => fetchRows("weekly_metrics"),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

export const useMonthly = (): UseQueryResult<Row[]> =>
  useQuery({
    queryKey: ["monthly"],
    queryFn: () => fetchRows("monthly_metrics"),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
