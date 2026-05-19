export interface Row {
  [key: string]: number | string | null | undefined;
  id?: number | null;
  ngay: string;
  thi_phan_co_so: number | null;
  thi_phan_cn: number | null;
  thi_phan_ds: number | null;
  gtgd_cs_ssi: number | null;
  thanh_khoan_ttcs: number | null;
  tong_du_no_margin: number | null;
  slkh_margin: number | null;
  du_no_t7: number | null;
  slkh_t7: number | null;
  du_no_trading_plus: number | null;
  slkh_trading_plus: number | null;
  slkh_register_mplus: number | null;
  slkh_active_mplus: number | null;
  du_no_mplus: number | null;
  slkh_co_du_no_mplus: number | null;
  giai_ngan_mplus: number | null;
  slkh_giai_ngan_mplus: number | null;
  du_no_spv: number | null;
  ty_trong_spv: number | null;
  thi_phan_phai_sinh: number | null;
  thanh_khoan_tt_ps: number | null;
  slkh_ps: number | null;
  ty_le_slhd_dplus: number | null;
  slkh_dplus: number | null;
  ty_le_slkh_dplus: number | null;
  kh_cancel_dplus: number | null;
  kh_register_dplus: number | null;
  kh_giu_qua_dem: number | null;
  kh_sd_dplus: number | null;
  slhd_giu_qua_dem: number | null;
  du_no_dplus_giai_ngan: number | null;
  du_no_dplus_cuoi_ngay: number | null;
  so_du_scash: number | null;
  so_du_casa_scash: number | null;
  ty_le_scash_casa: number | null;
  slkh_scash: number | null;
  so_du_sfund: number | null;
  slkh_sfund: number | null;
  slkh_mo_moi: number | null;
  pushed_at?: string | null;
}

export type Status = "up" | "down" | "flat";

export interface SubMetric {
  metric_id?: string;
  label: string;
  value: string;
  delta: string;
  important: boolean;
  group?: string;
  inverse?: boolean;
}

export interface ProductCard {
  product_id?: string;
  key: string;
  name: string;
  trend_emoji: string;
  headline_label: string;
  headline_value: string;
  headline_delta: string;
  verb: string;
  sub_metrics: SubMetric[];
}

export type Mode = "daily" | "weekly" | "monthly";

export type ValidationSeverity = "ok" | "warn" | "error" | "outlier";

export interface CellValidation {
  severity: ValidationSeverity;
  message?: string;
}
