(function initGridModule() {
  const MODES = ["daily", "weekly", "monthly"];
  const EDIT_SESSION_PREFIX = "canEdit_";
  const SAVE_DEBOUNCE_MS = 1000;
  const TABLES = {
    daily: "daily_metrics",
    weekly: "weekly_metrics",
    monthly: "monthly_metrics"
  };
  const DATA_COLUMNS = [
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

  const pendingSaves = {};

  function getClient() {
    return window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  }

  function sanitizeRow(row) {
    const output = {};
    Object.keys(row || {}).forEach((key) => {
      if (key === "id" || key === "pushed_at" || key === "__lockedNgay") return;
      const value = row[key];
      output[key] = value === "" ? null : value;
    });
    return output;
  }

  async function upsertRowByNgay(mode, row) {
    const payload = sanitizeRow(row);
    const { error } = await getClient()
      .from(TABLES[mode])
      .upsert(payload, { onConflict: "ngay" });

    if (error) throw error;
  }

  async function deleteByNgay(mode, ngay) {
    const { error } = await getClient()
      .from(TABLES[mode])
      .delete()
      .eq("ngay", ngay);

    if (error) throw error;
  }

  async function reloadAfterMutation(mode) {
    if (typeof window.reloadSection === "function") {
      await window.reloadSection(mode);
      return;
    }
    if (window.grid && typeof window.grid.refresh === "function") {
      window.grid.refresh(mode);
    }
  }

  function scheduleSave(mode, rowData) {
    const ngay = rowData && rowData.ngay ? String(rowData.ngay).trim() : "";
    if (!ngay) {
      window.alert("Cần có giá trị 'ngày' trước khi lưu.");
      return;
    }

    const saveKey = `${mode}:${ngay}`;
    if (pendingSaves[saveKey]) {
      clearTimeout(pendingSaves[saveKey]);
    }

    pendingSaves[saveKey] = setTimeout(async () => {
      delete pendingSaves[saveKey];
      try {
        await upsertRowByNgay(mode, rowData);
        await reloadAfterMutation(mode);
      } catch (err) {
        console.error(`Save failed for ${mode}/${ngay}:`, err);
        window.alert(`Lưu thất bại: ${err.message || err}`);
      }
    }, SAVE_DEBOUNCE_MS);
  }

  function buildColumns(mode) {
    const columns = [
      {
        title: "ngày",
        field: "ngay",
        frozen: true,
        editor: "date",
        editable(cell) {
          const rowData = cell.getRow().getData();
          return !rowData.__lockedNgay;
        },
        width: 140,
        headerSort: false
      }
    ];

    DATA_COLUMNS.forEach((field) => {
      columns.push({
        title: field,
        field,
        editor: "number",
        headerSort: false,
        minWidth: 140
      });
    });

    columns.push({
      title: "xóa",
      field: "__actions",
      formatter: () => '<button type="button" class="delete-row-btn">Xóa</button>',
      headerSort: false,
      width: 90,
      hozAlign: "center",
      cellClick: async (e, cell) => {
        e.preventDefault();
        const rowData = cell.getRow().getData();
        const ngay = rowData && rowData.ngay ? String(rowData.ngay).trim() : "";

        if (!ngay) {
          window.alert("Cần có ngày để xóa dòng.");
          return;
        }

        if (!window.confirm(`Xóa dòng ngày ${ngay}?`)) return;

        try {
          await deleteByNgay(mode, ngay);
          await reloadAfterMutation(mode);
        } catch (err) {
          console.error(`Delete failed for ${mode}/${ngay}:`, err);
          window.alert(`Xóa thất bại: ${err.message || err}`);
        }
      }
    });

    return columns;
  }

  function getModeRows(mode) {
    const rows = Array.isArray(window.STATE && window.STATE[mode]) ? window.STATE[mode] : [];
    return rows.slice(-20).map((row) => ({ ...row }));
  }

  function buildGridRows(mode) {
    const rows = getModeRows(mode).map((row) => ({ ...row, __lockedNgay: true }));
    rows.push({ ngay: "", __lockedNgay: false });
    return rows;
  }

  function ensureTable(mode) {
    const tableId = `#grid-${mode}`;
    const el = document.querySelector(tableId);
    if (!el || !window.Tabulator) return null;

    if (window.grid._tables[mode]) return window.grid._tables[mode];

    const table = new window.Tabulator(el, {
      data: buildGridRows(mode),
      layout: "fitDataStretch",
      columns: buildColumns(mode),
      height: "420px",
      index: "ngay",
      cellEdited(cell) {
        const field = cell.getField();
        const value = cell.getValue();
        const oldValue = cell.getOldValue();
        const rowData = cell.getRow().getData();
        const history = getModeRows(mode).map((row) => row[field]);

        const result = window.validation && typeof window.validation.validateCell === "function"
          ? window.validation.validateCell({
              field,
              value,
              row: rowData,
              history
            })
          : null;

        const cellEl = cell.getElement();
        cellEl.classList.remove("cell-error", "cell-warn", "cell-outlier");
        cellEl.removeAttribute("title");

        if (result) {
          cellEl.classList.add(`cell-${result.severity}`);
          cellEl.title = result.message;
        }

        if (result && result.severity === "error") {
          if (typeof cell.restoreOldValue === "function") {
            cell.restoreOldValue();
          } else {
            cell.setValue(oldValue, true);
          }
          return;
        }

        scheduleSave(mode, rowData);
      }
    });

    window.grid._tables[mode] = table;
    return table;
  }

  function showGrid(mode, show) {
    const wrap = document.querySelector(`#grid-wrap-${mode}`);
    if (!wrap) return;
    wrap.hidden = !show;
  }

  function setAddRowVisible(mode, visible) {
    const btn = document.querySelector(`.add-row-btn[data-mode="${mode}"]`);
    if (!btn) return;
    btn.classList.toggle("hidden", !visible);
  }

  function isAllowed(mode) {
    return sessionStorage.getItem(`${EDIT_SESSION_PREFIX}${mode}`) === "1";
  }

  function requestAccess(mode) {
    const password = window.prompt("Nhập mật khẩu:");
    if (password !== window.WRITE_PASSWORD) {
      window.alert("Sai mật khẩu");
      return false;
    }
    sessionStorage.setItem(`${EDIT_SESSION_PREFIX}${mode}`, "1");
    setAddRowVisible(mode, true);
    return true;
  }

  window.grid = {
    _tables: {},

    toggle(mode) {
      if (!MODES.includes(mode)) return;

      const wrap = document.querySelector(`#grid-wrap-${mode}`);
      if (!wrap) return;

      const isHidden = wrap.hidden;
      if (!isHidden) {
        showGrid(mode, false);
        return;
      }

      if (!isAllowed(mode) && !requestAccess(mode)) {
        showGrid(mode, false);
        return;
      }

      setAddRowVisible(mode, true);
      showGrid(mode, true);
      this.refresh(mode);
    },

    refresh(mode) {
      if (!MODES.includes(mode)) return;
      const table = ensureTable(mode);
      if (!table) return;
      table.replaceData(buildGridRows(mode));
    },

    addRow(mode) {
      const targetMode = MODES.includes(mode) ? mode : MODES[0];
      if (!isAllowed(targetMode) && !requestAccess(targetMode)) {
        showGrid(targetMode, false);
        return;
      }

      setAddRowVisible(targetMode, true);
      showGrid(targetMode, true);
      const table = ensureTable(targetMode);
      if (!table) return;
      table.addRow({ ngay: "", __lockedNgay: false }, false);
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    MODES.forEach((mode) => {
      setAddRowVisible(mode, isAllowed(mode));
    });

    const buttons = document.querySelectorAll(".entry-btn[data-mode]");
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const mode = button.getAttribute("data-mode");
        window.grid.toggle(mode);
      });
    });

    const addRowButtons = document.querySelectorAll(".add-row-btn[data-mode]");
    addRowButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const mode = button.getAttribute("data-mode");
        window.grid.addRow(mode);
      });
    });
  });
})();