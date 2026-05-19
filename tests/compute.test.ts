import { describe, expect, it } from "vitest";
import {
  clean,
  detectTrend,
  diff,
  fmt,
  isManhDelta,
  mad,
  median,
  metricHistory,
  normalizeUnit,
  robustZ,
  serialToDate,
  weekdayVn,
} from "@/lib/compute";

describe("clean", () => {
  it("returns null for nullish", () => {
    expect(clean(null)).toBeNull();
    expect(clean(undefined)).toBeNull();
  });

  it("returns null for string and Date", () => {
    expect(clean("1")).toBeNull();
    expect(clean(new Date())).toBeNull();
  });

  it("returns null for NaN and sentinel lower values", () => {
    expect(clean(Number.NaN)).toBeNull();
    expect(clean(-2_000_000_001)).toBeNull();
  });

  it("keeps valid number", () => {
    expect(clean(10)).toBe(10);
  });
});

describe("normalizeUnit + fmt", () => {
  it("normalizes mojibake token to tỷ", () => {
    expect(normalizeUnit("tÃ¡Â»Â·")).toBe("tỷ");
    expect(normalizeUnit("tá»·")).toBe("tỷ");
  });

  it("formats null as N/A", () => {
    expect(fmt(null, "KH")).toBe("N/A");
  });

  it("formats percent with decimal comma", () => {
    expect(fmt(0.0852, "%")).toBe("8,52%");
  });

  it("formats tỷ with rounding and vi separators", () => {
    expect(fmt(1234.5, "tỷ")).toBe("1.235 tỷ");
  });

  it("formats mojibake tỷ same as tỷ", () => {
    expect(fmt(1234.5, "tÃ¡Â»Â·")).toBe("1.235 tỷ");
  });

  it("formats KH/HĐ/tài khoản as rounded integers", () => {
    expect(fmt(1234.5, "KH")).toBe("1.235");
    expect(fmt(1234.5, "HĐ")).toBe("1.235");
    expect(fmt(1234.5, "tài khoản")).toBe("1.235");
  });
});

describe("diff", () => {
  it("returns N/A shape for null inputs", () => {
    expect(diff(null, 100, "KH")).toEqual({
      verb: "N/A",
      prep: "",
      valStr: "N/A",
      deltaStr: "",
      pctDelta: 0,
    });
  });

  it("uses tăng mạnh when pctDelta > 5", () => {
    const out = diff(106, 100, "KH");
    expect(out.verb).toBe("tăng mạnh");
    expect(out.prep).toBe("lên");
  });

  it("uses tăng when pctDelta > 0 and <= 5", () => {
    const out = diff(102, 100, "KH");
    expect(out.verb).toBe("tăng");
    expect(out.prep).toBe("lên");
  });

  it("uses giữ nguyên mức when pctDelta = 0", () => {
    const out = diff(100, 100, "KH");
    expect(out.verb).toBe("giữ nguyên mức");
    expect(out.prep).toBe("");
  });

  it("uses giảm when pctDelta < 0 and >= -5", () => {
    const out = diff(98, 100, "KH");
    expect(out.verb).toBe("giảm");
    expect(out.prep).toBe("về");
  });

  it("uses giảm mạnh when pctDelta < -5", () => {
    const out = diff(90, 100, "KH");
    expect(out.verb).toBe("giảm mạnh");
    expect(out.prep).toBe("về");
  });

  it("switches preposition for % unit", () => {
    expect(diff(0.2, 0.1, "%").prep).toBe("lên mức");
    expect(diff(0.1, 0.2, "%").prep).toBe("về mức");
  });

  it("formats delta string for %", () => {
    expect(diff(0.12, 0.1, "%").deltaStr).toBe("(+2,00%)");
  });

  it("formats delta string for tỷ", () => {
    expect(diff(1100, 1000, "tỷ").deltaStr).toBe("(+100 tỷ, +10,00%)");
  });

  it("formats delta string for KH-like units", () => {
    expect(diff(1100, 1000, "KH").deltaStr).toBe("(+100 KH, +10,00%)");
  });
});

describe("median + mad + robustZ", () => {
  it("computes median for odd and even lengths", () => {
    expect(median([1, 2, 3])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("returns null median for empty", () => {
    expect(median([])).toBeNull();
  });

  it("computes mad and robustZ on flat series", () => {
    expect(mad([2, 2, 2, 2])).toBe(0);
    expect(robustZ(2, [2, 2, 2, 2])).toBe(0);
  });

  it("computes positive robustZ for outlier", () => {
    expect(robustZ(10, [1, 1, 2, 2, 2, 3])).toBeGreaterThan(3);
  });
});

describe("isManhDelta", () => {
  it("returns true in floor mode pct when threshold met", () => {
    expect(isManhDelta(120, 100, [90, 100, 110, 100], { mode: "pct", floor: 10 })).toBe(true);
  });

  it("returns true in floor mode pp when threshold met", () => {
    expect(isManhDelta(0.2, 0.1, [0.09, 0.1, 0.12, 0.1], { mode: "pp", floor: 0.05 })).toBe(true);
  });

  it("returns false when history too short for z-score mode", () => {
    expect(isManhDelta(110, 100, [90, 100, 110], { mode: "pct", floor: 0, k_sigma: 1 })).toBe(false);
  });

  it("returns true in z-score mode when |z| >= k_sigma", () => {
    const history = [100, 101, 102, 101, 102, 103, 102, 103, 104, 103];
    expect(isManhDelta(130, 104, history, { mode: "pct", floor: 0, k_sigma: 2 })).toBe(true);
  });
});

describe("metricHistory", () => {
  const rows = [{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }, { x: 5 }, { x: 6 }] as Array<Record<string, number>>;

  it("returns up to window+1 prior values", () => {
    expect(metricHistory("x", rows, 99, 3)).toEqual([3, 4, 5, 6]);
  });

  it("removes today value if duplicated at end", () => {
    expect(metricHistory("x", rows, 6, 20)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("detectTrend", () => {
  it("returns 📈 for 3+ increasing streak", () => {
    expect(detectTrend("x", [{ x: 1 }, { x: 2 }, { x: 3 }])).toBe("📈");
  });

  it("returns 📉 for 3+ decreasing streak", () => {
    expect(detectTrend("x", [{ x: 100 }, { x: 95 }, { x: 90 }])).toBe("📉");
  });

  it("returns 🔴 for single-day drop over 15% with precedence", () => {
    expect(detectTrend("x", [{ x: 1 }, { x: 2 }, { x: 3 }, { x: 2.4 }])).toBe("🔴");
  });

  it("returns empty string otherwise", () => {
    expect(detectTrend("x", [{ x: 1 }, { x: 1 }, { x: 1 }])).toBe("");
  });
});

describe("serialToDate + weekdayVn", () => {
  it("converts Excel serial using 1900 epoch base", () => {
    expect(serialToDate(1).toISOString().slice(0, 10)).toBe("1899-12-31");
    expect(serialToDate(2).toISOString().slice(0, 10)).toBe("1900-01-01");
  });

  it("maps weekdays and rolls weekend to T6", () => {
    expect(weekdayVn(new Date("2026-05-04T00:00:00"))).toBe("T2");
    expect(weekdayVn(new Date("2026-05-09T00:00:00"))).toBe("T6");
    expect(weekdayVn(new Date("2026-05-10T00:00:00"))).toBe("T6");
  });
});
