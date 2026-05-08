import datetime
import json
import openpyxl
import os
import re
import sys
import webbrowser

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

# ── CONSTANTS ──────────────────────────────────────────────────────────────────
DAILY_FILE  = r"C:\Users\huanvd-i2025\OneDrive - ssi.com.vn\Documents\Derivative\raw_data\daily_general_data\daily_data.xlsx"
WEEKLY_FILE = r"C:\Users\huanvd-i2025\OneDrive - ssi.com.vn\Documents\Derivative\raw_data\daily_general_data\weekly_data.xlsx"
MONTHLY_FILE = r"C:\Users\huanvd-i2025\OneDrive - ssi.com.vn\Documents\Derivative\raw_data\daily_general_data\monthly_data.xlsx"
SHEET_NAME  = "data"
ERR_THRESHOLD = -2_000_000_000
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "daily_report.html")


def _read_asset_text(rel_path: str) -> str:
    base = os.path.dirname(os.path.abspath(__file__))
    abs_path = os.path.join(base, rel_path)
    try:
        with open(abs_path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return ""


# ── HELPERS ────────────────────────────────────────────────────────────────────
def clean(v):
    if v is None:
        return None
    if isinstance(v, str):
        return None
    if isinstance(v, (datetime.datetime, datetime.date)):
        return None
    if isinstance(v, int) and v < ERR_THRESHOLD:
        return None
    return v


def fmt(v, unit):
    if v is None:
        return "N/A"
    if unit == "%":
        return f"{v * 100:.2f}%"
    if unit == "tỷ":
        return f"{round(v):,} tỷ"
    return f"{round(v):,}"


def diff(today, prev, unit):
    if today is None or prev is None:
        return ("N/A", "", "N/A", "", 0.0)

    abs_delta = today - prev
    if prev == 0:
        pct_delta = 0.0
    else:
        pct_delta = abs_delta / prev * 100

    if pct_delta > 5:
        verb, prep = "tăng mạnh", "lên"
    elif pct_delta > 0:
        verb, prep = "tăng", "lên"
    elif pct_delta < -5:
        verb, prep = "giảm mạnh", "về"
    elif pct_delta < 0:
        verb, prep = "giảm", "về"
    else:
        verb, prep = "giữ nguyên mức", ""

    val_str = fmt(today, unit)

    sign = "+" if abs_delta >= 0 else "-"
    abs_abs = abs(abs_delta)

    if unit == "%":
        delta_part = f"({sign}{abs_abs * 100:.2f}%)"
    elif unit == "tỷ":
        delta_part = f"({sign}{round(abs_abs):,} tỷ, {sign}{abs(pct_delta):.2f}%)"
    else:
        unit_label = unit if unit in ("KH", "HĐ", "tài khoản") else "KH"
        delta_part = f"({sign}{round(abs_abs):,} {unit_label}, {sign}{abs(pct_delta):.2f}%)"

    return verb, prep, val_str, delta_part, pct_delta


def _median(xs):
    xs = sorted(x for x in xs if x is not None)
    if not xs:
        return None
    m = len(xs) // 2
    if len(xs) % 2:
        return xs[m]
    return (xs[m - 1] + xs[m]) / 2


def _mad(xs, med):
    dev = [abs(x - med) for x in xs if x is not None]
    return _median(dev) if dev else 0.0


def is_manh_delta(today, prev, history, cfg) -> bool:
    if today is None or prev is None:
        return False

    mode = cfg.get("mode", "pct")  # "pct" | "pp"
    floor = float(cfg.get("floor", 0.0))
    k_sigma = float(cfg.get("k_sigma", 3.0))

    def delta(a, b) -> float:
        if mode == "pp":
            return float(a - b)
        if b == 0:
            return 0.0
        return float((a - b) / b * 100.0)

    d0 = delta(today, prev)
    if floor > 0 and abs(d0) >= floor:
        return True

    if not history or len(history) < 4:
        return False

    ds = [delta(history[i], history[i - 1]) for i in range(1, len(history))]
    med = _median(ds)
    if med is None:
        return False

    mad = _mad(ds, med)
    robust_sigma = 1.4826 * mad
    if robust_sigma <= 1e-9:
        robust_sigma = 1e-9

    z = abs((d0 - med) / robust_sigma)
    return z >= k_sigma


MANH_CFG = {
    # Liquidity-like series: use pct change with a higher absolute floor.
    "hose_liq_mkt": {"mode": "pct", "floor": 15.0, "k_sigma": 3.0},
    "ps_liq": {"mode": "pct", "floor": 15.0, "k_sigma": 3.0},
    # Ratio-like series stored as % (decimal in sheet): detect in percentage points.
    "ps_dplus_ratio": {"mode": "pp", "floor": 1.0, "k_sigma": 3.0},
}


def _metric_history(col_idx: int, rows, today_val, window: int = 20):
    vals = [clean(r[col_idx]) for r in rows]
    vals = [v for v in vals if v is not None]
    if vals and today_val is not None and vals[-1] == today_val:
        vals = vals[:-1]
    if window and len(vals) > window + 1:
        vals = vals[-(window + 1) :]
    return vals


def _prep_muc(prep):
    if prep == "lên":
        return "lên mức"
    if prep == "về":
        return "về mức"
    return prep


def _fix_line(line):
    """Collapse internal double spaces and remove space before punctuation."""
    lstripped = line.lstrip(" ")
    indent = line[: len(line) - len(lstripped)]
    fixed = re.sub(r" {2,}", " ", lstripped)
    fixed = re.sub(r" ([.,])", r"\1", fixed)
    return indent + fixed.rstrip()


def detect_trend(col_idx, rows):
    vals = [clean(r[col_idx]) for r in rows]
    vals = [v for v in vals if v is not None]
    if len(vals) < 2:
        return ""
    last = vals[-1]
    prev = vals[-2]
    # Keep only the Critical/Sudden Drop check
    if prev != 0 and (last - prev) / abs(prev) < -0.15:
        return "⚠️ "
    return ""



def serial_to_date(serial):
    if isinstance(serial, (datetime.datetime, datetime.date)):
        if isinstance(serial, datetime.datetime):
            return serial.date()
        return serial
    return datetime.date(1899, 12, 30) + datetime.timedelta(days=int(serial))


def weekday_vn(date):
    wd = date.weekday()
    if wd >= 5:
        date = date - datetime.timedelta(days=(wd - 4))
        wd = 4
    return {0: "T2", 1: "T3", 2: "T4", 3: "T5", 4: "T6"}[wd]


# ── DATA LOADER ────────────────────────────────────────────────────────────────
def load_data(n=22, file=DAILY_FILE):
    wb = openpyxl.load_workbook(file, data_only=True, read_only=True)
    ws = wb[SHEET_NAME]
    all_rows = []
    
    for row in ws.iter_rows(values_only=True):
        if row[0] is not None:
            all_rows.append(list(row))
    wb.close()
    
    # Exclude the header row (the first item)
    data_rows = all_rows[1:] 
    
    # Your fix: Get the actual number of data rows
    maxrow = len(data_rows)
    n = min(n, maxrow)
    
    # Return the safely sliced list
    return data_rows[-n:] if n > 0 else []


# ── BLOCK FORMATTERS (ORIGINAL TEXT MODE) ──────────────────────────────────────
def block_hose(today, prev, emoji):
    c = lambda idx: clean(today[idx])
    p = lambda idx: clean(prev[idx])

    v2, pr2, vs2, d2, _ = diff(c(1), p(1), "%")
    v6, pr6, vs6, d6, _ = diff(c(5), p(5), "tỷ")
    v5, pr5, vs5, d5, _ = diff(c(4), p(4), "tỷ")
    v3, pr3, vs3, d3, _ = diff(c(2), p(2), "%")
    v4, pr4, vs4, d4, _ = diff(c(3), p(3), "%")

    pm2 = _prep_muc(pr2)
    pm3 = _prep_muc(pr3)
    pm4 = _prep_muc(pr4)

    lines = [
        f"{emoji}{{n}}. Thị phần HOSE {v2} {pm2} {vs2} {d2}.",
        f"   a. Thanh khoản thị trường {v6} {pr6} {vs6} {d6}.",
        f"   b. GTGD của SSI {v5} {pr5} {vs5} {d5}.",
        f"   c. Thị phần CN {v3} {pm3} {vs3} {d3}. Thị phần DS {v4} {pm4} {vs4} {d4}.",
    ]
    return "\n".join(lines), v2


def block_margin(today, prev, emoji):
    c = lambda idx: clean(today[idx])
    p = lambda idx: clean(prev[idx])

    v7, pr7, vs7, d7, _ = diff(c(6), p(6), "tỷ")
    v8, pr8, vs8, d8, _ = diff(c(7), p(7), "KH")
    v9, pr9, vs9, d9, _ = diff(c(8), p(8), "tỷ")
    v10, pr10, vs10, d10, _ = diff(c(9), p(9), "KH")
    v11, pr11, vs11, d11, _ = diff(c(10), p(10), "tỷ")
    v12, pr12, vs12, d12, _ = diff(c(11), p(11), "KH")
    v13, pr13, vs13, d13, _ = diff(c(12), p(12), "KH")
    v14, pr14, vs14, d14, _ = diff(c(13), p(13), "KH")
    v15, pr15, vs15, d15, _ = diff(c(14), p(14), "tỷ")
    v16, pr16, vs16, d16, _ = diff(c(15), p(15), "KH")
    v17, pr17, vs17, d17, _ = diff(c(16), p(16), "tỷ")
    v18, pr18, vs18, d18, _ = diff(c(17), p(17), "KH")
    v19, pr19, vs19, d19, _ = diff(c(18), p(18), "tỷ")
    v20, pr20, vs20, d20, _ = diff(c(19), p(19), "tỷ")

    lines = [
        f"{emoji}{{n}}. Margin TK6+7 {v7} dư nợ {pr7} {vs7} {d7}, lượng khách hàng {v8} {pr8} {vs8} {d8}.",
        f"   a. T+7 {v9} dư nợ {pr9} {vs9} {d9}, SLKH {v10} {pr10} {vs10} {d10}.",
        f"   b. Trading Plus {v11} dư nợ {pr11} {vs11} {d11}, SLKH {v12} {pr12} {vs12} {d12}.",
        f"   c. SLKH register M+ {v13} {pr13} {vs13} {d13}, SLKH active {v14} {pr14} {vs14} {d14}",
        f"      Dư nợ M+ {v15} {pr15} {vs15} {d15}, SLKH có dư nợ {v16} {pr16} {vs16} {d16},",
        f"      Giải ngân trong ngày {v17} {pr17} {vs17} {d17}, SLKH giải ngân M+ {v18} {pr18} {vs18} {d18}",
    ]
    
    if v20 != "N/A":
        lines.append(f"      Dư nợ SPV {v20} {pr20} {vs20} {d20},")
    elif v19 != "N/A":
        lines.append(f"      Dư nợ SSI {v19} {pr19} {vs19} {d19},") # Keep if SSI still exists (though deprecated)

    return "\n".join(lines), v7


def block_phaisinh(today, prev, emoji):
    c = lambda idx: clean(today[idx])
    p = lambda idx: clean(prev[idx])

    v22, pr22, vs22, d22, _ = diff(c(21), p(21), "%")
    v23, pr23, vs23, d23, _ = diff(c(22), p(22), "HĐ")
    v25, pr25, vs25, d25, _ = diff(c(24), p(24), "KH")
    v28, pr28, vs28, d28, _ = diff(c(27), p(27), "KH")
    v29, pr29, vs29, d29, _ = diff(c(28), p(28), "%")
    v35, pr35, vs35, d35, _ = diff(c(34), p(34), "tỷ")
    v36, pr36, vs36, d36, _ = diff(c(35), p(35), "tỷ")
    v33, pr33, vs33, d33, _ = diff(c(32), p(32), "KH")
    v31, pr31, vs31, d31, _ = diff(c(30), p(30), "KH")
    v30, pr30, vs30, d30, _ = diff(c(29), p(29), "KH")

    pm22 = _prep_muc(pr22)
    pm29 = _prep_muc(pr29)

    lines = [
        f"{emoji}{{n}}. Phái sinh {v22} thị phần tổng {pm22} {vs22} {d22}.",
        f"   a. Thanh khoản {v23} {pr23} {vs23} {d23}.",
        f"   b. SLKH {v25} {pr25} {vs25} {d25}.",
        f"   c. D+: SLKH {v28} {pr28} {vs28} {d28}.",
        f"      - Tỉ lệ SLKH sử dụng D+ {v29} {pm29} {vs29} {d29}.",
    ]
    if v35 != "N/A" or v36 != "N/A":
        parts = []
        if v35 != "N/A": parts.append(f"Giải ngân trong ngày {v35} {pr35} {vs35} {d35}")
        if v36 != "N/A": parts.append(f"Dư nợ cuối ngày {v36} {pr36} {vs36} {d36}")
        lines.append(f"      - {', '.join(parts)}.")
    
    lines.append(f"      - {vs33} KH đang sử dụng {d33}, {vs31} đăng ký mới {d31}, {vs30} hủy dịch vụ {d30}.")

    return "\n".join(lines), v22


def block_scash(today, prev, emoji):
    c = lambda idx: clean(today[idx])
    p = lambda idx: clean(prev[idx])

    v37, pr37, vs37, d37, _ = diff(c(36), p(36), "tỷ")
    v40, pr40, vs40, d40, _ = diff(c(39), p(39), "KH")
    v38, pr38, vs38, d38, _ = diff(c(37), p(37), "tỷ")
    v39, pr39, vs39, d39, _ = diff(c(38), p(38), "%")

    pm39 = _prep_muc(pr39)

    lines = [
        f"{emoji}{{n}}. S-Cash {v37} số dư {pr37} {vs37} {d37}, SLKH {v40} {pr40} {vs40} {d40}.",
        f"   a. Tổng số dư Scash + Casa {v38} {pr38} {vs38} {d38}.",
        f"   b. Tỉ lệ S-Cash/CASA {v39} {pm39} {vs39} {d39}.",
    ]
    return "\n".join(lines), v37


def block_sfund(today, prev, emoji):
    c = lambda idx: clean(today[idx])
    p = lambda idx: clean(prev[idx])

    v41, pr41, vs41, d41, _ = diff(c(40), p(40), "tỷ")
    v42, pr42, vs42, d42, _ = diff(c(41), p(41), "KH")

    lines = [
        f"{emoji}{{n}}. S-Fund {v41} số dư {pr41} {vs41} {d41}, SLKH {v42} {pr42} {vs42} {d42}.",
    ]
    return "\n".join(lines), v41


def block_moimoi(today, prev, emoji):
    c = lambda idx: clean(today[idx])
    p = lambda idx: clean(prev[idx])

    v43, pr43, vs43, d43, _ = diff(c(42), p(42), "tài khoản")

    lines = [
        f"{emoji}{{n}}. Số lượng KH Mở mới {v43} {pr43} {vs43} {d43}.",
    ]
    return "\n".join(lines), v43


# ── REPORT GENERATOR (ORIGINAL TEXT MODE) ──────────────────────────────────────
_TANG_VERBS = {"tăng", "tăng mạnh"}
_GIAM_VERBS = {"giảm", "giảm mạnh"}


def _classify(verb):
    if verb in _TANG_VERBS:
        return "tang"
    if verb in _GIAM_VERBS:
        return "giam"
    return "giu"


def generate_report(rows, weekly=False, monthly=False):
    today = rows[-1]
    prev = rows[-2]

    if monthly:
        today_label = str(today[0]) if today[0] is not None else "N/A"
        prev_label  = str(prev[0])  if prev[0]  is not None else "N/A"
        header = f"Dear các anh chị, em xin gửi Báo cáo Tháng {today_label}:"
        footer = f"(Dữ liệu tháng {today_label}, so sánh với tháng {prev_label})"
    elif weekly:
        today_label = str(today[0]) if today[0] is not None else "N/A"
        prev_label  = str(prev[0])  if prev[0]  is not None else "N/A"
        header = f"Dear các anh chị, em xin gửi Báo cáo Tuần {today_label}:"
        footer = f"(Dữ liệu tuần {today_label}, so sánh với tuần {prev_label})"
    else:
        today_date = serial_to_date(today[0])
        prev_date  = serial_to_date(prev[0])
        wday = weekday_vn(today_date)
        header = f"Dear các anh chị, em xin gửi Báo cáo phiên {wday} - {today_date.strftime('%d/%m')}:"
        footer = f"(Dữ liệu ngày {today_date.strftime('%d/%m/%Y')}, so sánh với {prev_date.strftime('%d/%m/%Y')})"

    e_hose   = detect_trend(1, rows)
    e_margin = detect_trend(6, rows)
    e_ps     = detect_trend(21, rows)
    e_scash  = detect_trend(36, rows)
    e_sfund  = detect_trend(40, rows)
    e_moimoi = detect_trend(42, rows)

    b_hose,   v_hose   = block_hose(today, prev, e_hose)
    b_margin, v_margin = block_margin(today, prev, e_margin)
    b_ps,     v_ps     = block_phaisinh(today, prev, e_ps)
    b_scash,  v_scash  = block_scash(today, prev, e_scash)
    b_sfund,  v_sfund  = block_sfund(today, prev, e_sfund)
    b_moimoi, v_moimoi = block_moimoi(today, prev, e_moimoi)

    priority_order = [
        ("hose",   b_hose,   v_hose,   e_hose),
        ("margin", b_margin, v_margin, e_margin),
        ("ps",     b_ps,     v_ps,     e_ps),
        ("scash",  b_scash,  v_scash,  e_scash),
        ("sfund",  b_sfund,  v_sfund,  e_sfund),
        ("moimoi", b_moimoi, v_moimoi, e_moimoi),
    ]

    def _get_final_prefix(trend_emoji, verb):
        status_icon = ""
        if "tăng mạnh" in verb:
            status_icon = "🟢 "
        elif "giảm mạnh" in verb:
            status_icon = "🔴 "
        return f"{trend_emoji}{status_icon}"

    tang   = [(k, b, v, e) for k, b, v, e in priority_order if _classify(v) == "tang"]
    giu    = [(k, b, v, e) for k, b, v, e in priority_order if _classify(v) == "giu"]
    giam   = [(k, b, v, e) for k, b, v, e in priority_order if _classify(v) == "giam"]
    sorted_blocks = tang + giu + giam

    parts = []
    for n, (k, block_text, v, e) in enumerate(sorted_blocks, 1):
        prefix = _get_final_prefix(e, v)
        # block_text already contains the {emoji} placeholder from block_* calls
        # but we need to replace it correctly. Actually block_* prepends the emoji.
        # Let's fix block_* to NOT prepend emoji, or just strip it here.
        clean_block = re.sub(r"^[⚠️📈🔴 ]*", "", block_text)
        parts.append(f"{prefix}{clean_block.replace('{n}', str(n))}")

    legend = [
        "",
        "---",
        "**Chú thích biểu tượng:**",
        "| Icon | Ý nghĩa |",
        "| :--- | :--- |",
        "| 🟢 | Tăng mạnh (vượt ngưỡng kỹ thuật) |",
        "| 🔴 | Giảm mạnh (vượt ngưỡng kỹ thuật) |",
        "| ⚠️ | Cảnh báo sụt giảm đột biến (>15%) |",
    ]

    all_lines = [header, ""] + parts + ["", footer] + legend

    return "\n".join(_fix_line(l) for l in "\n".join(all_lines).split("\n"))


# ══════════════════════════════════════════════════════════════════════════════
# HTML INFOGRAPHIC MODE — Mintlify design system
# All functions below are NEW and additive; nothing above is changed.
# ══════════════════════════════════════════════════════════════════════════════

_MINTLIFY_CSS = """
:root {
  --bg-app: #f7f7f8;
  --bg-surface: #ffffff;
  --text-primary: #111113;
  --text-secondary: #3a3a3f;
  --text-tertiary: #6a6b6c;
  --text-muted: #8b8b8f;
  --border-subtle: rgba(17, 17, 19, 0.08);
  --border-medium: rgba(17, 17, 19, 0.14);

  --accent-red: #ff6363;
  --accent-blue: #55b3ff;
  --accent-green: #5fc992;
  --accent-yellow: #ffbc33;

  --status-up: var(--accent-green);
  --status-down: var(--accent-red);
  --status-flat: #6a6b6c;

  --shadow-card: rgba(0, 0, 0, 0.06) 0px 10px 30px, rgba(0, 0, 0, 0.04) 0px 2px 10px;
  --shadow-inset: rgba(255, 255, 255, 0.35) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.08) 0px -1px 0px 0px inset;
  --ring: rgba(0, 0, 0, 0.06) 0px 0px 0px 1px, rgba(255, 255, 255, 0.65) 0px 1px 0px 0px inset;
}

[data-theme="dark"] {
  --bg-app: #07080a;
  --bg-surface: #101111;
  --text-primary: #f9f9f9;
  --text-secondary: #cdcdce;
  --text-tertiary: #9c9c9d;
  --text-muted: #6a6b6c;
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-medium: rgba(255, 255, 255, 0.10);

  --accent-red: #ff6363;
  --accent-blue: #55b3ff;
  --accent-green: #5fc992;
  --accent-yellow: #ffbc33;

  --status-up: var(--accent-green);
  --status-down: var(--accent-red);
  --status-flat: #9c9c9d;

  --shadow-card: rgba(0, 0, 0, 0.55) 0px 18px 60px, rgba(0, 0, 0, 0.35) 0px 2px 12px;
  --shadow-inset: rgba(255, 255, 255, 0.08) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.22) 0px -1px 0px 0px inset;
  --ring: rgb(27, 28, 30) 0px 0px 0px 1px, rgb(7, 8, 10) 0px 0px 0px 1px inset;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif;
  background-color: var(--bg-app);
  color: var(--text-primary);
  line-height: 1.5;
  transition: background-color 0.25s ease, color 0.25s ease;
  overflow-x: hidden;
  min-height: 100vh;
  letter-spacing: 0.2px;
}

#bg-canvas {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: -1;
  opacity: 0.55;
}

.page-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 80px;
  position: relative;
}

/* ── TOOLBAR ─────────────────────────────────────────────────────────────────── */
.report-toolbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 0;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.btn-icon {
  width: 40px; height: 40px;
  border-radius: 10px;
  border: 1px solid var(--border-medium);
  background: var(--bg-surface);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--ring), var(--shadow-inset);
}

.btn-icon:hover {
  transform: translateY(-2px);
  border-color: rgba(255,255,255,0.18);
}

/* ── HERO ────────────────────────────────────────────────────────────────────── */
.report-hero {
  padding: 64px 0 48px;
  text-align: center;
}

.report-title {
  font-size: 48px;
  font-weight: 700;
  letter-spacing: -0.8px;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.report-subtitle {
  font-size: 18px;
  color: var(--text-tertiary);
}

.status-bar {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
  flex-wrap: wrap;
}

.status-pill {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.04);
}

.status-pill.up { color: var(--status-up); }
.status-pill.flat { color: var(--status-flat); }
.status-pill.down { color: var(--status-down); }

/* ── GRID ────────────────────────────────────────────────────────────────────── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

@media (max-width: 1024px) { .card-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .card-grid { grid-template-columns: 1fr; } }

/* ── CARD ────────────────────────────────────────────────────────────────────── */
.product-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--ring), var(--shadow-card);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.product-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; width: 4px; height: 100%;
  border-radius: 16px 0 0 16px;
}

.product-card.up::before { background: var(--status-up); }
.product-card.flat::before { background: var(--status-flat); }
.product-card.down::before { background: var(--status-down); }

.card-ghost { opacity: 0.4; transform: scale(0.98); }

.drag-handle {
  position: absolute;
  top: 14px; right: 14px;
  color: var(--text-muted);
  opacity: 0;
  transition: opacity 0.2s;
  cursor: grab;
}
.product-card:hover .drag-handle { opacity: 1; }

.product-card:hover {
  transform: translateY(-2px);
  border-color: rgba(85, 179, 255, 0.22);
  box-shadow: var(--ring), var(--shadow-card), 0 0 0 1px rgba(85, 179, 255, 0.10), 0 0 32px rgba(85, 179, 255, 0.10);
}
.product-card.up:hover { box-shadow: var(--ring), var(--shadow-card), 0 0 36px rgba(95, 201, 146, 0.12); }
.product-card.down:hover { box-shadow: var(--ring), var(--shadow-card), 0 0 36px rgba(255, 99, 99, 0.12); }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.card-name {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0px;
  color: var(--text-primary);
  line-height: 1.30;
}

.verb-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2px;
  white-space: nowrap;
  flex-shrink: 0;
  border: 1px solid var(--border-subtle);
}

.verb-badge.up   { background: rgba(95, 201, 146, 0.12); color: var(--status-up); }
.verb-badge.flat { background: rgba(156, 156, 157, 0.10); color: var(--status-flat); }
.verb-badge.down { background: rgba(255, 99, 99, 0.12); color: var(--status-down); }

.card-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-mini {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease, border-color 0.15s ease;
  box-shadow: var(--shadow-inset);
}
.btn-mini:hover { transform: translateY(-1px); opacity: 0.9; border-color: var(--border-medium); }

/* ── HERO METRIC ─────────────────────────────────────────────────────────────── */
.hero-metric { margin-bottom: 16px; }

.hero-label {
  font-size: 13px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.65px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.hero-value {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.64px;
  line-height: 1.15;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.hero-delta {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 9999px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  border: 1px solid var(--border-subtle);
}

.hero-delta.up   { background: rgba(95, 201, 146, 0.12); color: var(--status-up); }
.hero-delta.flat { background: rgba(156, 156, 157, 0.10); color: var(--status-flat); }
.hero-delta.down { background: rgba(255, 99, 99, 0.12); color: var(--status-down); }

/* ── METRICS ────────────────────────────────────────────────────────────────── */
.metric-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-subtle);
}
.metric-row:last-child { border-bottom: none; }
.metric-label { font-size: 13px; color: var(--text-tertiary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.metric-value { font-size: 13px; color: var(--text-primary); font-weight: 600; text-align: right; }
.metric-delta { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 11px; color: var(--text-muted); text-align: right; }
.metric-delta.up { color: var(--status-up); }
.metric-delta.down { color: var(--status-down); }
.metric-delta.flat { color: var(--status-flat); }

.details {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
}
.details.expanded { opacity: 1; max-height: 600px; }

.card-footer {
  margin-top: 12px;
  border-top: 1px solid var(--border-subtle);
  padding-top: 12px;
}
.btn-footer {
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  padding: 10px 12px;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease, border-color 0.15s ease;
  box-shadow: var(--shadow-inset);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.btn-footer:hover { transform: translateY(-1px); opacity: 0.95; border-color: var(--border-medium); }
.btn-footer .chev { transition: transform 0.2s ease; }
.btn-footer.expanded .chev { transform: rotate(180deg); }

/* ── MODAL ───────────────────────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 2000;
}
.modal-backdrop.open { opacity: 1; pointer-events: auto; }
.modal {
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -48%) scale(0.98);
  width: min(920px, calc(100vw - 40px));
  max-height: min(640px, calc(100vh - 40px));
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  box-shadow: var(--ring), var(--shadow-card);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 2100;
  overflow: hidden;
}
.modal.open { opacity: 1; pointer-events: auto; transform: translate(-50%, -50%) scale(1); }
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle);
}
.modal-title { font-size: 14px; font-weight: 650; color: var(--text-primary); }
.modal-body { padding: 14px 16px 16px; }
.modal-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
  margin-bottom: 10px;
  color: var(--text-tertiary);
  font-size: 12px;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(255,255,255,0.04);
}
.pill input { accent-color: var(--accent-blue); }
.chart-box {
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 10px 10px 0;
  background: rgba(255,255,255,0.02);
}

/* ── FOOTER ──────────────────────────────────────────────────────────────────── */
.report-footer {
  text-align: center;
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--border-subtle);
  font-size: 13px;
  color: var(--text-muted);
}
"""


def _html_shell(body_html: str, title: str, chart_json: str = "{}") -> str:
    """Return a complete self-contained HTML page with premium interactivity."""
    sortable_js = _read_asset_text(os.path.join("assets", "sortable.min.js"))
    apex_js = _read_asset_text(os.path.join("assets", "apexcharts.min.js"))
    return f"""<!DOCTYPE html>
<html lang="vi" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>{_MINTLIFY_CSS}</style>
  <script>{sortable_js}</script>
  <script>{apex_js}</script>
</head>
<body>
  <canvas id="bg-canvas"></canvas>

  <div id="js-warning" style="max-width: 980px; margin: 16px auto 0; padding: 0 24px;">
    <div style="border: 1px solid rgba(255, 99, 99, 0.35); background: rgba(255, 99, 99, 0.08); border-radius: 14px; padding: 12px 14px; color: inherit;">
      <div style="font-weight: 700; margin-bottom: 6px;">Tương tác bị tắt (JavaScript không chạy)</div>
      <div style="color: rgba(156,156,157,1); font-size: 13px; line-height: 1.5;">
        Nếu bạn đang xem file trong Teams/Outlook Preview, vui lòng <b>Download</b> file và mở bằng <b>Chrome/Edge</b>.
        Nếu Windows chặn file: Right click → <b>Properties</b> → tick <b>Unblock</b> → OK → mở lại.
      </div>
    </div>
  </div>
  <noscript>
    <style>#js-warning{{display:block}}</style>
  </noscript>
  
  <div class="page-wrapper">
    <div class="report-toolbar">
      <button class="btn-icon" onclick="toggleTheme()" title="Đổi giao diện">
        <svg id="theme-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </button>
      <button class="btn-icon" onclick="resetSort()" title="Đặt lại thứ tự">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12h18M3 6h18M3 18h18"></path>
        </svg>
      </button>
    </div>

    {body_html}
    
    <div class="report-footer">
        &copy; 2024 SSI Securities Corporation · Hệ thống báo cáo tự động
    </div>
  </div>

  <div class="modal-backdrop" id="modal-backdrop" onclick="closeChartModal()"></div>
  <div class="modal" id="chart-modal" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="modal-header">
      <div class="modal-title" id="modal-title">Biểu đồ</div>
      <button class="btn-mini" onclick="closeChartModal()" title="Đóng">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="M6 6l12 12"></path></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="modal-tools" id="modal-tools"></div>
      <div class="chart-box"><div id="chart-modal-host"></div></div>
    </div>
  </div>

  <script>
    const chartData = {chart_json};
    let modalChart = null;
    
    function applyTheme(theme) {{
      document.documentElement.setAttribute('data-theme', theme);
      const icon = document.getElementById('theme-icon');
      if (theme === 'dark') {{
        icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line>';
      }} else {{
        icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
      }}
    }}

    function toggleTheme() {{
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      localStorage.setItem('ssi-report-theme', next);
      applyTheme(next);
    }}

    function toggleMetrics(key) {{
      const content = document.getElementById('details-' + key);
      const btn = document.getElementById('btn-details-' + key);
      const expanded = content.classList.toggle('expanded');
      btn.classList.toggle('expanded', expanded);
      const txt = btn.querySelector('[data-role="label"]');
      if (txt) txt.textContent = expanded ? 'Ẩn chi tiết' : 'Xem chi tiết';
    }}

    function initSortable() {{
        const grid = document.querySelector('.card-grid');
        new Sortable(grid, {{
            animation: 150,
            ghostClass: 'card-ghost',
            handle: '.drag-handle',
            forceFallback: true,
            onEnd: function() {{
                const order = Array.from(grid.children).map(c => c.getAttribute('data-id'));
                localStorage.setItem('ssi-report-order', JSON.stringify(order));
            }}
        }});
    }}

    function resetSort() {{
        localStorage.removeItem('ssi-report-order');
        location.reload();
    }}

    function openChartModal(productKey) {{
      const modal = document.getElementById('chart-modal');
      const backdrop = document.getElementById('modal-backdrop');
      const title = document.getElementById('modal-title');
      const tools = document.getElementById('modal-tools');
      const host = document.getElementById('chart-modal-host');

      const card = document.getElementById('card-' + productKey);
      const cardName = card ? (card.getAttribute('data-name') || productKey) : productKey;
      title.textContent = 'Biểu đồ · ' + cardName;

      const keysCsv = card ? (card.getAttribute('data-chart-keys') || '') : '';
      const defaultKeys = keysCsv.split(',').map(s => s.trim()).filter(Boolean);
      const selected = new Set(defaultKeys.length ? defaultKeys : []);

      const meta = chartData.meta || {{}};
      const series = chartData.series || {{}};
      const cats = chartData.categories || [];

      function renderTools() {{
        tools.innerHTML = '';
        defaultKeys.forEach(k => {{
          const m = meta[k] || {{ label: k }};
          const pill = document.createElement('label');
          pill.className = 'pill';
          pill.innerHTML = `<input type="checkbox" ${'{'}selected.has(k) ? 'checked' : ''{'}'} data-key="${'{'}k{'}'}" /> <span>${'{'}m.label{'}'}</span>`;
          tools.appendChild(pill);
        }});
        tools.querySelectorAll('input[type="checkbox"]').forEach(inp => {{
          inp.addEventListener('change', () => {{
            const k = inp.getAttribute('data-key');
            if (!k) return;
            if (inp.checked) selected.add(k); else selected.delete(k);
            renderChart();
          }});
        }});
      }}

      function renderChart() {{
        const s = Array.from(selected).map(k => {{
          const m = meta[k] || {{ label: k }};
          return {{
            name: m.label,
            data: (series[k] || []).map(v => (typeof v === 'number' ? v : 0)),
          }};
        }});

        if (modalChart) {{
          modalChart.destroy();
          modalChart = null;
        }}
        host.innerHTML = '';

        const isDark = (document.documentElement.getAttribute('data-theme') === 'dark');
        const options = {{
          chart: {{
            type: 'line',
            height: 420,
            toolbar: {{ show: false }},
            animations: {{ enabled: true, easing: 'easeinout', speed: 450 }},
            background: 'transparent',
          }},
          theme: {{ mode: isDark ? 'dark' : 'light' }},
          stroke: {{ curve: 'smooth', width: 2 }},
          grid: {{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }},
          dataLabels: {{ enabled: false }},
          markers: {{ size: 0 }},
          xaxis: {{
            categories: cats,
            labels: {{ style: {{ colors: isDark ? '#9c9c9d' : '#6a6b6c' }} }},
          }},
          yaxis: {{
            labels: {{ style: {{ colors: isDark ? '#9c9c9d' : '#6a6b6c' }} }},
          }},
          legend: {{ show: false }},
          tooltip: {{ theme: isDark ? 'dark' : 'light' }},
          series: s,
        }};

        modalChart = new ApexCharts(host, options);
        modalChart.render();
      }}

      renderTools();
      renderChart();

      backdrop.classList.add('open');
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.addEventListener('keydown', escCloseOnce);
    }}

    function closeChartModal() {{
      const modal = document.getElementById('chart-modal');
      const backdrop = document.getElementById('modal-backdrop');
      backdrop.classList.remove('open');
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      if (modalChart) {{
        modalChart.destroy();
        modalChart = null;
      }}
    }}

    function escCloseOnce(e) {{
      if (e.key === 'Escape') {{
        closeChartModal();
        document.removeEventListener('keydown', escCloseOnce);
      }}
    }}

    function initBackground() {{
      const canvas = document.getElementById('bg-canvas');
      const ctx = canvas.getContext('2d');
      let w = 0, h = 0;
      let raf = null;
      const pts = [];
      const maxPts = 64;

      function resize() {{
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
      }}
      window.addEventListener('resize', resize);
      resize();

      function seed() {{
        pts.length = 0;
        for (let i = 0; i < maxPts; i++) {{
          pts.push({{
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
          }});
        }}
      }}
      seed();

      function draw() {{
        const isDark = (document.documentElement.getAttribute('data-theme') === 'dark');
        ctx.clearRect(0, 0, w, h);

        const bg = isDark ? [7, 8, 10] : [247, 247, 248];
        ctx.fillStyle = 'rgba(' + bg[0] + ',' + bg[1] + ',' + bg[2] + ',1)';
        ctx.fillRect(0, 0, w, h);

        const dot = isDark ? 'rgba(85,179,255,0.85)' : 'rgba(0, 120, 255, 0.38)';
        const line = isDark ? 'rgba(85,179,255,0.18)' : 'rgba(0, 120, 255, 0.12)';

        for (const p of pts) {{
          p.x += p.vx; p.y += p.vy;
          if (p.x < -20) p.x = w + 20;
          if (p.x > w + 20) p.x = -20;
          if (p.y < -20) p.y = h + 20;
          if (p.y > h + 20) p.y = -20;
        }}

        for (let i = 0; i < pts.length; i++) {{
          for (let j = i + 1; j < pts.length; j++) {{
            const pa = pts[i], pb = pts[j];
            const dx = pa.x - pb.x, dy = pa.y - pb.y;
            const d2 = dx*dx + dy*dy;
            if (d2 < 180*180) {{
              const alpha = 1 - (Math.sqrt(d2) / 180);
              const opacity = alpha * 0.9;
              ctx.strokeStyle = line.replace(')', ',' + opacity + ')');
              ctx.beginPath();
              ctx.moveTo(pa.x, pa.y);
              ctx.lineTo(pb.x, pb.y);
              ctx.stroke();
            }}
          }}
        }}

        ctx.fillStyle = dot;
        for (const p of pts) {{
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }}

        raf = requestAnimationFrame(draw);
      }}

      function onVis() {{
        if (document.hidden) {{
          if (raf) cancelAnimationFrame(raf);
          raf = null;
        }} else {{
          if (!raf) draw();
        }}
      }}
      document.addEventListener('visibilitychange', onVis);
      draw();
    }}

    function applyExpandMode() {{
      const params = new URLSearchParams(location.search);
      const mode = params.get('expand') || 'none';
      if (mode === 'all') {{
        document.querySelectorAll('.details').forEach(d => d.classList.add('expanded'));
        document.querySelectorAll('.btn-footer').forEach(b => {{
          b.classList.add('expanded');
          const txt = b.querySelector('[data-role="label"]');
          if (txt) txt.textContent = 'Ẩn chi tiết';
        }});
      }}
    }}

    // Initial load logic
    document.addEventListener('DOMContentLoaded', () => {{
        const warn = document.getElementById('js-warning');
        if (warn) warn.style.display = 'none';
        const savedTheme = localStorage.getItem('ssi-report-theme') || 'dark';
        applyTheme(savedTheme);
        initBackground();
        initSortable();
        applyExpandMode();

        // Apply saved order if exists
        const savedOrder = localStorage.getItem('ssi-report-order');
        if (savedOrder) {{
            const order = JSON.parse(savedOrder);
            const grid = document.querySelector('.card-grid');
            const cards = Array.from(grid.children);
            order.forEach(id => {{
                const card = cards.find(c => c.getAttribute('data-id') === id);
                if (card) grid.appendChild(card);
            }});
        }}
    }});
  </script>
</body>
</html>"""


def _delta_class(verb: str) -> str:
    """Map a verb string to CSS class for color-coding."""
    if verb in _TANG_VERBS:
        return "up"
    if verb in _GIAM_VERBS:
        return "down"
    return "flat"


def _sub_delta_class(delta_str: str) -> str:
    """Infer CSS class from the leading sign in delta string."""
    stripped = delta_str.strip().lstrip("(")
    if stripped.startswith("+"):
        return "up"
    if stripped.startswith("-"):
        return "down"
    return "flat"


# ── STRUCTURED PRODUCT DATA EXTRACTORS ────────────────────────────────────────

def product_data_hose(today, prev, rows) -> dict:
    c = lambda idx: clean(today[idx])
    p = lambda idx: clean(prev[idx])

    v2, pr2, vs2, d2, pd2 = diff(c(1), p(1), "%")
    v6, pr6, vs6, d6, pd6 = diff(c(5), p(5), "tỷ")
    v5, pr5, vs5, d5, pd5 = diff(c(4), p(4), "tỷ")
    v3, pr3, vs3, d3, pd3 = diff(c(2), p(2), "%")
    v4, pr4, vs4, d4, pd4 = diff(c(3), p(3), "%")

    return {
        "key": "hose",
        "name": "HOSE",
        "trend_emoji": detect_trend(1, rows),
        "headline_label": "Thị phần HOSE",
        "headline_value": vs2,
        "headline_delta": d2,
        "verb": v2,
        "chart_keys_default": ["hose_share", "hose_liq_mkt", "hose_gtgd_ssi", "hose_cn"],
        "sub_metrics": [
            {
                "label": "Thanh khoản thị trường",
                "value": vs6,
                "delta": d6,
                "important": is_manh_delta(c(5), p(5), _metric_history(5, rows, c(5)), MANH_CFG["hose_liq_mkt"]),
            },
            {"label": "GTGD SSI",                "value": vs5, "delta": d5, "important": abs(pd5) > 5},
            {"label": "Thị phần CN",              "value": vs3, "delta": d3, "important": abs(pd3) > 5},
            {"label": "Thị phần DS",              "value": vs4, "delta": d4, "important": abs(pd4) > 5},
        ],
    }


def product_data_margin(today, prev, rows) -> dict:
    c = lambda idx: clean(today[idx])
    p = lambda idx: clean(prev[idx])

    v7,  pr7,  vs7,  d7,  pd7  = diff(c(6),  p(6),  "tỷ")
    v8,  pr8,  vs8,  d8,  pd8  = diff(c(7),  p(7),  "KH")
    v9,  pr9,  vs9,  d9,  pd9  = diff(c(8),  p(8),  "tỷ")
    v10, pr10, vs10, d10, pd10 = diff(c(9),  p(9),  "KH")
    v11, pr11, vs11, d11, pd11 = diff(c(10), p(10), "tỷ")
    v12, pr12, vs12, d12, pd12 = diff(c(11), p(11), "KH")
    v13, pr13, vs13, d13, pd13 = diff(c(12), p(12), "KH")
    v14, pr14, vs14, d14, pd14 = diff(c(13), p(13), "KH")
    v15, pr15, vs15, d15, pd15 = diff(c(14), p(14), "tỷ")
    v16, pr16, vs16, d16, pd16 = diff(c(15), p(15), "KH")
    v17, pr17, vs17, d17, pd17 = diff(c(16), p(16), "tỷ")
    v18, pr18, vs18, d18, pd18 = diff(c(17), p(17), "KH")
    v19, pr19, vs19, d19, pd19 = diff(c(18), p(18), "tỷ")
    v20, pr20, vs20, d20, pd20 = diff(c(19), p(19), "tỷ")

    return {
        "key": "margin",
        "name": "Margin",
        "trend_emoji": detect_trend(6, rows),
        "headline_label": "Tổng dư nợ Margin TK6+7",
        "headline_value": vs7,
        "headline_delta": d7,
        "verb": v7,
        "chart_keys_default": ["margin_total", "margin_kh", "margin_t7", "margin_tp", "margin_mplus"],
        "sub_metrics": [
            {"label": "SLKH Margin",       "value": vs8,  "delta": d8,  "important": abs(pd8)  > 5},
            {"label": "Dư nợ T+7",         "value": vs9,  "delta": d9,  "important": abs(pd9)  > 5},
            {"label": "SLKH T+7",          "value": vs10, "delta": d10, "important": abs(pd10) > 5},
            {"label": "Dư nợ Trading Plus","value": vs11, "delta": d11, "important": abs(pd11) > 5},
            {"label": "SLKH Trading Plus", "value": vs12, "delta": d12, "important": abs(pd12) > 5},
            {"label": "SLKH register M+",  "value": vs13, "delta": d13, "important": abs(pd13) > 5},
            {"label": "SLKH active M+",    "value": vs14, "delta": d14, "important": abs(pd14) > 5},
            {"label": "Dư nợ M+",         "value": vs15, "delta": d15, "important": abs(pd15) > 5},
            {"label": "SLKH có dư nợ M+", "value": vs16, "delta": d16, "important": abs(pd16) > 5},
            {"label": "Giải ngân M+",      "value": vs17, "delta": d17, "important": abs(pd17) > 5},
            {"label": "SLKH giải ngân M+", "value": vs18, "delta": d18, "important": abs(pd18) > 5},
            {"label": "Dư nợ SSI",         "value": vs19, "delta": d19, "important": abs(pd19) > 5},
            {"label": "Dư nợ SPV",         "value": vs20, "delta": d20, "important": abs(pd20) > 5},
        ],
    }


def product_data_phaisinh(today, prev, rows) -> dict:
    c = lambda idx: clean(today[idx])
    p = lambda idx: clean(prev[idx])

    v22, pr22, vs22, d22, pd22 = diff(c(21), p(21), "%")
    v23, pr23, vs23, d23, pd23 = diff(c(22), p(22), "HĐ")
    v25, pr25, vs25, d25, pd25 = diff(c(24), p(24), "KH")
    v28, pr28, vs28, d28, pd28 = diff(c(27), p(27), "KH")
    v29, pr29, vs29, d29, pd29 = diff(c(28), p(28), "%")
    v35, pr35, vs35, d35, pd35 = diff(c(34), p(34), "tỷ")
    v36, pr36, vs36, d36, pd36 = diff(c(35), p(35), "tỷ")
    v33, pr33, vs33, d33, pd33 = diff(c(32), p(32), "KH")
    v31, pr31, vs31, d31, pd31 = diff(c(30), p(30), "KH")
    v30, pr30, vs30, d30, pd30 = diff(c(29), p(29), "KH")

    return {
        "key": "ps",
        "name": "Phái sinh",
        "trend_emoji": detect_trend(21, rows),
        "headline_label": "Thị phần Phái sinh",
        "headline_value": vs22,
        "headline_delta": d22,
        "verb": v22,
        "chart_keys_default": ["ps_share", "ps_liq", "ps_kh", "ps_dplus_kh", "ps_dplus_ratio"],
        "sub_metrics": [
            {
                "label": "Thanh khoản TTPS",
                "value": vs23,
                "delta": d23,
                "important": is_manh_delta(c(22), p(22), _metric_history(22, rows, c(22)), MANH_CFG["ps_liq"]),
            },

            {"label": "SLKH PS",             "value": vs25, "delta": d25, "important": abs(pd25) > 5},
            {"label": "SLKH D+",             "value": vs28, "delta": d28, "important": abs(pd28) > 5},
            {
                "label": "Tỉ lệ KH dùng D+",
                "value": vs29,
                "delta": d29,
                "important": is_manh_delta(
                    (c(28) * 100.0) if c(28) is not None else None,
                    (p(28) * 100.0) if p(28) is not None else None,
                    [(v * 100.0) for v in _metric_history(28, rows, c(28))],
                    MANH_CFG["ps_dplus_ratio"],
                ),
            },
            {"label": "Giải ngân D+",        "value": vs35, "delta": d35, "important": abs(pd35) > 5},
            {"label": "Dư nợ D+ cuối ngày", "value": vs36, "delta": d36, "important": abs(pd36) > 5},
            {"label": "KH đang dùng D+",     "value": vs33, "delta": d33, "important": abs(pd33) > 5},
            {"label": "KH đăng ký mới D+",  "value": vs31, "delta": d31, "important": abs(pd31) > 5},
            {"label": "KH hủy D+",          "value": vs30, "delta": d30, "important": abs(pd30) > 5},
        ],
    }


def product_data_scash(today, prev, rows) -> dict:
    c = lambda idx: clean(today[idx])
    p = lambda idx: clean(prev[idx])

    v37, pr37, vs37, d37, pd37 = diff(c(36), p(36), "tỷ")
    v40, pr40, vs40, d40, pd40 = diff(c(39), p(39), "KH")
    v38, pr38, vs38, d38, pd38 = diff(c(37), p(37), "tỷ")
    v39, pr39, vs39, d39, pd39 = diff(c(38), p(38), "%")

    return {
        "key": "scash",
        "name": "S-Cash",
        "trend_emoji": detect_trend(36, rows),
        "headline_label": "Số dư S-Cash",
        "headline_value": vs37,
        "headline_delta": d37,
        "verb": v37,
        "chart_keys_default": ["scash_bal", "scash_kh", "scash_total", "scash_ratio"],
        "sub_metrics": [
            {"label": "SLKH S-Cash",         "value": vs40, "delta": d40, "important": abs(pd40) > 5},
            {"label": "Tổng dư SCASH+CASA",  "value": vs38, "delta": d38, "important": abs(pd38) > 5},
            {"label": "Tỉ lệ S-Cash/CASA",  "value": vs39, "delta": d39, "important": abs(pd39) > 5},
        ],
    }


def product_data_sfund(today, prev, rows) -> dict:
    c = lambda idx: clean(today[idx])
    p = lambda idx: clean(prev[idx])

    v41, pr41, vs41, d41, pd41 = diff(c(40), p(40), "tỷ")
    v42, pr42, vs42, d42, pd42 = diff(c(41), p(41), "KH")

    return {
        "key": "sfund",
        "name": "S-Fund",
        "trend_emoji": detect_trend(40, rows),
        "headline_label": "Số dư S-Fund",
        "headline_value": vs41,
        "headline_delta": d41,
        "verb": v41,
        "chart_keys_default": ["sfund_bal", "sfund_kh"],
        "sub_metrics": [
            {"label": "SLKH S-Fund", "value": vs42, "delta": d42, "important": abs(pd42) > 5},
        ],
    }


def product_data_moimoi(today, prev, rows) -> dict:
    c = lambda idx: clean(today[idx])
    p = lambda idx: clean(prev[idx])

    v43, pr43, vs43, d43, pd43 = diff(c(42), p(42), "tài khoản")

    return {
        "key": "moimoi",
        "name": "Mở mới",
        "trend_emoji": detect_trend(42, rows),
        "headline_label": "KH mở tài khoản mới",
        "headline_value": vs43,
        "headline_delta": d43,
        "verb": v43,
        "chart_keys_default": ["moimoi_kh"],
        "sub_metrics": [],
    }


# ── CARD RENDERER ──────────────────────────────────────────────────────────────

def render_card(product: dict, rank: int) -> str:
    """Render one product card with smart-collapsed metrics and interactables."""
    v_class = _delta_class(product["verb"])
    v_label = product["verb"] if product["verb"] != "N/A" else "—"
    trend = product["trend_emoji"].strip()
    
    # Filter out N/A metrics
    all_metrics = [m for m in product["sub_metrics"] if m.get("value") != "N/A"]
    important_metrics = [m for m in all_metrics if m.get("important")]
    other_metrics = [m for m in all_metrics if not m.get("important")]


    def _row(m):
        dc = _sub_delta_class(m["delta"])
        return f'''
        <div class="metric-row">
            <span class="metric-label">{m['label']}</span>
            <div style="display: flex; flex-direction: column; align-items: flex-end;">
                <span class="metric-value">{m['value']}</span>
                <span class="metric-delta {dc}">{m['delta']}</span>
            </div>
        </div>'''

    pinned_html = "".join(_row(m) for m in important_metrics)
    detail_html = "".join(_row(m) for m in other_metrics)
    
    toggle_html = ""
    if detail_html:
        toggle_html = f'''
        <div class="details" id="details-{product['key']}">
            {detail_html}
        </div>
        <div class="card-footer">
          <button class="btn-footer" onclick="toggleMetrics('{product['key']}')" id="btn-details-{product['key']}">
            <span data-role="label">Xem chi tiết</span>
            <svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>'''

    return f"""
  <div class="product-card {v_class}" data-id="{product['key']}" data-name="{product['name']}" data-chart-keys="{",".join(product.get("chart_keys_default", []))}" id="card-{product['key']}">
    <div class="drag-handle">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
    </div>
    
    <div class="card-header">
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div class="card-name">{trend} {product['name']}</div>
        <div class="verb-badge {v_class}">{v_label}</div>
      </div>
      <div class="card-actions">
        <button class="btn-mini" onclick="openChartModal('{product['key']}')" title="Xem biểu đồ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10M12 20V4M6 20v-4"/></svg>
        </button>
      </div>
    </div>
    
    <div class="hero-metric">
      <div class="hero-label">{product['headline_label']}</div>
      <div class="hero-value">{product['headline_value']}</div>
      <div class="hero-delta {v_class}">{product['headline_delta']}</div>
    </div>
    
    <div class="metrics-section">
      {pinned_html}
      {toggle_html}
    </div>
  </div>"""



def generate_json_payload(rows) -> str:
    """Extract historical data for the chart."""
    plot_rows = rows[-22:] if len(rows) > 22 else rows
    dates = [serial_to_date(r[0]).strftime('%d/%m') for r in plot_rows]
    
    def _safe(v):
        v = clean(v)
        return float(v) if v is not None else 0.0

    meta = {}
    series = {}

    def add(key: str, label: str, unit: str, values):
        meta[key] = {"label": label, "unit": unit}
        series[key] = values

    # HOSE
    add("hose_share", "Thị phần HOSE (%)", "%", [round(_safe(r[1]) * 100, 2) for r in plot_rows])
    add("hose_liq_mkt", "Thanh khoản thị trường (tỷ)", "tỷ", [round(_safe(r[5]), 0) for r in plot_rows])
    add("hose_gtgd_ssi", "GTGD SSI (tỷ)", "tỷ", [round(_safe(r[4]), 0) for r in plot_rows])
    add("hose_cn", "Thị phần CN (%)", "%", [round(_safe(r[2]) * 100, 2) for r in plot_rows])
    add("hose_ds", "Thị phần DS (%)", "%", [round(_safe(r[3]) * 100, 2) for r in plot_rows])

    # Margin
    add("margin_total", "Tổng dư nợ Margin (tỷ)", "tỷ", [round(_safe(r[6]), 0) for r in plot_rows])
    add("margin_kh", "SLKH Margin (KH)", "KH", [round(_safe(r[7]), 0) for r in plot_rows])
    add("margin_t7", "Dư nợ T+7 (tỷ)", "tỷ", [round(_safe(r[8]), 0) for r in plot_rows])
    add("margin_tp", "Dư nợ Trading Plus (tỷ)", "tỷ", [round(_safe(r[10]), 0) for r in plot_rows])
    add("margin_mplus", "Dư nợ M+ (tỷ)", "tỷ", [round(_safe(r[14]), 0) for r in plot_rows])

    # Phái sinh
    add("ps_share", "Thị phần Phái sinh (%)", "%", [round(_safe(r[21]) * 100, 2) for r in plot_rows])
    add("ps_liq", "Thanh khoản TTPS (HĐ)", "HĐ", [round(_safe(r[22]), 0) for r in plot_rows])
    add("ps_kh", "SLKH PS (KH)", "KH", [round(_safe(r[24]), 0) for r in plot_rows])
    add("ps_dplus_kh", "SLKH D+ (KH)", "KH", [round(_safe(r[27]), 0) for r in plot_rows])
    add("ps_dplus_ratio", "Tỉ lệ KH dùng D+ (%)", "%", [round(_safe(r[28]) * 100, 2) for r in plot_rows])

    # SCASH
    add("scash_bal", "Số dư S-Cash (tỷ)", "tỷ", [round(_safe(r[36]), 0) for r in plot_rows])
    add("scash_kh", "SLKH S-Cash (KH)", "KH", [round(_safe(r[39]), 0) for r in plot_rows])
    add("scash_total", "Tổng dư SCASH+CASA (tỷ)", "tỷ", [round(_safe(r[37]), 0) for r in plot_rows])
    add("scash_ratio", "Tỉ lệ S-Cash/CASA (%)", "%", [round(_safe(r[38]) * 100, 2) for r in plot_rows])

    # SFUND
    add("sfund_bal", "Số dư S-Fund (tỷ)", "tỷ", [round(_safe(r[40]), 0) for r in plot_rows])
    add("sfund_kh", "SLKH S-Fund (KH)", "KH", [round(_safe(r[41]), 0) for r in plot_rows])

    # Mở mới
    add("moimoi_kh", "KH mở mới (tài khoản)", "tài khoản", [round(_safe(r[42]), 0) for r in plot_rows])

    data = {"categories": dates, "meta": meta, "series": series}
    return json.dumps(data, ensure_ascii=False)

# ── HTML REPORT GENERATOR ──────────────────────────────────────────────────────


def generate_html_report(rows, weekly=False, monthly=False) -> str:
    """Generate a self-contained HTML infographic report."""
    today_row = rows[-1]
    prev_row  = rows[-2]

    # ── Dates / title strings ──────────────────────────────────────────────────
    if monthly:
        today_label = str(today_row[0]) if today_row[0] is not None else "N/A"
        prev_label  = str(prev_row[0])  if prev_row[0]  is not None else "N/A"
        page_title  = f"Báo cáo Tháng {today_label}"
        hero_title  = f"Báo cáo Tháng {today_label}"
        subtitle    = f"Dữ liệu tháng {today_label} · So sánh với tháng {prev_label}"
    elif weekly:
        today_label = str(today_row[0]) if today_row[0] is not None else "N/A"
        prev_label  = str(prev_row[0])  if prev_row[0]  is not None else "N/A"
        page_title  = f"Báo cáo Tuần {today_label}"
        hero_title  = f"Báo cáo Tuần {today_label}"
        subtitle    = f"Dữ liệu tuần {today_label} · So sánh với tuần {prev_label}"
    else:
        today_date = serial_to_date(today_row[0])
        prev_date  = serial_to_date(prev_row[0])
        wday       = weekday_vn(today_date)
        page_title = f"Báo cáo phiên {wday} - {today_date.strftime('%d/%m')}"
        hero_title = f"Báo cáo phiên {wday} · {today_date.strftime('%d/%m/%Y')}"
        subtitle   = f"Dữ liệu ngày {today_date.strftime('%d/%m/%Y')} · So sánh với {prev_date.strftime('%d/%m/%Y')}"

    # ── Build structured data for all 6 products ───────────────────────────────
    products = [
        product_data_hose(today_row, prev_row, rows),
        product_data_margin(today_row, prev_row, rows),
        product_data_phaisinh(today_row, prev_row, rows),
        product_data_scash(today_row, prev_row, rows),
        product_data_sfund(today_row, prev_row, rows),
        product_data_moimoi(today_row, prev_row, rows),
    ]

    # ── Sort: tăng → giữ → giảm (priority order preserved within each group) ──
    tang  = [p for p in products if _classify(p["verb"]) == "tang"]
    giu   = [p for p in products if _classify(p["verb"]) == "giu"]
    giam  = [p for p in products if _classify(p["verb"]) == "giam"]
    sorted_products = tang + giu + giam

    # ── Status bar counts ──────────────────────────────────────────────────────
    n_tang = len(tang)
    n_giu  = len(giu)
    n_giam = len(giam)

    status_pills = ""
    if n_tang:
        status_pills += f'<span class="status-pill up">↑ {n_tang} tăng</span>'
    if n_giu:
        status_pills += f'<span class="status-pill flat">= {n_giu} giữ nguyên</span>'
    if n_giam:
        status_pills += f'<span class="status-pill down">↓ {n_giam} giảm</span>'

    # ── Hero ───────────────────────────────────────────────────────────────────
    hero_html = f"""  <div class="report-hero">
    <h1 class="report-title">{hero_title}</h1>
    <p class="report-subtitle">{subtitle}</p>
    <div class="status-bar">
      <span class="status-label">Tổng quan:</span>
      {status_pills}
    </div>
  </div>
  <hr class="section-divider">"""

    # ── Card grid ──────────────────────────────────────────────────────────────
    cards_html = "\n".join(
        render_card(p, rank) for rank, p in enumerate(sorted_products, 1)
    )
    grid_html = f"""  <div class="card-grid">
{cards_html}
  </div>"""

    # ── Footer ─────────────────────────────────────────────────────────────────
    footer_html = f"""  <footer class="report-footer">
    {subtitle} &nbsp;·&nbsp; SSI Daily Report
  </footer>"""

    body = "\n".join([hero_html, grid_html, footer_html])
    chart_payload = generate_json_payload(rows)
    return _html_shell(body, page_title, chart_payload)


# ── MAIN ───────────────────────────────────────────────────────────────────────
def _export_pdfs(html_path: str) -> None:
    import subprocess, os as _os
    script = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "export_pdf.ps1")
    html_abs = _os.path.abspath(html_path)
    out_dir = _os.path.dirname(html_abs)
    subprocess.run(
        ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script,
         "-HtmlPath", html_abs, "-OutDir", out_dir],
        check=True,
    )


def main(*args):
    args = [a.lower() for a in sys.argv[1:]]
    weekly  = "weekly" in args or "--weekly" in args
    monthly = "monthly" in args or "--month" in args
    as_text = "--text" in args
    do_open = "--open" in args
    do_pdf  = "--pdf" in args

    if monthly:
        file = MONTHLY_FILE
        out_file = os.path.join(OUTPUT_DIR, "monthly_report.html")
    elif weekly:
        file = WEEKLY_FILE
        out_file = os.path.join(OUTPUT_DIR, "weekly_report.html")
    else:
        file = DAILY_FILE
        out_file = os.path.join(OUTPUT_DIR, "daily_report.html")

    rows = load_data(22, file=file)

    if as_text:
        print(generate_report(rows, weekly=weekly, monthly=monthly))
    else:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        html = generate_html_report(rows, weekly=weekly, monthly=monthly)
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"Report written → {out_file}")
        if do_open:
            webbrowser.open(out_file)
        if do_pdf:
            _export_pdfs(out_file)


if __name__ == "__main__":
    main()

