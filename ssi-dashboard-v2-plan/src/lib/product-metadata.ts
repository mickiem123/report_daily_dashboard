export type MetricPlacement = "headline" | "normal" | "sub_product";

export type MetricUnit = "tỷ" | "KH" | "HĐ" | "tài khoản" | "%";

export interface ProductDefinition {
  id: string;
  key: string;
  name: string;
  headline_metric_id: string | null;
  sort_order: number;
  is_visible: boolean;
}

export interface SubProductDefinition {
  id: string;
  product_id: string;
  name: string;
  sort_order: number;
  is_visible: boolean;
}

export interface MetricDefinition {
  id: string;
  column_key: string;
  label: string;
  unit: MetricUnit;
  product_id: string;
  sub_product_id: string | null;
  placement: MetricPlacement;
  sort_order: number;
  is_visible: boolean;
  is_percent: boolean;
  is_inverse: boolean;
}

export interface ProductMetadata {
  products: ProductDefinition[];
  subProducts: SubProductDefinition[];
  metrics: MetricDefinition[];
}
