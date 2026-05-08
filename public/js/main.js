const TABLES = {
  daily: "daily_metrics",
  weekly: "weekly_metrics",
  monthly: "monthly_metrics",
};

const ROWS_PER_FETCH = 22;
const PRODUCT_FNS = ["hose", "margin", "phaisinh", "scash", "sfund", "momoi"];

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
  if (mode === "weekly") return `Tuan ket thuc ${ngay}`;
  if (mode === "monthly") return String(ngay).slice(0, 7);
  return ngay;
}

function renderSection(mode) {
  const el = document.querySelector(`#${mode} .content`);
  if (!el) return;

  const rows = window.STATE[mode] || [];
  if (rows.length < 1) {
    el.innerHTML = '<p class="placeholder">Chua co du lieu.</p>';
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

async function loadAll() {
  const sections = ["daily", "weekly", "monthly"];
  sections.forEach((section) => {
    const el = document.querySelector(`#${section} .content`);
    if (el) el.innerHTML = '<div class="loading">Dang tai du lieu...</div>';
  });

  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  try {
    const [daily, weekly, monthly] = await Promise.all([
      fetchTable(client, TABLES.daily),
      fetchTable(client, TABLES.weekly),
      fetchTable(client, TABLES.monthly),
    ]);

    window.STATE = { daily, weekly, monthly };
    console.log("STATE ready:", { daily: daily.length, weekly: weekly.length, monthly: monthly.length });
    sections.forEach(renderSection);
  } catch (err) {
    console.error("Fetch failed:", err);
    sections.forEach((section) => {
      const el = document.querySelector(`#${section} .content`);
      if (el) el.innerHTML = `<div class="error">Loi tai du lieu: ${err.message || err}</div>`;
    });
  }
}

document.addEventListener("DOMContentLoaded", loadAll);
