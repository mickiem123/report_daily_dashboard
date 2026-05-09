import type { Row } from "@/lib/types";

function buildRow(ngay: string, i: number): Row {
  return {
    id: i + 1,
    ngay,
    thi_phan_co_so: 0.081 + i * 0.0002,
    thi_phan_cn: 0.061 + i * 0.0001,
    thi_phan_ds: 0.012 + i * 0.00005,
    gtgd_cs_ssi: 4800 + i * 95,
    thanh_khoan_ttcs: 56000 + i * 220,
    tong_du_no_margin: 39000 + i * 140,
    slkh_margin: 22100 + i * 28,
    du_no_t7: 2300 + i * 26,
    slkh_t7: 4300 + i * 8,
    du_no_trading_plus: 980 + i * 5,
    slkh_trading_plus: 360 + i * 2,
    slkh_register_mplus: 95 + (i % 4),
    slkh_active_mplus: 1580 + i * 12,
    du_no_mplus: 1120 + i * 11,
    slkh_co_du_no_mplus: 1240 + i * 9,
    giai_ngan_mplus: 82 + (i % 5),
    slkh_giai_ngan_mplus: 430 + i * 4,
    du_no_spv: 165 + i * 1.8,
    ty_trong_spv: 0.11 + i * 0.001,
    thi_phan_phai_sinh: 0.072 + i * 0.00015,
    thanh_khoan_tt_ps: 280000 + i * 3200,
    slkh_ps: 700 + i * 3,
    ty_le_slhd_dplus: 0.63 + i * 0.002,
    slkh_dplus: 455 + i * 2,
    ty_le_slkh_dplus: 0.61 + i * 0.002,
    kh_cancel_dplus: 15 + (i % 6),
    kh_register_dplus: 40 + (i % 7),
    kh_giu_qua_dem: i % 3 === 0 ? 0 : 2 + (i % 4),
    kh_sd_dplus: 1750 + i * 18,
    slhd_giu_qua_dem: i % 3 === 0 ? 0 : 5 + (i % 5),
    du_no_dplus_giai_ngan: 15 + (i % 5) * 2.4,
    du_no_dplus_cuoi_ngay: 28 + i * 1.2,
    so_du_scash: 3720 + i * 14,
    so_du_casa_scash: 11650 + i * 12,
    ty_le_scash_casa: 0.45 + i * 0.0018,
    slkh_scash: 5600 + i * 9,
    so_du_sfund: i === 10 ? null : 460 + i * 1.6,
    slkh_sfund: 9400 + i * 11,
    slkh_mo_moi: 720 + i * 4,
    pushed_at: null,
  };
}

const dailyDates = [
  "2026-04-08",
  "2026-04-09",
  "2026-04-10",
  "2026-04-11",
  "2026-04-12",
  "2026-04-13",
  "2026-04-14",
  "2026-04-15",
  "2026-04-16",
  "2026-04-17",
  "2026-04-20",
  "2026-04-21",
  "2026-04-22",
  "2026-04-23",
  "2026-04-24",
  "2026-04-27",
  "2026-04-28",
  "2026-04-29",
  "2026-04-30",
  "2026-05-05",
  "2026-05-06",
  "2026-05-07",
] as const;

export const sampleDailyRows: Row[] = dailyDates.map((ngay, i) => buildRow(ngay, i));

sampleDailyRows[14] = {
  ...sampleDailyRows[14],
  tong_du_no_margin: 43890,
  du_no_trading_plus: 1320,
  slkh_margin: 23177,
};

sampleDailyRows[18] = {
  ...sampleDailyRows[18],
  thi_phan_co_so: 0.0761,
  thanh_khoan_tt_ps: 355000,
};

sampleDailyRows[21] = {
  ...sampleDailyRows[21],
  thi_phan_co_so: 0.0852,
  tong_du_no_margin: 42074,
  slkh_margin: 23177,
  slkh_mo_moi: 1012,
};

export const sampleWeeklyRows: Row[] = [
  buildRow("2026-04-17", 4),
  buildRow("2026-04-24", 11),
  buildRow("2026-05-01", 18),
];

export const sampleMonthlyRows: Row[] = [
  buildRow("2026-02-28", 2),
  buildRow("2026-03-31", 9),
  buildRow("2026-04-30", 16),
];
