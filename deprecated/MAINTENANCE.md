# Daily Report Writer — Maintenance Guide

## Purpose

`report.py` generates the daily SSI derivative report as plain Vietnamese text, ready to paste into Teams.
Run it each morning after the Excel file is updated. No arguments needed.

```
cd "d:\Claude projects\Developed Tools\report_writer_tool"
python report.py
```

Output is written to `out/daily_report.html` (open/share this file on Teams).

---

## Data Source

File: `C:\Users\huanvd-i2025\OneDrive - ssi.com.vn\Documents\Derivative\raw_data\daily_general_data\daily_data.xlsx`
Sheet: `data`

The script reads the **last 2 non-empty rows** automatically (today vs. previous trading day).
It also reads the last 22 rows for 20-day trend detection.

---

## Column Reference (1-based)

| Col | Field | Unit | Used in |
|-----|-------|------|---------|
| 1 | Ngày | Excel serial date | header, footer |
| 2 | Thị Phần cơ sở | decimal % | HOSE headline |
| 3 | Thị phần CN | decimal % | HOSE sub |
| 4 | Thị phần DS | decimal % | HOSE sub |
| 5 | GTGD CS | tỷ | HOSE sub |
| 6 | Thanh Khoản TTCS | tỷ | HOSE sub |
| 7 | Tổng dư nợ Margin | tỷ | Margin headline |
| 8 | SLKH margin | KH | Margin sub |
| 9 | Dư nợ T+7 | tỷ | Margin sub |
| 10 | SLKH T+7 | KH | Margin sub |
| 11 | Dư nợ Trading Plus | tỷ | Margin sub |
| 12 | SLKH Trading Plus | KH | Margin sub |
| 13 | SLKH register M+ | KH | Margin sub |
| 14 | SLKH active M+ | KH | Margin sub |
| 15 | Dư nợ M+ | tỷ | Margin sub |
| 16 | SLKH có dư nợ M+ | KH | Margin sub |
| 17 | Giải ngân M+ | tỷ | Margin sub |
| 18 | SLKH giải ngân M+ | KH | Margin sub |
| 19 | Dư nợ SSI | tỷ | Margin sub |
| 20 | Dư nợ SPV | tỷ | Margin sub |
| 21 | Tỷ trọng SPV / Tổng | decimal % | skip |
| 22 | Thị Phần Phái Sinh | decimal % | PS headline |
| 23 | Thanh khoản thị trường PS | HĐ | PS sub |
| 24 | SLHD PS | HĐ | **DEPRECATED — skip** |
| 25 | SLKH PS | KH | PS sub |
| 26 | SLHD D+ | HĐ | **DEPRECATED — skip** |
| 27 | Tỷ lệ SLHD D+ | decimal % | PS/D+ sub |
| 28 | SLKH D+ | KH | PS/D+ sub |
| 29 | Tỷ lệ SLKH D+ | decimal % | PS/D+ sub |
| 30 | KH cancel D+ | KH | PS/D+ sub |
| 31 | KH register D+ | KH | PS/D+ sub |
| 32 | KH giữ qua đêm | KH | PS/D+ sub |
| 33 | KH sd D+ | KH | PS/D+ sub |
| 34 | SLHD giữ qua đêm | HĐ | skip |
| 35 | Dư nợ D+ mới (giải ngân trong ngày) | tỷ | PS/D+ sub |
| 36 | Dư nợ D+ cuối ngày | tỷ | PS/D+ sub |
| 37 | Số DƯ SCASH | tỷ | SCASH headline |
| 38 | Số DƯ CASA + SCASH | tỷ | SCASH sub |
| 39 | Tỷ lệ SCASH-CASA | decimal % | SCASH sub |
| 40 | SLKH SCASH | KH | SCASH sub |
| 41 | Số DƯ SFUND | tỷ | SFUND headline |
| 42 | SLKH SFUND | KH | SFUND sub |
| 43 | SLKH mở mới | tài khoản | Mở mới headline |
| 44–46 | NAV, VNI, NAV adjusted | — | skip |

**Note:** % columns store decimal values in Excel (e.g. 0.0852 = 8.52%). The script multiplies by 100 for display.

---

## Report Rules

### Delta wording
| Condition | Verb | Preposition |
|-----------|------|-------------|
| pct > 5% | tăng mạnh | lên |
| pct > 0% | tăng | lên |
| pct < -5% | giảm mạnh | về |
| pct < 0% | giảm | về |
| pct = 0% | giữ nguyên mức | (none) |

For **% metrics**, preposition becomes "lên mức" / "về mức" instead of bare "lên" / "về".

### Delta formatting
- `%` metrics: show absolute pct-point delta only, e.g. `(+0.86%)`
- `tỷ` metrics: show abs + pct, e.g. `(+811 tỷ, +1.97%)`
- `KH / HĐ / tài khoản`: show abs + pct, e.g. `(+68 KH, +0.30%)`

