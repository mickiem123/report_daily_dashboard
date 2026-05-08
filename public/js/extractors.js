(function () {
  const COL = {
    ngay: "ngay",
    thi_phan_co_so: "thi_phan_co_so",
    thi_phan_cn: "thi_phan_cn",
    thi_phan_ds: "thi_phan_ds",
    gtgd_cs_ssi: "gtgd_cs_ssi",
    thanh_khoan_ttcs: "thanh_khoan_ttcs",
    tong_du_no_margin: "tong_du_no_margin",
    slkh_margin: "slkh_margin",
    du_no_t7: "du_no_t7",
    slkh_t7: "slkh_t7",
    du_no_trading_plus: "du_no_trading_plus",
    slkh_trading_plus: "slkh_trading_plus",
    slkh_register_mplus: "slkh_register_mplus",
    slkh_active_mplus: "slkh_active_mplus",
    du_no_mplus: "du_no_mplus",
    slkh_co_du_no_mplus: "slkh_co_du_no_mplus",
    giai_ngan_mplus: "giai_ngan_mplus",
    slkh_giai_ngan_mplus: "slkh_giai_ngan_mplus",
    du_no_spv: "du_no_spv",
    ty_trong_spv: "ty_trong_spv",
    thi_phan_phai_sinh: "thi_phan_phai_sinh",
    thanh_khoan_tt_ps: "thanh_khoan_tt_ps",
    slkh_ps: "slkh_ps",
    ty_le_slhd_dplus: "ty_le_slhd_dplus",
    slkh_dplus: "slkh_dplus",
    ty_le_slkh_dplus: "ty_le_slkh_dplus",
    kh_cancel_dplus: "kh_cancel_dplus",
    kh_register_dplus: "kh_register_dplus",
    kh_giu_qua_dem: "kh_giu_qua_dem",
    kh_sd_dplus: "kh_sd_dplus",
    slhd_giu_qua_dem: "slhd_giu_qua_dem",
    du_no_dplus_giai_ngan: "du_no_dplus_giai_ngan",
    du_no_dplus_cuoi_ngay: "du_no_dplus_cuoi_ngay",
    so_du_scash: "so_du_scash",
    so_du_casa_scash: "so_du_casa_scash",
    ty_le_scash_casa: "ty_le_scash_casa",
    slkh_scash: "slkh_scash",
    so_du_sfund: "so_du_sfund",
    slkh_sfund: "slkh_sfund",
    slkh_mo_moi: "slkh_mo_moi",
  };

  const MANH_CFG = {
    hose_liq_mkt: { mode: "pct", floor: 15.0, k_sigma: 3.0 },
    ps_liq: { mode: "pct", floor: 15.0, k_sigma: 3.0 },
    ps_dplus_ratio: { mode: "pp", floor: 1.0, k_sigma: 3.0 },
  };

  function getDiff(today, prev, key, unit) {
    return window.compute.diff(today[key], prev ? prev[key] : null, unit);
  }

  function hose(today, prev, rows) {
    const d2 = getDiff(today, prev, COL.thi_phan_co_so, "%");
    const d6 = getDiff(today, prev, COL.thanh_khoan_ttcs, "tỷ");
    const d5 = getDiff(today, prev, COL.gtgd_cs_ssi, "tỷ");
    const d3 = getDiff(today, prev, COL.thi_phan_cn, "%");
    const d4 = getDiff(today, prev, COL.thi_phan_ds, "%");

    return {
      key: "hose",
      name: "HOSE",
      trend_emoji: window.compute.detectTrend(COL.thi_phan_co_so, rows),
      headline_label: "Thi phan HOSE",
      headline_value: d2.valStr,
      headline_delta: d2.deltaStr,
      verb: d2.verb,
      chart_keys_default: ["hose_share", "hose_liq_mkt", "hose_gtgd_ssi", "hose_cn"],
      sub_metrics: [
        {
          label: "Thanh khoan thi truong",
          value: d6.valStr,
          delta: d6.deltaStr,
          important: window.compute.isManhDelta(
            today[COL.thanh_khoan_ttcs],
            prev ? prev[COL.thanh_khoan_ttcs] : null,
            window.compute.metricHistory(COL.thanh_khoan_ttcs, rows, today[COL.thanh_khoan_ttcs]),
            MANH_CFG.hose_liq_mkt
          ),
        },
        { label: "GTGD SSI", value: d5.valStr, delta: d5.deltaStr, important: Math.abs(d5.pctDelta) > 5 },
        { label: "Thi phan CN", value: d3.valStr, delta: d3.deltaStr, important: Math.abs(d3.pctDelta) > 5 },
        { label: "Thi phan DS", value: d4.valStr, delta: d4.deltaStr, important: Math.abs(d4.pctDelta) > 5 },
      ],
    };
  }

  function margin(today, prev, rows) {
    const d7 = getDiff(today, prev, COL.tong_du_no_margin, "tỷ");
    const d8 = getDiff(today, prev, COL.slkh_margin, "KH");
    const d9 = getDiff(today, prev, COL.du_no_t7, "tỷ");
    const d10 = getDiff(today, prev, COL.slkh_t7, "KH");
    const d11 = getDiff(today, prev, COL.du_no_trading_plus, "tỷ");
    const d12 = getDiff(today, prev, COL.slkh_trading_plus, "KH");
    const d13 = getDiff(today, prev, COL.slkh_register_mplus, "KH");
    const d14 = getDiff(today, prev, COL.slkh_active_mplus, "KH");
    const d15 = getDiff(today, prev, COL.du_no_mplus, "tỷ");
    const d16 = getDiff(today, prev, COL.slkh_co_du_no_mplus, "KH");
    const d17 = getDiff(today, prev, COL.giai_ngan_mplus, "tỷ");
    const d18 = getDiff(today, prev, COL.slkh_giai_ngan_mplus, "KH");
    const d20 = getDiff(today, prev, COL.du_no_spv, "tỷ");

    return {
      key: "margin",
      name: "Margin",
      trend_emoji: window.compute.detectTrend(COL.tong_du_no_margin, rows),
      headline_label: "Tong du no Margin TK6+7",
      headline_value: d7.valStr,
      headline_delta: d7.deltaStr,
      verb: d7.verb,
      chart_keys_default: ["margin_total", "margin_kh", "margin_t7", "margin_tp", "margin_mplus"],
      sub_metrics: [
        { label: "SLKH Margin", value: d8.valStr, delta: d8.deltaStr, important: Math.abs(d8.pctDelta) > 5 },
        { label: "Du no T+7", value: d9.valStr, delta: d9.deltaStr, important: Math.abs(d9.pctDelta) > 5 },
        { label: "SLKH T+7", value: d10.valStr, delta: d10.deltaStr, important: Math.abs(d10.pctDelta) > 5 },
        { label: "Du no Trading Plus", value: d11.valStr, delta: d11.deltaStr, important: Math.abs(d11.pctDelta) > 5 },
        { label: "SLKH Trading Plus", value: d12.valStr, delta: d12.deltaStr, important: Math.abs(d12.pctDelta) > 5 },
        { label: "SLKH register M+", value: d13.valStr, delta: d13.deltaStr, important: Math.abs(d13.pctDelta) > 5, group: "M+" },
        { label: "SLKH active M+", value: d14.valStr, delta: d14.deltaStr, important: Math.abs(d14.pctDelta) > 5, group: "M+" },
        { label: "Du no M+", value: d15.valStr, delta: d15.deltaStr, important: Math.abs(d15.pctDelta) > 5, group: "M+" },
        { label: "SLKH co du no M+", value: d16.valStr, delta: d16.deltaStr, important: Math.abs(d16.pctDelta) > 5, group: "M+" },
        { label: "Giai ngan M+", value: d17.valStr, delta: d17.deltaStr, important: Math.abs(d17.pctDelta) > 5, group: "M+" },
        { label: "SLKH giai ngan M+", value: d18.valStr, delta: d18.deltaStr, important: Math.abs(d18.pctDelta) > 5, group: "M+" },
        { label: "Du no SPV", value: d20.valStr, delta: d20.deltaStr, important: Math.abs(d20.pctDelta) > 5 },
      ],
    };
  }

  function phaisinh(today, prev, rows) {
    const d22 = getDiff(today, prev, COL.thi_phan_phai_sinh, "%");
    const d23 = getDiff(today, prev, COL.thanh_khoan_tt_ps, "HĐ");
    const d25 = getDiff(today, prev, COL.slkh_ps, "KH");
    const d28 = getDiff(today, prev, COL.slkh_dplus, "KH");
    const d29 = getDiff(today, prev, COL.ty_le_slkh_dplus, "%");
    const d35 = getDiff(today, prev, COL.du_no_dplus_giai_ngan, "tỷ");
    const d36 = getDiff(today, prev, COL.du_no_dplus_cuoi_ngay, "tỷ");
    const d33 = getDiff(today, prev, COL.kh_sd_dplus, "KH");
    const d31 = getDiff(today, prev, COL.kh_register_dplus, "KH");
    const d30 = getDiff(today, prev, COL.kh_cancel_dplus, "KH");
    const d32 = getDiff(today, prev, COL.kh_giu_qua_dem, "KH");

    const ratioToday = today[COL.ty_le_slkh_dplus];
    const ratioPrev = prev ? prev[COL.ty_le_slkh_dplus] : null;

    return {
      key: "phaisinh",
      name: "Phai sinh",
      trend_emoji: window.compute.detectTrend(COL.thi_phan_phai_sinh, rows),
      headline_label: "Thi phan Phai sinh",
      headline_value: d22.valStr,
      headline_delta: d22.deltaStr,
      verb: d22.verb,
      chart_keys_default: ["ps_share", "ps_liq", "ps_kh", "ps_dplus_kh", "ps_dplus_ratio"],
      sub_metrics: [
        {
          label: "Thanh khoan TTPS",
          value: d23.valStr,
          delta: d23.deltaStr,
          important: window.compute.isManhDelta(
            today[COL.thanh_khoan_tt_ps],
            prev ? prev[COL.thanh_khoan_tt_ps] : null,
            window.compute.metricHistory(COL.thanh_khoan_tt_ps, rows, today[COL.thanh_khoan_tt_ps]),
            MANH_CFG.ps_liq
          ),
        },
        { label: "SLKH PS", value: d25.valStr, delta: d25.deltaStr, important: Math.abs(d25.pctDelta) > 5 },
        { label: "SLKH D+", value: d28.valStr, delta: d28.deltaStr, important: Math.abs(d28.pctDelta) > 5, group: "D+" },
        {
          label: "Ty le KH dung D+",
          value: d29.valStr,
          delta: d29.deltaStr,
          important: window.compute.isManhDelta(
            ratioToday == null ? null : ratioToday * 100,
            ratioPrev == null ? null : ratioPrev * 100,
            window.compute.metricHistory(COL.ty_le_slkh_dplus, rows, ratioToday).map((v) => v * 100),
            MANH_CFG.ps_dplus_ratio
          ),
          group: "D+",
        },
        { label: "KH cancel D+", value: d30.valStr, delta: d30.deltaStr, important: Math.abs(d30.pctDelta) > 5, group: "D+", inverse: true },
        { label: "KH register D+", value: d31.valStr, delta: d31.deltaStr, important: Math.abs(d31.pctDelta) > 5, group: "D+" },
        { label: "KH giu qua dem", value: d32.valStr, delta: d32.deltaStr, important: Math.abs(d32.pctDelta) > 5, group: "D+" },
        { label: "KH su dung D+", value: d33.valStr, delta: d33.deltaStr, important: Math.abs(d33.pctDelta) > 5, group: "D+" },
        { label: "Giai ngan D+", value: d35.valStr, delta: d35.deltaStr, important: Math.abs(d35.pctDelta) > 5, group: "D+" },
        { label: "Du no D+ cuoi ngay", value: d36.valStr, delta: d36.deltaStr, important: Math.abs(d36.pctDelta) > 5, group: "D+" },
      ],
    };
  }

  function scash(today, prev, rows) {
    const d37 = getDiff(today, prev, COL.so_du_scash, "tỷ");
    const d40 = getDiff(today, prev, COL.slkh_scash, "KH");
    const d38 = getDiff(today, prev, COL.so_du_casa_scash, "tỷ");
    const d39 = getDiff(today, prev, COL.ty_le_scash_casa, "%");

    return {
      key: "scash",
      name: "S-Cash",
      trend_emoji: window.compute.detectTrend(COL.so_du_scash, rows),
      headline_label: "So du S-Cash",
      headline_value: d37.valStr,
      headline_delta: d37.deltaStr,
      verb: d37.verb,
      chart_keys_default: ["scash_bal", "scash_kh", "scash_total", "scash_ratio"],
      sub_metrics: [
        { label: "SLKH S-Cash", value: d40.valStr, delta: d40.deltaStr, important: Math.abs(d40.pctDelta) > 5 },
        { label: "Tong du SCASH+CASA", value: d38.valStr, delta: d38.deltaStr, important: Math.abs(d38.pctDelta) > 5 },
        { label: "Ty le S-Cash/CASA", value: d39.valStr, delta: d39.deltaStr, important: Math.abs(d39.pctDelta) > 5 },
      ],
    };
  }

  function sfund(today, prev, rows) {
    const d41 = getDiff(today, prev, COL.so_du_sfund, "tỷ");
    const d42 = getDiff(today, prev, COL.slkh_sfund, "KH");

    return {
      key: "sfund",
      name: "S-Fund",
      trend_emoji: window.compute.detectTrend(COL.so_du_sfund, rows),
      headline_label: "So du S-Fund",
      headline_value: d41.valStr,
      headline_delta: d41.deltaStr,
      verb: d41.verb,
      chart_keys_default: ["sfund_bal", "sfund_kh"],
      sub_metrics: [
        { label: "SLKH S-Fund", value: d42.valStr, delta: d42.deltaStr, important: Math.abs(d42.pctDelta) > 5 },
      ],
    };
  }

  function momoi(today, prev, rows) {
    const d43 = getDiff(today, prev, COL.slkh_mo_moi, "tài khoản");

    return {
      key: "momoi",
      name: "Mo moi",
      trend_emoji: window.compute.detectTrend(COL.slkh_mo_moi, rows),
      headline_label: "KH mo tai khoan moi",
      headline_value: d43.valStr,
      headline_delta: d43.deltaStr,
      verb: d43.verb,
      chart_keys_default: ["moimoi_kh"],
      sub_metrics: [],
    };
  }

  window.extractors = { hose, margin, phaisinh, scash, sfund, momoi };
})();
