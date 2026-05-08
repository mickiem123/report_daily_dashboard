(function () {
  const ERR_THRESHOLD = -2_000_000_000;

  function clean(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === "string") return null;
    if (v instanceof Date) return null;
    if (typeof v === "number" && (Number.isNaN(v) || v < ERR_THRESHOLD)) return null;
    return v;
  }

  function fmt(v, unit) {
    const value = clean(v);
    if (value === null) return "N/A";
    if (unit === "%") return `${(value * 100).toFixed(2)}%`;
    if (unit === "tỷ") return `${Math.round(value).toLocaleString("en-US")} tỷ`;
    return `${Math.round(value).toLocaleString("en-US")}`;
  }

  function diff(today, prev, unit) {
    const a = clean(today);
    const b = clean(prev);
    if (a === null || b === null) {
      return {
        verb: "N/A",
        prep: "",
        valStr: "N/A",
        deltaStr: "",
        pctDelta: 0,
      };
    }

    const absDelta = a - b;
    const pctDelta = b === 0 ? 0 : (absDelta / b) * 100;
    let verb = "giữ nguyên mức";
    let prep = "";
    if (pctDelta > 5) {
      verb = "tăng mạnh";
      prep = "lên";
    } else if (pctDelta > 0) {
      verb = "tăng";
      prep = "lên";
    } else if (pctDelta < -5) {
      verb = "giảm mạnh";
      prep = "về";
    } else if (pctDelta < 0) {
      verb = "giảm";
      prep = "về";
    }

    if (unit === "%" && prep === "lên") prep = "lên mức";
    if (unit === "%" && prep === "về") prep = "về mức";

    const sign = absDelta >= 0 ? "+" : "-";
    const absAbs = Math.abs(absDelta);
    let deltaStr = "";
    if (unit === "%") {
      deltaStr = `(${sign}${(absAbs * 100).toFixed(2)}%)`;
    } else if (unit === "tỷ") {
      deltaStr = `(${sign}${Math.round(absAbs).toLocaleString("en-US")} tỷ, ${sign}${Math.abs(pctDelta).toFixed(2)}%)`;
    } else {
      const unitLabel = unit === "KH" || unit === "HĐ" || unit === "tài khoản" ? unit : "KH";
      deltaStr = `(${sign}${Math.round(absAbs).toLocaleString("en-US")} ${unitLabel}, ${sign}${Math.abs(pctDelta).toFixed(2)}%)`;
    }

    return { verb, prep, valStr: fmt(a, unit), deltaStr, pctDelta };
  }

  function median(xs) {
    const arr = (xs || []).filter((x) => x !== null && x !== undefined).sort((m, n) => m - n);
    if (!arr.length) return null;
    const i = Math.floor(arr.length / 2);
    return arr.length % 2 ? arr[i] : (arr[i - 1] + arr[i]) / 2;
  }

  function mad(xs) {
    const med = median(xs);
    if (med === null) return 0;
    const dev = (xs || []).filter((x) => x !== null && x !== undefined).map((x) => Math.abs(x - med));
    return median(dev) || 0;
  }

  function robustZ(value, history) {
    const arr = (history || []).filter((x) => typeof x === "number" && Number.isFinite(x));
    if (!arr.length || typeof value !== "number" || !Number.isFinite(value)) return 0;
    const med = median(arr);
    const m = mad(arr);
    if (med === null) return 0;
    if (m === 0) return 0;
    return (value - med) / (1.4826 * m);
  }

  function isManhDelta(today, prev, history, cfg) {
    if (today === null || today === undefined || prev === null || prev === undefined) return false;
    const mode = (cfg && cfg.mode) || "pct";
    const floor = Number((cfg && cfg.floor) || 0);
    const kSigma = Number((cfg && cfg.k_sigma) || 3);

    const delta = (a, b) => {
      if (mode === "pp") return a - b;
      if (b === 0) return 0;
      return ((a - b) / b) * 100;
    };

    const d0 = delta(today, prev);
    if (floor > 0 && Math.abs(d0) >= floor) return true;

    const h = Array.isArray(history) ? history.filter((x) => typeof x === "number" && Number.isFinite(x)) : [];
    if (h.length < 4) return false;
    const ds = [];
    for (let i = 1; i < h.length; i += 1) ds.push(delta(h[i], h[i - 1]));

    const med = median(ds);
    if (med === null) return false;
    const madValue = mad(ds);
    let sigma = 1.4826 * madValue;
    if (sigma <= 1e-9) sigma = 1e-9;
    const z = Math.abs((d0 - med) / sigma);
    return z >= kSigma;
  }

  function metricHistory(colName, rows, todayVal, window = 20) {
    const vals = (rows || []).map((r) => clean(r && r[colName])).filter((v) => v !== null);
    if (vals.length && todayVal !== null && todayVal !== undefined && vals[vals.length - 1] === todayVal) {
      vals.pop();
    }
    if (window && vals.length > window + 1) {
      return vals.slice(-(window + 1));
    }
    return vals;
  }

  function detectTrend(colName, rows) {
    const vals = (rows || []).map((r) => clean(r && r[colName])).filter((v) => v !== null);
    if (vals.length < 2) return "";
    const last = vals[vals.length - 1];
    const prev = vals[vals.length - 2];
    if (prev !== 0 && (last - prev) / Math.abs(prev) < -0.15) return "🔴";

    if (vals.length < 3) return "";
    let inc = 1;
    let dec = 1;
    for (let i = vals.length - 1; i > 0; i -= 1) {
      if (vals[i] > vals[i - 1]) {
        inc += 1;
      } else {
        break;
      }
    }
    for (let i = vals.length - 1; i > 0; i -= 1) {
      if (vals[i] < vals[i - 1]) {
        dec += 1;
      } else {
        break;
      }
    }
    if (inc >= 3) return "📈";
    if (dec >= 3) return "📉";
    return "";
  }

  function serialToDate(serial) {
    if (serial instanceof Date) return serial;
    const base = new Date(Date.UTC(1899, 11, 30));
    return new Date(base.getTime() + Number(serial) * 86400000);
  }

  function weekdayVn(input) {
    const date = typeof input === "string" ? new Date(`${input}T00:00:00`) : input;
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
    let wd = date.getDay();
    let mapped = wd === 0 ? 7 : wd;
    if (mapped >= 6) mapped = 5;
    return { 1: "T2", 2: "T3", 3: "T4", 4: "T5", 5: "T6" }[mapped] || "";
  }

  window.compute = {
    clean,
    fmt,
    diff,
    detectTrend,
    isManhDelta,
    metricHistory,
    serialToDate,
    weekdayVn,
    mad,
    robustZ,
  };
})();
