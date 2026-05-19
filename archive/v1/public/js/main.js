const TABLES = {
  daily: "daily_metrics",
  weekly: "weekly_metrics",
  monthly: "monthly_metrics",
};

const ROWS_PER_FETCH = 22;
const PRODUCT_FNS = ["hose", "margin", "phaisinh", "scash", "sfund", "momoi"];
const SECTIONS = ["daily", "weekly", "monthly"];
const REFRESH_CONFIRM_MESSAGE = "Tải lại dữ liệu? Có thể mất vài giây.";
const REFRESH_COOLDOWN_MS = 5000;
const LAST_REFRESH_KEY = "lastRefreshDate";
const refreshLocks = new Set();

window.STATE = { daily: [], weekly: [], monthly: [] };

async function fetchTable(client, tableName) {
  const { data, error } = await client
    .from(tableName)
    .select("*")
    .order("ngay", { ascending: false })
    .limit(ROWS_PER_FETCH);

  if (error) throw error;
  return (data || []).reverse();
}

function formatPeriod(mode, ngay) {
  if (!ngay) return "...";
  if (mode === "daily") return ngay;
  if (mode === "weekly") return `Tuần kết thúc ${ngay}`;
  if (mode === "monthly") return String(ngay).slice(0, 7);
  return ngay;
}

function renderSection(mode) {
  const el = document.querySelector(`#${mode} .content`);
  if (!el) return;

  const rows = window.STATE[mode] || [];
  if (rows.length < 1) {
    el.innerHTML = '<p class="placeholder">Chưa có dữ liệu.</p>';
    return;
  }

  const today = rows[rows.length - 1];
  const prev = rows.length >= 2 ? rows[rows.length - 2] : null;
  const periodEl = document.querySelector(`#${mode} .period-label`);
  if (periodEl) periodEl.textContent = formatPeriod(mode, today.ngay);

  const products = PRODUCT_FNS.map((name) => window.extractors[name](today, prev, rows));
  const sorted = window.render.sortProducts(products);
  el.innerHTML = sorted.map((p, i) => window.render.card(p, i)).join("");
}

function getTodayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isStaleRefreshDate() {
  return localStorage.getItem(LAST_REFRESH_KEY) !== getTodayString();
}

function setLastRefreshDateToday() {
  localStorage.setItem(LAST_REFRESH_KEY, getTodayString());
}

function setButtonCooldown(mode) {
  const btn = document.querySelector(`#${mode} .section-actions .refresh-btn`);
  if (!btn) return;
  btn.disabled = true;
  setTimeout(() => {
    btn.disabled = false;
  }, REFRESH_COOLDOWN_MS);
}

function ensureRefreshButtons() {
  SECTIONS.forEach((mode) => {
    const actionsEl = document.querySelector(`#${mode} .section-actions`);
    if (!actionsEl || actionsEl.querySelector(".refresh-btn")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "refresh-btn";
    btn.textContent = "↻ Tải lại";
    btn.addEventListener("click", () => window.refresh(mode));
    actionsEl.appendChild(btn);
  });
}

async function loadSection(mode, options = {}) {
  const { silent = false } = options;
  const contentEl = document.querySelector(`#${mode} .content`);
  if (!contentEl) return;

  if (!silent) contentEl.innerHTML = '<div class="loading">Đang tải dữ liệu...</div>';

  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const data = await fetchTable(client, TABLES[mode]);
  window.STATE[mode] = data;
  renderSection(mode);
  if (window.grid && typeof window.grid.refresh === "function") {
    window.grid.refresh(mode);
  }
}

async function reloadSection(mode) {
  if (!SECTIONS.includes(mode)) return false;
  try {
    await loadSection(mode, { silent: true });
    return true;
  } catch (err) {
    console.error(`Reload failed for ${mode}:`, err);
    return false;
  }
}

async function loadAll(options = {}) {
  const { silent = false } = options;
  if (!silent) {
    SECTIONS.forEach((section) => {
      const el = document.querySelector(`#${section} .content`);
      if (el) el.innerHTML = '<div class="loading">Đang tải dữ liệu...</div>';
    });
  }

  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  try {
    const [daily, weekly, monthly] = await Promise.all([
      fetchTable(client, TABLES.daily),
      fetchTable(client, TABLES.weekly),
      fetchTable(client, TABLES.monthly),
    ]);

    window.STATE = { daily, weekly, monthly };
    console.log("STATE ready:", { daily: daily.length, weekly: weekly.length, monthly: monthly.length });
    SECTIONS.forEach(renderSection);
    return true;
  } catch (err) {
    console.error("Fetch failed:", err);
    SECTIONS.forEach((section) => {
      const el = document.querySelector(`#${section} .content`);
      if (el) el.innerHTML = `<div class="error">Lỗi tải dữ liệu: ${err.message || err}</div>`;
    });
    return false;
  }
}

window.refresh = async function refresh(mode) {
  if (!SECTIONS.includes(mode)) return;
  if (!window.confirm(REFRESH_CONFIRM_MESSAGE)) return;
  if (refreshLocks.has(mode)) return false;

  const contentEl = document.querySelector(`#${mode} .content`);
  const previousHTML = contentEl ? contentEl.innerHTML : "";
  const periodEl = document.querySelector(`#${mode} .period-label`);
  const previousPeriod = periodEl ? periodEl.textContent : "";
  const button = document.querySelector(`#${mode} .section-actions .refresh-btn`);

  refreshLocks.add(mode);
  if (button) button.disabled = true;

  try {
    await loadSection(mode);
    setButtonCooldown(mode);
    return true;
  } catch (err) {
    console.error(`Refresh failed for ${mode}:`, err);
    if (contentEl) {
      contentEl.innerHTML = `<div class="error">Lỗi tải dữ liệu: ${err.message || err}</div>${previousHTML}`;
    }
    if (periodEl && typeof previousPeriod === "string" && previousPeriod.length > 0) {
      periodEl.textContent = previousPeriod;
    }
    if (button) button.disabled = false;
    return false;
  } finally {
    refreshLocks.delete(mode);
  }
};

window.reloadSection = reloadSection;

async function init() {
  ensureRefreshButtons();
  const ok = await loadAll();
  if (!ok) return;

  if (isStaleRefreshDate()) {
    await loadAll({ silent: true });
  }
  setLastRefreshDateToday();
}

document.addEventListener("DOMContentLoaded", init);