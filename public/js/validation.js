(function initValidationModule() {
  const NUMERIC_FIELDS = [
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
    "slkh_mo_moi"
  ];
  const PERCENT_FIELDS = [
    "thi_phan_co_so",
    "thi_phan_cn",
    "thi_phan_ds",
    "ty_trong_spv",
    "thi_phan_phai_sinh",
    "ty_le_slhd_dplus",
    "ty_le_slkh_dplus",
    "ty_le_scash_casa"
  ];
  const NON_NEGATIVE_FIELDS = NUMERIC_FIELDS.slice();
  const MIN_HISTORY = 5;

  function isValidDateYYYYMMDD(value) {
    if (typeof value !== "string") return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [y, m, d] = value.split("-").map((s) => Number(s));
    const dt = new Date(Date.UTC(y, m - 1, d));
    return (
      dt.getUTCFullYear() === y &&
      dt.getUTCMonth() === m - 1 &&
      dt.getUTCDate() === d
    );
  }

  function toNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const n = Number(trimmed);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  function getRobustZ(value, history) {
    if (window.compute && typeof window.compute.robustZ === "function") {
      return window.compute.robustZ(value, history);
    }
    return 0;
  }

  function hasFlatHistoryOutlier(value, history) {
    if (!Array.isArray(history) || history.length < MIN_HISTORY) return false;
    const first = history[0];
    if (!history.every((h) => h === first)) return false;
    return value !== first;
  }

  function validateCell(input) {
    const field = input && input.field;
    const value = input ? input.value : undefined;
    const historyRaw = input && Array.isArray(input.history) ? input.history : [];

    if (field === "ngay") {
      if (!isValidDateYYYYMMDD(value)) {
        return { severity: "error", message: "ngay bat buoc va phai dung YYYY-MM-DD" };
      }
      return null;
    }

    if (!NUMERIC_FIELDS.includes(field)) return null;

    const numberValue = toNumber(value);
    if (numberValue === null) {
      return { severity: "error", message: "Phải là số" };
    }

    if (PERCENT_FIELDS.includes(field) && (numberValue < 0 || numberValue > 1)) {
      return { severity: "warn", message: "Ty le nen trong 0..1" };
    }

    if (NON_NEGATIVE_FIELDS.includes(field) && numberValue < 0) {
      return { severity: "warn", message: "Nen >= 0" };
    }

    const history = historyRaw
      .map((item) => toNumber(item))
      .filter((item) => item !== null);

    if (history.length >= MIN_HISTORY) {
      const z = Math.abs(getRobustZ(numberValue, history));
      if (z > 3) {
        return { severity: "outlier", message: `Gia tri bat thuong (z=${z.toFixed(2)})` };
      }
      if (hasFlatHistoryOutlier(numberValue, history)) {
        return { severity: "outlier", message: "Gia tri bat thuong (z=inf)" };
      }
    }

    return null;
  }

  function validateRow(row, historyByField) {
    const out = [];
    const rowData = row || {};
    const fields = ["ngay"].concat(NUMERIC_FIELDS);
    fields.forEach((field) => {
      if (!(field in rowData)) return;
      const result = validateCell({
        field,
        value: rowData[field],
        row: rowData,
        history: historyByField && Array.isArray(historyByField[field]) ? historyByField[field] : []
      });
      if (result) out.push({ field, severity: result.severity, message: result.message });
    });
    return out;
  }

  window.validation = { validateCell, validateRow };
})();
