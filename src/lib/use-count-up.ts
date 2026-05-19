import { useEffect, useState } from "react";

const NUMBER_PATTERN = /-?\d+(?:[.,]\d+)*/;

const looksLikeThousandGroups = (value: string, separator: "." | ","): boolean => {
  const [head, ...rest] = value.split(separator);
  return rest.length > 0 && head.length >= 1 && rest.every((group) => group.length === 3);
};

const extractNumber = (value: string): number | null => {
  const matched = value.match(NUMBER_PATTERN);
  if (!matched) return null;
  const raw = matched[0];
  let normalized = raw;

  if (raw.includes(".") && raw.includes(",")) {
    normalized = raw.replace(/\./g, "").replace(",", ".");
  } else if (raw.includes(",")) {
    normalized = looksLikeThousandGroups(raw, ",") ? raw.replace(/,/g, "") : raw.replace(",", ".");
  } else if (raw.includes(".") && looksLikeThousandGroups(raw, ".")) {
    normalized = raw.replace(/\./g, "");
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const decimalPlaces = (value: string): number => {
  const matched = value.match(NUMBER_PATTERN)?.[0];
  if (!matched) return 0;
  if (matched.includes(",")) return matched.split(",").pop()?.length ?? 0;
  if (matched.includes(".") && !looksLikeThousandGroups(matched, ".")) return matched.split(".").pop()?.length ?? 0;
  return 0;
};

const applyNumber = (template: string, value: number, precision: number): string =>
  template.replace(NUMBER_PATTERN, value.toLocaleString("vi-VN", { minimumFractionDigits: precision, maximumFractionDigits: precision }));

export const useCountUp = (finalValue: string, enabled: boolean, duration = 1200): string => {
  const target = extractNumber(finalValue);
  const precision = decimalPlaces(finalValue);
  const [displayValue, setDisplayValue] = useState(() => (enabled && target !== null ? applyNumber(finalValue, 0, precision) : finalValue));

  useEffect(() => {
    if (!enabled || target === null) return;
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const current = target * eased;
      setDisplayValue(applyNumber(finalValue, current, precision));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, enabled, finalValue, precision, target]);

  return enabled && target !== null ? displayValue : finalValue;
};