### Product sort order
Priority: HOSE → Margin → Phái sinh → SCASH → SFUND → Mở mới

Output order: all **tăng** products (in priority order) → **giữ nguyên** → all **giảm** products (in priority order).

Headline metric per product:
| Product | Headline col |
|---------|-------------|
| HOSE | 2 |
| Margin | 7 |
| Phái sinh | 22 |
| SCASH | 37 |
| SFUND | 41 |
| Mở mới | 43 |

### Trend detection (20-day lookback)
Each headline metric gets an emoji prefix:
- `⚠️ ` — single-day drop > 15%
- `🔴 ` — 3+ consecutive daily declines
- `📈 ` — 3+ consecutive daily increases
- (none) — no trend

---

## Code Map (report.py)

| Function | What it does |
|----------|-------------|
| `load_data(n=22)` | Read last n rows from Excel via openpyxl |
| `clean(v)` | Treat Excel error codes (int < -2B) as None |
| `fmt(v, unit)` | Format value for display |
| `diff(today, prev, unit)` | Compute verb/prep/val_str/delta_part tuple |
| `_prep_muc(prep)` | Map "lên"→"lên mức", "về"→"về mức" for % metrics |
| `_fix_line(line)` | Collapse double spaces, remove space before punctuation |
| `detect_trend(col_idx, rows)` | Return emoji for trend at given column |
| `serial_to_date(serial)` | Excel date serial → Python date |
| `weekday_vn(date)` | Return T2–T6 (rolls back to Friday on weekends) |
| `block_hose/margin/phaisinh/scash/sfund/moimoi` | Format each product block |
| `generate_report(rows)` | Assemble full report string |
| `main()` | Entry point |

---

## Common Maintenance Scenarios

### Add a new sub-line to a block
1. Check which column the new data lives in (see Column Reference above)
2. In the relevant `block_*` function: add a `diff(c(col-1), p(col-1), unit)` call
3. Add the formatted f-string line to the `lines` list
4. If the new column uses `%` unit and needs "lên mức"/"về mức", wrap prep with `_prep_muc()`

### Remove a sub-line from a block
Delete the `diff(...)` call and the corresponding f-string line from the `lines` list.

### Add a new column to the Excel file
1. Update the Column Reference table in this file
2. Find the block where it belongs and add a `diff(c(new_col - 1), ...)` call
3. If a new column shifts existing columns, update ALL `c(idx)` calls for columns after it

### Change the "mạnh" threshold (currently 5%)
In `diff()`, change the `> 5` and `< -5` checks:
```python
# report.py ~line 47
if pct_delta > 5:      # change this threshold
    verb, prep = "tăng mạnh", "lên"
elif pct_delta > 0:
    verb, prep = "tăng", "lên"
elif pct_delta < -5:   # and this one
    verb, prep = "giảm mạnh", "về"
```

### Change the trend detection thresholds
In `detect_trend()`:
- Sudden drop threshold (currently 15%): change `< -0.15`
- Consecutive days (currently 3): change `a < b < c` pattern to use a loop for N days

### Add a new product block
1. Write a new `block_newproduct(today, prev, emoji)` function following the pattern of existing blocks
2. Add it to the priority order list in `generate_report()`
3. Add trend detection: `e_new = detect_trend(col_idx, rows)`
4. Add to `priority_order` list with its verb for sorting

### Remove a product block
1. Delete the `block_*` function
2. Remove its entry from `priority_order` in `generate_report()`
3. Remove its `detect_trend` call

### Change number formatting
In `fmt(v, unit)`:
- Decimal places for `%`: change `:.2f`
- Thousand separator: change `:,` to `:.0f` to remove commas (not recommended)

---

## Excel Error Handling

openpyxl returns COM error codes as large negative integers when cells contain Excel errors (#DIV/0!, #VALUE!, #REF!, etc.). These are caught in `clean(v)` and returned as `None`. Downstream, `fmt(None, unit)` returns `"N/A"` and `diff(None, ...)` returns the `"N/A"` sentinel tuple. Output shows `N/A N/A` for such fields — acceptable fallback.

---

## Dependencies

Only `openpyxl` (already installed). No requirements.txt needed.

## PDF Export

Two PDFs are generated via headless Microsoft Edge:
- `out/daily_report_collapsed.pdf` — all cards collapsed (default view)
- `out/daily_report_full.pdf` — all cards expanded (full details)

**Run:** `python report.py --pdf`

**Requires:** Microsoft Edge installed at standard path.

**How it works:** `export_pdf.ps1` uses `msedge --headless --print-to-pdf`. The HTML reads `?expand=all` query param to auto-expand cards before printing.

**Troubleshooting:**
- If PDFs are blank/missing: ensure Edge is installed and not blocked by policy
- If `--headless` not supported: update Edge to latest version
