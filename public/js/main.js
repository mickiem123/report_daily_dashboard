const TABLES = {
  daily: "daily_metrics",
  weekly: "weekly_metrics",
  monthly: "monthly_metrics",
};

const ROWS_PER_FETCH = 22;

window.STATE = { daily: [], weekly: [], monthly: [] };

async function fetchTable(client, tableName) {
  const { data, error } = await client
    .from(tableName)
    .select("*")
    .order("ngay", { ascending: false })
    .limit(ROWS_PER_FETCH);

  if (error) {
    throw error;
  }

  return (data || []).reverse();
}

async function loadAll() {
  const sections = ["daily", "weekly", "monthly"];
  sections.forEach((section) => {
    const el = document.querySelector(`#${section} .content`);
    if (el) {
      el.innerHTML = '<div class="loading">Dang tai du lieu...</div>';
    }
  });

  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  try {
    const [daily, weekly, monthly] = await Promise.all([
      fetchTable(client, TABLES.daily),
      fetchTable(client, TABLES.weekly),
      fetchTable(client, TABLES.monthly),
    ]);

    window.STATE = { daily, weekly, monthly };
    console.log("STATE ready:", {
      daily: daily.length,
      weekly: weekly.length,
      monthly: monthly.length,
    });

    sections.forEach((section) => {
      const el = document.querySelector(`#${section} .content`);
      if (!el) return;
      const rows = window.STATE[section];
      el.innerHTML = rows.length
        ? `<p class="placeholder">${rows.length} rows loaded. Card rendering coming in T08.</p>`
        : '<p class="placeholder">Chua co du lieu.</p>';
    });
  } catch (err) {
    console.error("Fetch failed:", err);
    sections.forEach((section) => {
      const el = document.querySelector(`#${section} .content`);
      if (el) {
        el.innerHTML = `<div class="error">Loi tai du lieu: ${err.message || err}</div>`;
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", loadAll);
