import { diff, fmt, isManhDelta, metricHistory } from "@/lib/compute";
import type { ProductCard, Row, SubMetric } from "@/lib/types";

const MANH_CFG = {
  hose_liq_mkt: { mode: "pct", floor: 15.0, k_sigma: 3.0 },
  ps_liq: { mode: "pct", floor: 15.0, k_sigma: 3.0 },
  ps_dplus_ratio: { mode: "pp", floor: 1.0, k_sigma: 3.0 },
} as const;

function trendEmoji(field: keyof Row, rows: Row[]): string {
  const values = rows
    .map((r) => r[field])
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (values.length < 2) return "";
  const latest = values[values.length - 1];
  const prev = values[values.length - 2];
  if (latest > prev) return "🟢";
  if (latest < prev) return "🔴";
  return "➖";
}

function toSubMetric(
  label: string,
  value: string,
  delta: string,
  important: boolean,
  group?: string,
  inverse?: boolean
): SubMetric {
  return { label, value, delta, important, group, inverse };
}

export function hose(today: Row, prev: Row | null, rows: Row[]): ProductCard {
  const head = diff(today.thi_phan_co_so, prev?.thi_phan_co_so, "%");
  const liqMkt = diff(today.thanh_khoan_ttcs, prev?.thanh_khoan_ttcs, "tỷ");
  const ssi = diff(today.gtgd_cs_ssi, prev?.gtgd_cs_ssi, "tỷ");
  const cn = diff(today.thi_phan_cn, prev?.thi_phan_cn, "%");
  const ds = diff(today.thi_phan_ds, prev?.thi_phan_ds, "%");

  return {
    key: "hose",
    name: "HOSE",
    trend_emoji: trendEmoji("thi_phan_co_so", rows),
    headline_label: "Thị Phần HOSE",
    headline_value: head.valStr,
    headline_delta: head.deltaStr,
    verb: head.verb,
    sub_metrics: [
      toSubMetric(
        "Thanh khoản thị trường",
        liqMkt.valStr,
        liqMkt.deltaStr,
        isManhDelta(
          today.thanh_khoan_ttcs,
          prev?.thanh_khoan_ttcs,
          metricHistory("thanh_khoan_ttcs", rows, today.thanh_khoan_ttcs),
          MANH_CFG.hose_liq_mkt
        )
      ),
      toSubMetric("GTGD SSI", ssi.valStr, ssi.deltaStr, Math.abs(ssi.pctDelta) > 5),
      toSubMetric("Thị Phần CN", cn.valStr, cn.deltaStr, Math.abs(cn.pctDelta) > 5),
      toSubMetric("Thị Phần DS", ds.valStr, ds.deltaStr, Math.abs(ds.pctDelta) > 5),
    ],
  };
}

