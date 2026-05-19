(function () {
  const PRIORITY = ["hose", "margin", "phaisinh", "scash", "sfund", "momoi"];

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function verbClass(verb) {
    const normalized = normalizeVerb(verb);
    if (normalized.startsWith("tăng") || normalized.startsWith("tang")) return "up";
    if (normalized.startsWith("giảm") || normalized.startsWith("giam")) return "down";
    return "flat";
  }

  function normalizeVerb(verb) {
    if (typeof verb !== "string") return "";
    return verb.trim().toLowerCase();
  }

  function deltaClass(delta, inverse) {
    if (typeof delta !== "string") return "flat";
    const t = delta.trim().replace(/^\(/, "");
    let cls = "flat";
    if (t.startsWith("+")) cls = "up";
    if (t.startsWith("-")) cls = "down";
    if (inverse) {
      if (cls === "up") cls = "down";
      else if (cls === "down") cls = "up";
    }
    return cls;
  }

  function row(metric) {
    const cls = deltaClass(metric.delta, metric.inverse);
    return `
      <div class="metric-row">
        <span class="metric-label">${escapeHtml(metric.label)}</span>
        <span class="metric-value">${escapeHtml(metric.value)}</span>
        <span class="metric-delta ${cls}">${escapeHtml(metric.delta || "")}</span>
      </div>`;
  }

  function card(product, rank) {
    const metrics = (product.sub_metrics || []).filter((m) => m.value && m.value !== "N/A");
    const pinned = metrics.filter((m) => m.important);
    const details = metrics.filter((m) => !m.important);

    const grouped = new Map();
    const ungrouped = [];
    details.forEach((m) => {
      if (m.group) {
        if (!grouped.has(m.group)) grouped.set(m.group, []);
        grouped.get(m.group).push(m);
      } else {
        ungrouped.push(m);
      }
    });

    const detailHtml = [
      ...Array.from(grouped.entries()).map(
        ([group, items]) => `
        <div class="metric-group">
          <div class="group-label">${escapeHtml(group)}</div>
          <div class="group-metrics">${items.map(row).join("")}</div>
        </div>`
      ),
      ...ungrouped.map(row),
    ].join("");

    const vCls = verbClass(product.verb);
    const hCls = deltaClass(product.headline_delta, false);

    return `
      <article class="product-card ${vCls}" data-key="${escapeHtml(product.key)}" data-rank="${rank || 0}">
        <div class="card-header">
          <span class="trend-emoji">${escapeHtml(product.trend_emoji || "")}</span>
          <h3 class="product-name">${escapeHtml(product.name)}</h3>
          <span class="verb-badge ${vCls}">${escapeHtml(product.verb || "")}</span>
        </div>
        <div class="hero">
          <div class="hero-label">${escapeHtml(product.headline_label || "")}</div>
          <div class="hero-value">${escapeHtml(product.headline_value || "")}</div>
          <div class="hero-delta ${hCls}">${escapeHtml(product.headline_delta || "")}</div>
        </div>
        <div class="pinned">${pinned.map(row).join("")}</div>
        ${details.length ? `<button class="toggle-details" onclick="window.render.toggle('${escapeHtml(product.key)}')">Xem chi tiet</button>` : ""}
        ${details.length ? `<div class="details" id="details-${escapeHtml(product.key)}">${detailHtml}</div>` : ""}
      </article>`;
  }

  function toggle(key) {
    const el = document.getElementById(`details-${key}`);
    if (el) el.classList.toggle("open");
  }

  function sortProducts(products) {
    function bucket(verb) {
      const normalized = normalizeVerb(verb);
      if (normalized.startsWith("tăng") || normalized.startsWith("tang")) return 0;
      if (normalized.startsWith("giảm") || normalized.startsWith("giam")) return 2;
      return 1;
    }

    return [...products].sort((a, b) => {
      const ba = bucket(a.verb);
      const bb = bucket(b.verb);
      if (ba !== bb) return ba - bb;
      return PRIORITY.indexOf(a.key) - PRIORITY.indexOf(b.key);
    });
  }

  window.render = { card, sortProducts, toggle };
})();
