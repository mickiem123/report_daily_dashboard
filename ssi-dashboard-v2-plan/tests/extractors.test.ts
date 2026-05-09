import { describe, expect, it } from "vitest";
import { sampleDailyRows } from "@/fixtures/sample-rows";
import { hose, margin, momoi, phaisinh, scash, sfund } from "@/lib/extractors";

const rows = sampleDailyRows;
const today = rows[rows.length - 1];
const prev = rows[rows.length - 2];

describe("extractors", () => {
  it("hose returns correct card identity and formatted headline", () => {
    const card = hose(today, prev, rows);
    expect(card.key).toBe("hose");
    expect(card.name).toBe("HOSE");
    expect(card.headline_value.length).toBeGreaterThan(0);
  });

  it("hose uses Vietnamese diacritics labels", () => {
    const card = hose(today, prev, rows);
    expect(card.headline_label).toBe("Thị Phần HOSE");
    expect(card.sub_metrics.map((x) => x.label)).toContain("Thanh khoản thị trường");
    expect(card.sub_metrics.map((x) => x.label)).toContain("Thị Phần CN");
  });

  it("margin returns correct card identity and formatted headline", () => {
    const card = margin(today, prev, rows);
    expect(card.key).toBe("margin");
    expect(card.name).toBe("Margin");
    expect(card.headline_value.length).toBeGreaterThan(0);
  });

  it("margin contains exactly required groups", () => {
    const card = margin(today, prev, rows);
    const groups = [...new Set(card.sub_metrics.map((x) => x.group).filter(Boolean))];
    expect(groups).toEqual(["T+7", "Trading Plus", "M+"]);
  });

  it("margin groups T+7 and Trading Plus metrics correctly", () => {
    const card = margin(today, prev, rows);
    expect(card.sub_metrics.find((x) => x.label === "Dư nợ T+7")?.group).toBe("T+7");
    expect(card.sub_metrics.find((x) => x.label === "SLKH T+7")?.group).toBe("T+7");
    expect(card.sub_metrics.find((x) => x.label === "Dư nợ Trading Plus")?.group).toBe("Trading Plus");
    expect(card.sub_metrics.find((x) => x.label === "SLKH Trading Plus")?.group).toBe("Trading Plus");
  });

  it("margin groups all M+ metrics and keeps ungrouped required items", () => {
    const card = margin(today, prev, rows);
    const mplusLabels = [
      "SLKH đăng ký M+",
      "SLKH active M+",
      "Dư nợ M+",
      "SLKH có dư nợ M+",
      "Giải ngân M+",
      "SLKH giải ngân M+",
    ];
    for (const label of mplusLabels) {
      expect(card.sub_metrics.find((x) => x.label === label)?.group).toBe("M+");
    }
    expect(card.sub_metrics.find((x) => x.label === "SLKH Margin")?.group).toBeUndefined();
    expect(card.sub_metrics.find((x) => x.label === "Dư nợ SPV")?.group).toBeUndefined();
  });

  it("phaisinh returns correct card identity and diacritics", () => {
    const card = phaisinh(today, prev, rows);
    expect(card.key).toBe("phaisinh");
    expect(card.name).toBe("Phái Sinh");
    expect(card.headline_label).toBe("Thị Phần Phái Sinh");
  });

  it("phaisinh applies D+ group and inverse only to KH hủy D+", () => {
    const card = phaisinh(today, prev, rows);
    const dplus = card.sub_metrics.filter((x) => x.group === "D+");
    expect(dplus.length).toBeGreaterThan(0);
    expect(card.sub_metrics.find((x) => x.label === "KH hủy D+")?.inverse).toBe(true);
    expect(
      card.sub_metrics.filter((x) => x.inverse).map((x) => x.label),
    ).toEqual(["KH hủy D+"]);
  });

  it("scash returns correct identity and headline", () => {
    const card = scash(today, prev, rows);
    expect(card.key).toBe("scash");
    expect(card.name).toBe("S-Cash");
    expect(card.headline_value.length).toBeGreaterThan(0);
  });

  it("scash uses Vietnamese labels", () => {
    const card = scash(today, prev, rows);
    expect(card.headline_label).toBe("Số dư S-Cash");
    expect(card.sub_metrics.map((x) => x.label)).toContain("Tỷ lệ S-Cash/CASA");
  });

  it("sfund returns correct identity and headline", () => {
    const card = sfund(today, prev, rows);
    expect(card.key).toBe("sfund");
    expect(card.name).toBe("S-Fund");
    expect(card.headline_value.length).toBeGreaterThan(0);
  });

  it("momoi returns correct identity and headline", () => {
    const card = momoi(today, prev, rows);
    expect(card.key).toBe("momoi");
    expect(card.name).toBe("Mở mới");
    expect(card.headline_label).toBe("KH mở tài khoản mới");
  });
});