export function margin(today: Row, prev: Row | null, rows: Row[]): ProductCard {
  const head = diff(today.tong_du_no_margin, prev?.tong_du_no_margin, "tỷ");
  const slkhMargin = diff(today.slkh_margin, prev?.slkh_margin, "KH");
  const t7DuNo = diff(today.du_no_t7, prev?.du_no_t7, "tỷ");
  const t7Slkh = diff(today.slkh_t7, prev?.slkh_t7, "KH");
  const tpDuNo = diff(today.du_no_trading_plus, prev?.du_no_trading_plus, "tỷ");
  const tpSlkh = diff(today.slkh_trading_plus, prev?.slkh_trading_plus, "KH");
  const mReg = diff(today.slkh_register_mplus, prev?.slkh_register_mplus, "KH");
  const mAct = diff(today.slkh_active_mplus, prev?.slkh_active_mplus, "KH");
  const mDuNo = diff(today.du_no_mplus, prev?.du_no_mplus, "tỷ");
  const mCoDuNo = diff(today.slkh_co_du_no_mplus, prev?.slkh_co_du_no_mplus, "KH");
  const mGiaiNgan = diff(today.giai_ngan_mplus, prev?.giai_ngan_mplus, "tỷ");
  const mSlkhGiaiNgan = diff(today.slkh_giai_ngan_mplus, prev?.slkh_giai_ngan_mplus, "KH");
  const spv = diff(today.du_no_spv, prev?.du_no_spv, "tỷ");

  return {
    key: "margin",
    name: "Margin",
    trend_emoji: trendEmoji("tong_du_no_margin", rows),
    headline_label: "Tổng dư nợ Margin TK6+7",
    headline_value: head.valStr,
    headline_delta: head.deltaStr,
    verb: head.verb,
    sub_metrics: [
      toSubMetric("SLKH Margin", slkhMargin.valStr, slkhMargin.deltaStr, Math.abs(slkhMargin.pctDelta) > 5),
      toSubMetric("Dư nợ T+7", t7DuNo.valStr, t7DuNo.deltaStr, Math.abs(t7DuNo.pctDelta) > 5, "T+7"),
      toSubMetric("SLKH T+7", t7Slkh.valStr, t7Slkh.deltaStr, Math.abs(t7Slkh.pctDelta) > 5, "T+7"),
      toSubMetric("Dư nợ Trading Plus", tpDuNo.valStr, tpDuNo.deltaStr, Math.abs(tpDuNo.pctDelta) > 5, "Trading Plus"),
      toSubMetric("SLKH Trading Plus", tpSlkh.valStr, tpSlkh.deltaStr, Math.abs(tpSlkh.pctDelta) > 5, "Trading Plus"),
      toSubMetric("SLKH đăng ký M+", mReg.valStr, mReg.deltaStr, Math.abs(mReg.pctDelta) > 5, "M+"),
      toSubMetric("SLKH active M+", mAct.valStr, mAct.deltaStr, Math.abs(mAct.pctDelta) > 5, "M+"),
      toSubMetric("Dư nợ M+", mDuNo.valStr, mDuNo.deltaStr, Math.abs(mDuNo.pctDelta) > 5, "M+"),
      toSubMetric("SLKH có dư nợ M+", mCoDuNo.valStr, mCoDuNo.deltaStr, Math.abs(mCoDuNo.pctDelta) > 5, "M+"),
      toSubMetric("Giải ngân M+", mGiaiNgan.valStr, mGiaiNgan.deltaStr, Math.abs(mGiaiNgan.pctDelta) > 5, "M+"),
      toSubMetric("SLKH giải ngân M+", mSlkhGiaiNgan.valStr, mSlkhGiaiNgan.deltaStr, Math.abs(mSlkhGiaiNgan.pctDelta) > 5, "M+"),
      toSubMetric("Dư nợ SPV", spv.valStr, spv.deltaStr, Math.abs(spv.pctDelta) > 5),
    ],
  };
}

export function phaisinh(today: Row, prev: Row | null, rows: Row[]): ProductCard {
  const head = diff(today.thi_phan_phai_sinh, prev?.thi_phan_phai_sinh, "%");
  const liq = diff(today.thanh_khoan_tt_ps, prev?.thanh_khoan_tt_ps, "HĐ");
  const slkh = diff(today.slkh_ps, prev?.slkh_ps, "KH");
  const dplusSlkh = diff(today.slkh_dplus, prev?.slkh_dplus, "KH");
  const dplusRatio = diff(today.ty_le_slkh_dplus, prev?.ty_le_slkh_dplus, "%");
  const huy = diff(today.kh_cancel_dplus, prev?.kh_cancel_dplus, "KH");
  const reg = diff(today.kh_register_dplus, prev?.kh_register_dplus, "KH");
  const keep = diff(today.kh_giu_qua_dem, prev?.kh_giu_qua_dem, "KH");
  const use = diff(today.kh_sd_dplus, prev?.kh_sd_dplus, "KH");
  const giaiNgan = diff(today.du_no_dplus_giai_ngan, prev?.du_no_dplus_giai_ngan, "tỷ");
  const duNo = diff(today.du_no_dplus_cuoi_ngay, prev?.du_no_dplus_cuoi_ngay, "tỷ");

  const ratioToday = typeof today.ty_le_slkh_dplus === "number" ? today.ty_le_slkh_dplus * 100 : null;
  const ratioPrev = typeof prev?.ty_le_slkh_dplus === "number" ? prev.ty_le_slkh_dplus * 100 : null;
  const ratioHistory = metricHistory("ty_le_slkh_dplus", rows, today.ty_le_slkh_dplus).map((x) => x * 100);

  return {
    key: "phaisinh",
    name: "Phái Sinh",
    trend_emoji: trendEmoji("thi_phan_phai_sinh", rows),
    headline_label: "Thị Phần Phái Sinh",
    headline_value: head.valStr,
    headline_delta: head.deltaStr,
    verb: head.verb,
    sub_metrics: [
      toSubMetric(
        "Thanh khoản TTPS",
        liq.valStr,
        liq.deltaStr,
        isManhDelta(today.thanh_khoan_tt_ps, prev?.thanh_khoan_tt_ps, metricHistory("thanh_khoan_tt_ps", rows, today.thanh_khoan_tt_ps), MANH_CFG.ps_liq)
      ),
      toSubMetric("SLKH PS", slkh.valStr, slkh.deltaStr, Math.abs(slkh.pctDelta) > 5),
      toSubMetric("SLKH D+", dplusSlkh.valStr, dplusSlkh.deltaStr, Math.abs(dplusSlkh.pctDelta) > 5, "D+"),
      toSubMetric(
        "Tỷ lệ KH dùng D+",
        dplusRatio.valStr,
        dplusRatio.deltaStr,
        isManhDelta(ratioToday, ratioPrev, ratioHistory, MANH_CFG.ps_dplus_ratio),
        "D+"
      ),
      toSubMetric("KH hủy D+", huy.valStr, huy.deltaStr, Math.abs(huy.pctDelta) > 5, "D+", true),
      toSubMetric("KH đăng ký D+", reg.valStr, reg.deltaStr, Math.abs(reg.pctDelta) > 5, "D+"),
      toSubMetric("KH giữ qua đêm", keep.valStr, keep.deltaStr, Math.abs(keep.pctDelta) > 5, "D+"),
      toSubMetric("KH sử dụng D+", use.valStr, use.deltaStr, Math.abs(use.pctDelta) > 5, "D+"),
      toSubMetric("Giải ngân D+", giaiNgan.valStr, giaiNgan.deltaStr, Math.abs(giaiNgan.pctDelta) > 5, "D+"),
      toSubMetric("Dư nợ D+ cuối ngày", duNo.valStr, duNo.deltaStr, Math.abs(duNo.pctDelta) > 5, "D+"),
    ],
  };
}

