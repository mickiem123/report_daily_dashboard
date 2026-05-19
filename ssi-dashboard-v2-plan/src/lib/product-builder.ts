import { diff } from "@/lib/compute";
import type { MetricDefinition, ProductMetadata } from "@/lib/product-metadata";
import type { ProductCard, Row, SubMetric } from "@/lib/types";

const byOrder = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order;

function readNumber(row: Partial<Row> | undefined, columnKey: string): number | null {
  const value = row?.[columnKey];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function trendEmoji(columnKey: string, rows: Array<Partial<Row>>): string {
  const values = rows
    .map((row) => readNumber(row, columnKey))
    .filter((value): value is number => value !== null);
  if (values.length < 2) return "";
  const latest = values[values.length - 1];
  const prev = values[values.length - 2];
  if (latest > prev) return "🟢";
  if (latest < prev) return "🔴";
  return "➖";
}

function metricToSubMetric(
  metric: MetricDefinition,
  today: Partial<Row>,
  prev: Partial<Row> | null,
  group?: string,
): SubMetric {
  const result = diff(readNumber(today, metric.column_key), prev ? readNumber(prev, metric.column_key) : null, metric.unit);
  return {
    metric_id: metric.id,
    label: metric.label,
    value: result.valStr,
    delta: result.deltaStr,
    important: Math.abs(result.pctDelta) > 5,
    group,
    inverse: metric.is_inverse || undefined,
  };
}

export function getEditableFields(metadata: ProductMetadata): MetricDefinition[] {
  const visibleProducts = new Set(metadata.products.filter((product) => product.is_visible).map((product) => product.id));
  return [...metadata.metrics]
    .filter((metric) => metric.is_visible && visibleProducts.has(metric.product_id))
    .sort((a, b) => {
      const productA = metadata.products.find((product) => product.id === a.product_id)?.sort_order ?? 0;
      const productB = metadata.products.find((product) => product.id === b.product_id)?.sort_order ?? 0;
      if (productA !== productB) return productA - productB;
      return a.sort_order - b.sort_order;
    });
}

export function buildProductCardsFromMetadata(
  rows: Array<Partial<Row> & { ngay: string }>,
  metadata: ProductMetadata,
): ProductCard[] {
  if (rows.length === 0) return [];

  const today = rows[rows.length - 1];
  const prev = rows[rows.length - 2] ?? null;
  const visibleMetrics = metadata.metrics.filter((metric) => metric.is_visible);
  const visibleSubProducts = metadata.subProducts.filter((subProduct) => subProduct.is_visible);

  return [...metadata.products]
    .filter((product) => product.is_visible)
    .sort(byOrder)
    .map((product) => {
      const productMetrics = visibleMetrics.filter((metric) => metric.product_id === product.id).sort(byOrder);
      const headlineMetric =
        productMetrics.find((metric) => metric.id === product.headline_metric_id) ??
        productMetrics.find((metric) => metric.placement === "headline") ??
        null;
      const headline = headlineMetric
        ? diff(readNumber(today, headlineMetric.column_key), prev ? readNumber(prev, headlineMetric.column_key) : null, headlineMetric.unit)
        : { verb: "N/A", valStr: "N/A", deltaStr: "", pctDelta: 0 };

      const subMetrics = productMetrics
        .filter((metric) => metric.id !== headlineMetric?.id)
        .map((metric) => {
          const subProduct = metric.sub_product_id
            ? visibleSubProducts.find((item) => item.id === metric.sub_product_id)
            : undefined;
          return metricToSubMetric(metric, today, prev, subProduct?.name);
        });

      return {
        product_id: product.id,
        key: product.key,
        name: product.name,
        trend_emoji: headlineMetric ? trendEmoji(headlineMetric.column_key, rows) : "",
        headline_label: headlineMetric?.label ?? "Chưa có headline",
        headline_value: headline.valStr,
        headline_delta: headline.deltaStr,
        verb: headline.verb,
        sub_metrics: subMetrics,
      };
    });
}
