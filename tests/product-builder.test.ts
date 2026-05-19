import { describe, expect, it } from "vitest";

import { buildProductCardsFromMetadata, getEditableFields } from "@/lib/product-builder";
import type { MetricDefinition, ProductDefinition, SubProductDefinition } from "@/lib/product-metadata";
import type { Row } from "@/lib/types";

const products: ProductDefinition[] = [
  {
    id: "product-margin",
    key: "margin",
    name: "Margin",
    headline_metric_id: "metric-margin-headline",
    sort_order: 1,
    is_visible: true,
  },
];

const subProducts: SubProductDefinition[] = [
  {
    id: "sub-t7",
    product_id: "product-margin",
    name: "T+7",
    sort_order: 1,
    is_visible: true,
  },
];

const metrics: MetricDefinition[] = [
  {
    id: "metric-margin-headline",
    column_key: "tong_du_no_margin",
    label: "Tá»•ng dÆ° ná»£ Margin",
    unit: "tá»·",
    product_id: "product-margin",
    sub_product_id: null,
    placement: "headline",
    sort_order: 1,
    is_visible: true,
    is_percent: false,
    is_inverse: false,
  },
  {
    id: "metric-margin-normal",
    column_key: "slkh_margin",
    label: "SLKH Margin",
    unit: "KH",
    product_id: "product-margin",
    sub_product_id: null,
    placement: "normal",
    sort_order: 2,
    is_visible: true,
    is_percent: false,
    is_inverse: false,
  },
  {
    id: "metric-t7",
    column_key: "du_no_t7",
    label: "DÆ° ná»£ T+7",
    unit: "tá»·",
    product_id: "product-margin",
    sub_product_id: "sub-t7",
    placement: "sub_product",
    sort_order: 3,
    is_visible: true,
    is_percent: false,
    is_inverse: false,
  },
];

const rows = [
  { ngay: "2026-05-15", tong_du_no_margin: 1000, slkh_margin: 100, du_no_t7: 300 } as Partial<Row> & {
    ngay: string;
  },
  { ngay: "2026-05-18", tong_du_no_margin: 1100, slkh_margin: 120, du_no_t7: 330 } as Partial<Row> & {
    ngay: string;
  },
];

describe("product metadata builder", () => {
  it("builds a product card with one headline and grouped metrics", () => {
    const cards = buildProductCardsFromMetadata(rows, { products, subProducts, metrics });

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      key: "margin",
      name: "Margin",
      headline_label: "Tá»•ng dÆ° ná»£ Margin",
      headline_value: "1.100 tỷ",
      headline_delta: "(+100 tỷ, +10,00%)",
    });
    expect(cards[0].sub_metrics.map((metric) => metric.label)).toEqual(["SLKH Margin", "DÆ° ná»£ T+7"]);
    expect(cards[0].sub_metrics.find((metric) => metric.label === "DÆ° ná»£ T+7")?.group).toBe("T+7");
  });

  it("returns visible editable metric fields in product order", () => {
    expect(getEditableFields({ products, subProducts, metrics }).map((field) => field.column_key)).toEqual([
      "tong_du_no_margin",
      "slkh_margin",
      "du_no_t7",
    ]);
  });

  it("skips hidden products and hidden metrics", () => {
    const cards = buildProductCardsFromMetadata(rows, {
      products: [{ ...products[0], is_visible: false }],
      subProducts,
      metrics,
    });

    expect(cards).toEqual([]);
    expect(
      getEditableFields({
        products,
        subProducts,
        metrics: [{ ...metrics[0], is_visible: false }, ...metrics.slice(1)],
      }).map((field) => field.column_key),
    ).toEqual(["slkh_margin", "du_no_t7"]);
  });
});
