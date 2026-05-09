(function () {
  const baseRow = {
    ngay: "2026-05-08",
    thi_phan_co_so: 0.0852,
    thi_phan_cn: 0.09,
    thi_phan_ds: 0.0805,
    gtgd_cs_ssi: 1234.5,
    thanh_khoan_ttcs: 14500,
    tong_du_no_margin: 12345.6,
    slkh_margin: 22000,
    du_no_t7: 1500,
    slkh_t7: 5200,
    du_no_trading_plus: 1100,
    slkh_trading_plus: 4300,
    slkh_register_mplus: 320,
    slkh_active_mplus: 240,
    du_no_mplus: 900,
    slkh_co_du_no_mplus: 180,
    giai_ngan_mplus: 310,
    slkh_giai_ngan_mplus: 120,
    du_no_spv: 450,
    ty_trong_spv: 0.15,
    thi_phan_phai_sinh: 0.12,
    thanh_khoan_tt_ps: 50000,
    slkh_ps: 6100,
    ty_le_slhd_dplus: 0.24,
    slkh_dplus: 1300,
    ty_le_slkh_dplus: 0.21,
    kh_cancel_dplus: 40,
    kh_register_dplus: 70,
    kh_giu_qua_dem: 800,
    kh_sd_dplus: 900,
    slhd_giu_qua_dem: 1200,
    du_no_dplus_giai_ngan: 260,
    du_no_dplus_cuoi_ngay: 480,
    so_du_scash: 2300,
    so_du_casa_scash: 5000,
    ty_le_scash_casa: 0.46,
    slkh_scash: 8100,
    so_du_sfund: 1300,
    slkh_sfund: 4100,
    slkh_mo_moi: 260,
  };

  const prevRow = { ...baseRow, ngay: "2026-05-07", thi_phan_co_so: 0.082, tong_du_no_margin: 12100, thi_phan_phai_sinh: 0.118, kh_cancel_dplus: 35 };

  const partialRow = {
    ngay: "2026-05-08",
    thi_phan_co_so: 0.0852,
    tong_du_no_margin: 12345.6,
    thi_phan_phai_sinh: 0.12,
    so_du_scash: 2300,
    so_du_sfund: 1300,
    slkh_mo_moi: 260,
  };

  const nullRow = { ngay: "2026-05-08" };

  const fullHistory = Array.from({ length: 22 }, (_, i) => {
    const r = { ...baseRow };
    r.ngay = `2026-04-${String(i + 10).padStart(2, "0")}`;
    r.thi_phan_co_so = 0.075 + i * 0.0004;
    r.tong_du_no_margin = 11000 + i * 55;
    r.thi_phan_phai_sinh = 0.105 + i * 0.0005;
    r.so_du_scash = 1800 + i * 22;
    r.so_du_sfund = 900 + i * 12;
    r.slkh_mo_moi = 180 + i * 3;
    return r;
  });

  fullHistory[fullHistory.length - 2] = prevRow;
  fullHistory[fullHistory.length - 1] = baseRow;

  window.fixtures = {
    fullRow: baseRow,
    prevRow,
    partialRow,
    nullRow,
    fullHistory,
  };
})();
