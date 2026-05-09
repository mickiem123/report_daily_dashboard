import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const LAST_REFRESH_KEY = "ssi-last-refresh-date";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function useAutoStaleRefresh(enabled: boolean) {
  const queryClient = useQueryClient();
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (!enabled || hasRunRef.current || typeof window === "undefined") return;
    hasRunRef.current = true;
    const storage = window.localStorage as Partial<Storage>;
    if (typeof storage.getItem !== "function" || typeof storage.setItem !== "function") return;

    const today = getTodayKey();
    const lastRefreshDate = storage.getItem(LAST_REFRESH_KEY);
    if (lastRefreshDate === today) return;

    void Promise.all([
      queryClient.invalidateQueries({ queryKey: ["daily"] }),
      queryClient.invalidateQueries({ queryKey: ["weekly"] }),
      queryClient.invalidateQueries({ queryKey: ["monthly"] }),
    ]);
    storage.setItem(LAST_REFRESH_KEY, today);
  }, [enabled, queryClient]);
}
