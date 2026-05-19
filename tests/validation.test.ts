import { describe, expect, it } from "vitest";
import { validateCell } from "@/lib/validation";

describe("validateCell", () => {
  it("returns error for invalid date format", () => {
    const result = validateCell("ngay", "2026/05/09", []);
    expect(result.severity).toBe("error");
  });

  it("returns error for non-numeric numeric field", () => {
    const result = validateCell("slkh_margin", "abc", [1, 2, 3]);
    expect(result.severity).toBe("error");
    expect(result.message).toMatch(/số/i);
  });

  it("returns warn for percent values outside 0..1", () => {
    const result = validateCell("thi_phan_co_so", 1.2, [0.07, 0.08, 0.09, 0.08, 0.1]);
    expect(result.severity).toBe("warn");
  });

  it("returns warn for negative count-like field", () => {
    const result = validateCell("slkh_ps", -1, [701, 703, 704, 706, 708, 709]);
    expect(result.severity).toBe("warn");
  });

  it("returns outlier for robust z-score >= 3", () => {
    const result = validateCell("tong_du_no_margin", 90000, [39000, 39200, 39300, 39400, 39500, 39600]);
    expect(result.severity).toBe("outlier");
  });

  it("does not flag all values as outliers when MAD = 0", () => {
    const result = validateCell("slkh_margin", 101, [100, 100, 100, 100, 100, 100]);
    expect(result.severity).not.toBe("outlier");
  });
});