export function scash(today: Row, prev: Row | null, rows: Row[]): ProductCard {
  const head = diff(today.so_du_scash, prev?.so_du_scash, "tỷ");
  const slkh = diff(today.slkh_scash, prev?.slkh_scash, "KH");
  const total = diff(today.so_du_casa_scash, prev?.so_du_casa_scash, "tỷ");
  const ratio = diff(today.ty_le_scash_casa, prev?.ty_le_scash_casa, "%");

  return {
    key: "scash",
    name: "S-Cash",
    trend_emoji: trendEmoji("so_du_scash", rows),
    headline_label: "Số dư S-Cash",
    headline_value: head.valStr,
    headline_delta: head.deltaStr,
    verb: head.verb,
    sub_metrics: [
      toSubMetric("SLKH S-Cash", slkh.valStr, slkh.deltaStr, Math.abs(slkh.pctDelta) > 5),
      toSubMetric("Tổng dư SCASH+CASA", total.valStr, total.deltaStr, Math.abs(total.pctDelta) > 5),
      toSubMetric("Tỷ lệ S-Cash/CASA", ratio.valStr, ratio.deltaStr, Math.abs(ratio.pctDelta) > 5),
    ],
  };
}

export function sfund(today: Row, prev: Row | null, rows: Row[]): ProductCard {
  const head = diff(today.so_du_sfund, prev?.so_du_sfund, "tỷ");
  const slkh = diff(today.slkh_sfund, prev?.slkh_sfund, "KH");
  return {
    key: "sfund",
    name: "S-Fund",
    trend_emoji: trendEmoji("so_du_sfund", rows),
    headline_label: "Số dư S-Fund",
    headline_value: head.valStr,
    headline_delta: head.deltaStr,
    verb: head.verb,
    sub_metrics: [toSubMetric("SLKH S-Fund", slkh.valStr, slkh.deltaStr, Math.abs(slkh.pctDelta) > 5)],
  };
}

export function momoi(today: Row, prev: Row | null, rows: Row[]): ProductCard {
  const head = diff(today.slkh_mo_moi, prev?.slkh_mo_moi, "tài khoản");
  return {
    key: "momoi",
    name: "Mở mới",
    trend_emoji: trendEmoji("slkh_mo_moi", rows),
    headline_label: "KH mở tài khoản mới",
    headline_value: head.valStr,
    headline_delta: head.deltaStr,
    verb: head.verb,
    sub_metrics: [],
  };
}

export const previewHeadlineFormatter = (value: number | null, unit: string) => fmt(value, unit);
