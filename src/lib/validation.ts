import type { CellValidation } from "@/lib/types";

const NUMERIC_FIELDS = new Set([
  "thi_phan_co_so",
  "thi_phan_cn",
  "thi_phan_ds",
  "gtgd_cs_ssi",
  "thanh_khoan_ttcs",
  "tong_du_no_margin",
  "slkh_margin",
  "du_no_t7",
  "slkh_t7",
  "du_no_trading_plus",
  "slkh_trading_plus",
  "slkh_register_mplus",
  "slkh_active_mplus",
  "du_no_mplus",
  "slkh_co_du_no_mplus",
  "giai_ngan_mplus",
  "slkh_giai_ngan_mplus",
  "du_no_spv",
  "ty_trong_spv",
  "thi_phan_phai_sinh",
  "thanh_khoan_tt_ps",
  "slkh_ps",
  "ty_le_slhd_dplus",
  "slkh_dplus",
  "ty_le_slkh_dplus",
  "kh_cancel_dplus",
  "kh_register_dplus",
  "kh_giu_qua_dem",
  "kh_sd_dplus",
  "slhd_giu_qua_dem",
  "du_no_dplus_giai_ngan",
  "du_no_dplus_cuoi_ngay",
  "so_du_scash",
  "so_du_casa_scash",
  "ty_le_scash_casa",
  "slkh_scash",
  "so_du_sfund",
  "slkh_sfund",
  "slkh_mo_moi",
]);

const PERCENT_FIELDS = new Set([
  "thi_phan_co_so",
  "thi_phan_cn",
  "thi_phan_ds",
  "ty_trong_spv",
  "thi_phan_phai_sinh",
  "ty_le_slhd_dplus",
  "ty_le_slkh_dplus",
  "ty_le_scash_casa",
]);

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isDateYYYYMMDD(value: unknown): boolean {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mid = Math.floor(n / 2);
  return n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function robustZScore(value: number, history: number[]): number | null {
  if (history.length < 5) return null;
  const center = median(history);
  const absDev = history.map((x) => Math.abs(x - center));
  const mad = median(absDev);
  if (mad === 0) {
    const threshold = Math.max(5, Math.abs(center) * 0.5);
    return Math.abs(value - center) > threshold ? 3 : 0;
  }
  return (0.6745 * (value - center)) / mad;
}

export function validateCell(field: string, value: unknown, history: (number | null)[]): CellValidation {
  if (field === "ngay") {
    if (!isDateYYYYMMDD(value)) return { severity: "error", message: "Ngày không hợp lệ, dùng YYYY-MM-DD." };
    return { severity: "ok" };
  }

  if (!NUMERIC_FIELDS.has(field)) return { severity: "ok" };

  const n = toNumber(value);
  if (n === null) return { severity: "error", message: "Giá trị phải là số, vui lòng nhập lại." };

  if (PERCENT_FIELDS.has(field) && (n < 0 || n > 1)) {
    return { severity: "warn", message: "Trường phần trăm nên nằm trong khoảng 0..1." };
  }

  if (n < 0) return { severity: "warn", message: "Giá trị âm cần được kiểm tra lại." };

  const cleanHistory = history.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  const z = robustZScore(n, cleanHistory);
  if (z !== null && Math.abs(z) >= 3) {
    return { severity: "outlier", message: `Giá trị bất thường (z=${Math.abs(z).toFixed(2)}).` };
  }

  return { severity: "ok" };
}
