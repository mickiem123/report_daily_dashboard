import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useDebouncedSave<T>(saveFn: (val: T) => Promise<void>, delay = 1000) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValueRef = useRef<T | null>(null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  const trigger = useCallback(
    (value: T) => {
      latestValueRef.current = value;
      if (timerRef.current) clearTimeout(timerRef.current);
      setStatus("idle");
      setError(null);
      timerRef.current = setTimeout(async () => {
        const payload = latestValueRef.current;
        if (payload === null) return;
        setStatus("saving");
        try {
          await saveFn(payload);
          setStatus("saved");
          setError(null);
        } catch (err) {
          const normalized = err instanceof Error ? err : new Error("Save failed");
          setStatus("error");
          setError(normalized);
        }
      }, delay);
    },
    [delay, saveFn]
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  return { save: trigger, status, error };
}
