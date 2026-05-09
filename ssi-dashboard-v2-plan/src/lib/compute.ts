import type { Row } from "@/lib/types";

const ERR_THRESHOLD = -2_000_000_000;

export function clean(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return null;
  if (v instanceof Date) return null;
  if (typeof v !== "number" || Number.isNaN(v) || v < ERR_THRESHOLD) return null;
  return v;
}

export function normalizeUnit(unit: string): string {
  if (unit === "tá»·" || unit === "tÃ¡Â»Â·") return "tỷ";
  return unit;
}

export function fmt(v: unknown, unit: string): string {
  const value = clean(v);
  const normalizedUnit = normalizeUnit(unit);
  if (value === null) return "N/A";
  if (normalizedUnit === "%") return `${(value * 100).toFixed(2).replace(".", ",")}%`;
  if (normalizedUnit === "tỷ") return `${Math.round(value).toLocaleString("vi-VN")} tỷ`;
  return `${Math.round(value).toLocaleString("vi-VN")}`;
}

export function diff(
  today: unknown,
  prev: unknown,
  unit: string
): { verb: string; prep: string; valStr: string; deltaStr: string; pctDelta: number } {
  const normalizedUnit = normalizeUnit(unit);
  const a = clean(today);
  const b = clean(prev);
  if (a === null || b === null) {
    return { verb: "N/A", prep: "", valStr: "N/A", deltaStr: "", pctDelta: 0 };
  }

  const absDelta = a - b;
  const pctDelta = b === 0 ? 0 : (absDelta / b) * 100;
  let verb = "giữ nguyên mức";
  let prep = "";
  if (pctDelta > 5) {
    verb = "tăng mạnh";
    prep = "lên";
  } else if (pctDelta > 0) {
    verb = "tăng";
    prep = "lên";
  } else if (pctDelta < -5) {
    verb = "giảm mạnh";
    prep = "về";
  } else if (pctDelta < 0) {
    verb = "giảm";
    prep = "về";
  }

  if (normalizedUnit === "%" && prep === "lên") prep = "lên mức";
  if (normalizedUnit === "%" && prep === "về") prep = "về mức";

  const sign = absDelta >= 0 ? "+" : "-";
  const absAbs = Math.abs(absDelta);
  let deltaStr = "";
  if (normalizedUnit === "%") {
    deltaStr = `(${sign}${(absAbs * 100).toFixed(2).replace(".", ",")}%)`;
  } else if (normalizedUnit === "tỷ") {
    deltaStr = `(${sign}${Math.round(absAbs).toLocaleString("vi-VN")} tỷ, ${sign}${Math.abs(pctDelta)
      .toFixed(2)
      .replace(".", ",")}%)`;
  } else {
    const unitLabel = normalizedUnit === "KH" || normalizedUnit === "HĐ" || normalizedUnit === "tài khoản" ? normalizedUnit : "KH";
    deltaStr = `(${sign}${Math.round(absAbs).toLocaleString("vi-VN")} ${unitLabel}, ${sign}${Math.abs(pctDelta)
      .toFixed(2)
      .replace(".", ",")}%)`;
  }

  return { verb, prep, valStr: fmt(a, normalizedUnit), deltaStr, pctDelta };
}

export function median(xs: Array<number | null | undefined>): number | null {
  const arr = xs.filter((x): x is number => x !== null && x !== undefined).sort((m, n) => m - n);
  if (!arr.length) return null;
  const i = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[i] : (arr[i - 1] + arr[i]) / 2;
}

export function mad(xs: Array<number | null | undefined>): number {
  const med = median(xs);
  if (med === null) return 0;
  const dev = xs.filter((x): x is number => x !== null && x !== undefined).map((x) => Math.abs(x - med));
  return median(dev) ?? 0;
}

export function robustZ(value: number, history: Array<number | null | undefined>): number {
  const arr = history.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  if (!arr.length || !Number.isFinite(value)) return 0;
  const med = median(arr);
  const m = mad(arr);
  if (med === null || m === 0) return 0;
  return (value - med) / (1.4826 * m);
}

export function isManhDelta(
  today: number | null | undefined,
  prev: number | null | undefined,
  history: Array<number | null> | undefined,
  cfg: { mode?: "pct" | "pp"; floor?: number; k_sigma?: number } | undefined
): boolean {
  if (today === null || today === undefined || prev === null || prev === undefined) return false;
  const mode = cfg?.mode ?? "pct";
  const floor = Number(cfg?.floor ?? 0);
  const kSigma = Number(cfg?.k_sigma ?? 3);

  const delta = (a: number, b: number): number => {
    if (mode === "pp") return a - b;
    if (b === 0) return 0;
    return ((a - b) / b) * 100;
  };

  const d0 = delta(today, prev);
  if (floor > 0 && Math.abs(d0) >= floor) return true;

  const h = Array.isArray(history) ? history.filter((x): x is number => typeof x === "number" && Number.isFinite(x)) : [];
  if (h.length < 4) return false;

  const ds: number[] = [];
  for (let i = 1; i < h.length; i += 1) ds.push(delta(h[i], h[i - 1]));
  const med = median(ds);
  if (med === null) return false;
  const madValue = mad(ds);
  let sigma = 1.4826 * madValue;
  if (sigma <= 1e-9) sigma = 1e-9;
  const z = Math.abs((d0 - med) / sigma);
  return z >= kSigma;
}

export function metricHistory(
  colName: keyof Row | string,
  rows: Array<Partial<Row> | Record<string, unknown>>,
  todayVal: number | null | undefined,
  window = 20
): number[] {
  const vals = rows
    .map((r) => clean((r as Record<string, unknown>)[colName]))
    .filter((v): v is number => v !== null);

  if (vals.length && todayVal !== null && todayVal !== undefined && vals[vals.length - 1] === todayVal) {
    vals.pop();
  }
  if (window && vals.length > window + 1) return vals.slice(-(window + 1));
  return vals;
}

export function detectTrend(colName: keyof Row | string, rows: Array<Partial<Row> | Record<string, unknown>>): string {
  const vals = rows
    .map((r) => clean((r as Record<string, unknown>)[colName]))
    .filter((v): v is number => v !== null);
  if (vals.length < 2) return "";

  const last = vals[vals.length - 1];
  const prev = vals[vals.length - 2];
  if (prev !== 0 && (last - prev) / Math.abs(prev) < -0.15) return "🔴";
  if (vals.length < 3) return "";

  let inc = 1;
  let dec = 1;
  for (let i = vals.length - 1; i > 0; i -= 1) {
    if (vals[i] > vals[i - 1]) inc += 1;
    else break;
  }
  for (let i = vals.length - 1; i > 0; i -= 1) {
    if (vals[i] < vals[i - 1]) dec += 1;
    else break;
  }
  if (inc >= 3) return "📈";
  if (dec >= 3) return "📉";
  return "";
}

export function serialToDate(serial: number | Date): Date {
  if (serial instanceof Date) return serial;
  const base = new Date(Date.UTC(1899, 11, 30));
  return new Date(base.getTime() + Number(serial) * 86_400_000);
}

export function weekdayVn(input: string | Date): string {
  const date = typeof input === "string" ? new Date(`${input}T00:00:00`) : input;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const wd = date.getDay();
  let mapped = wd === 0 ? 7 : wd;
  if (mapped >= 6) mapped = 5;
  return { 1: "T2", 2: "T3", 3: "T4", 4: "T5", 5: "T6" }[mapped] ?? "";
}
