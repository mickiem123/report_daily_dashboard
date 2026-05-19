import { supabase } from "@/data/supabase";
import type { Mode, Row } from "@/lib/types";

const tableByMode: Record<Mode, string> = {
  daily: "daily_metrics",
  weekly: "weekly_metrics",
  monthly: "monthly_metrics",
};

export const upsertRow = async (
  mode: Mode,
  row: Partial<Row> & { ngay: string },
): Promise<void> => {
  const table = tableByMode[mode];
  const { error } = await supabase.from(table).upsert(row, { onConflict: "ngay" });

  if (error) {
    throw error;
  }
};

export const deleteRow = async (mode: Mode, ngay: string): Promise<void> => {
  const table = tableByMode[mode];
  const { error } = await supabase.from(table).delete().eq("ngay", ngay);

  if (error) {
    throw error;
  }
};
