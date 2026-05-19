# Product Metadata Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build in-place product and metric structure editing so users can add product cards, add numeric metric columns, and delete metrics/products from the dashboard UI.

**Architecture:** Keep `daily_metrics`, `weekly_metrics`, and `monthly_metrics` as wide value tables. Add product/metric metadata tables, fetch metadata at runtime, build cards/grid columns from metadata, and route schema-changing actions through a Supabase Edge Function named `schema-admin`.

**Tech Stack:** Vite, React 18, TypeScript, TanStack Query, TanStack Table, Supabase JS v2, Supabase Edge Functions, Postgres, Vitest, React Testing Library.

---

## References

- Design spec: `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/docs/superpowers/specs/2026-05-18-product-metadata-schema-design.md`
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Supabase Edge Function secrets: https://supabase.com/docs/guides/functions/secrets
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security

## File Structure

Create:

- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/supabase/schema/product_metadata_schema.sql`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/supabase/functions/schema-admin/index.ts`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/lib/product-metadata.ts`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/lib/product-builder.ts`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/data/metadata.ts`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/data/schema-admin.ts`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/components/AddProductCard.tsx`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/components/StructureDialog.tsx`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/tests/product-builder.test.ts`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/tests/metadata.test.ts`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/tests/schema-admin-client.test.ts`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/tests/structure-ui.test.tsx`

Modify:

- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/lib/types.ts`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/data/queries.ts`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/data/mutations.ts`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/components/Card.tsx`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/components/CardBack.tsx`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/components/DataGrid.tsx`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/components/Section.tsx`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/tests/data-layer.smoke.test.ts`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/tests/datagrid.test.tsx`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/tests/section.test.tsx`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/tests/card.test.tsx`

Keep:

- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/lib/compute.ts`
- `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/lib/status.ts`

---

### Task 1: Product Metadata Types And Builder

**Files:**
- Create: `src/lib/product-metadata.ts`
- Create: `src/lib/product-builder.ts`
- Test: `tests/product-builder.test.ts`
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Write failing builder tests**

Create `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/tests/product-builder.test.ts`:

```ts
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
    label: "Tổng dư nợ Margin",
    unit: "tỷ",
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
    label: "Dư nợ T+7",
    unit: "tỷ",
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
  { ngay: "2026-05-15", tong_du_no_margin: 1000, slkh_margin: 100, du_no_t7: 300 } as Partial<Row> & { ngay: string },
  { ngay: "2026-05-18", tong_du_no_margin: 1100, slkh_margin: 120, du_no_t7: 330 } as Partial<Row> & { ngay: string },
];

describe("product metadata builder", () => {
  it("builds a product card with one headline and grouped metrics", () => {
    const cards = buildProductCardsFromMetadata(rows, { products, subProducts, metrics });

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      key: "margin",
      name: "Margin",
      headline_label: "Tổng dư nợ Margin",
      headline_value: "1.100 tỷ",
      headline_delta: "(+100 tỷ, +10,00%)",
    });
    expect(cards[0].sub_metrics.map((metric) => metric.label)).toEqual(["SLKH Margin", "Dư nợ T+7"]);
    expect(cards[0].sub_metrics.find((metric) => metric.label === "Dư nợ T+7")?.group).toBe("T+7");
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
        metrics: [{ ...metrics[0], is_visible: false }],
      }).map((field) => field.column_key),
    ).toEqual(["slkh_margin", "du_no_t7"]);
  });
});
```

- [ ] **Step 2: Run builder test and verify failure**

Run:

```powershell
npx vitest run tests/product-builder.test.ts
```

Expected: FAIL because `@/lib/product-builder` and `@/lib/product-metadata` do not exist.

- [ ] **Step 3: Add metadata types**

Create `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/lib/product-metadata.ts`:

```ts
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
```

- [ ] **Step 4: Loosen `Row` for runtime-added metric columns**

Modify `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/lib/types.ts`.

Change the `Row` interface opening from:

```ts
export interface Row {
```

to:

```ts
export interface Row {
  [key: string]: number | string | null | undefined;
```

Keep all existing named fields. This preserves known field type help while allowing runtime-added numeric columns.

- [ ] **Step 5: Implement product builder**

Create `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/lib/product-builder.ts`:

```ts
import { diff } from "@/lib/compute";
import type { ProductCard, Row, SubMetric } from "@/lib/types";
import type { MetricDefinition, ProductMetadata } from "@/lib/product-metadata";

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

export function buildProductCardsFromMetadata(rows: Array<Partial<Row> & { ngay: string }>, metadata: ProductMetadata): ProductCard[] {
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
```

- [ ] **Step 6: Run builder test and verify pass**

Run:

```powershell
npx vitest run tests/product-builder.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 1**

Run:

```powershell
git add src/lib/types.ts src/lib/product-metadata.ts src/lib/product-builder.ts tests/product-builder.test.ts
git commit -m "T01: add product metadata builder"
```

---

### Task 2: Metadata Data Layer

**Files:**
- Create: `src/data/metadata.ts`
- Modify: `src/data/queries.ts`
- Test: `tests/metadata.test.ts`

- [ ] **Step 1: Write failing metadata query tests**

Create `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/tests/metadata.test.ts`:

```ts
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement } from "react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useProductMetadata } from "@/data/metadata";

const { fromMock, supabaseMock } = vi.hoisted(() => {
  const from = vi.fn();
  return { fromMock: from, supabaseMock: { from } };
});

vi.mock("@/data/supabase", () => ({
  supabase: supabaseMock,
}));

const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("metadata data layer", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fetches products, sub-products, and metric definitions", async () => {
    const productsOrder = vi.fn().mockResolvedValue({
      data: [{ id: "p1", key: "hose", name: "HOSE", headline_metric_id: "m1", sort_order: 1, is_visible: true }],
      error: null,
    });
    const subProductsOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const metricsOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: "m1",
          column_key: "thi_phan_co_so",
          label: "Thị Phần HOSE",
          unit: "%",
          product_id: "p1",
          sub_product_id: null,
          placement: "headline",
          sort_order: 1,
          is_visible: true,
          is_percent: true,
          is_inverse: false,
        },
      ],
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === "products") return { select: () => ({ order: productsOrder }) };
      if (table === "sub_products") return { select: () => ({ order: subProductsOrder }) };
      if (table === "metric_definitions") return { select: () => ({ order: metricsOrder }) };
      throw new Error(`Unexpected table ${table}`);
    });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useProductMetadata(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.products[0].name).toBe("HOSE");
    expect(result.current.data?.metrics[0].column_key).toBe("thi_phan_co_so");
    expect(fromMock).toHaveBeenCalledWith("products");
    expect(fromMock).toHaveBeenCalledWith("sub_products");
    expect(fromMock).toHaveBeenCalledWith("metric_definitions");
  });
});
```

- [ ] **Step 2: Run metadata test and verify failure**

Run:

```powershell
npx vitest run tests/metadata.test.ts
```

Expected: FAIL because `@/data/metadata` does not exist.

- [ ] **Step 3: Implement metadata hook**

Create `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/data/metadata.ts`:

```ts
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { supabase } from "@/data/supabase";
import type { ProductMetadata } from "@/lib/product-metadata";

export const PRODUCT_METADATA_QUERY_KEY = ["product-metadata"] as const;

async function fetchOrdered<T>(table: string): Promise<T[]> {
  const { data, error } = await supabase.from(table).select("*").order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as T[];
}

export async function fetchProductMetadata(): Promise<ProductMetadata> {
  const [products, subProducts, metrics] = await Promise.all([
    fetchOrdered<ProductMetadata["products"][number]>("products"),
    fetchOrdered<ProductMetadata["subProducts"][number]>("sub_products"),
    fetchOrdered<ProductMetadata["metrics"][number]>("metric_definitions"),
  ]);

  return { products, subProducts, metrics };
}

export const useProductMetadata = (): UseQueryResult<ProductMetadata> =>
  useQuery({
    queryKey: PRODUCT_METADATA_QUERY_KEY,
    queryFn: fetchProductMetadata,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
```

- [ ] **Step 4: Run metadata test and verify pass**

Run:

```powershell
npx vitest run tests/metadata.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

Run:

```powershell
git add src/data/metadata.ts tests/metadata.test.ts
git commit -m "T02: add product metadata data layer"
```

---

### Task 3: Schema Admin Client

**Files:**
- Create: `src/data/schema-admin.ts`
- Test: `tests/schema-admin-client.test.ts`

- [ ] **Step 1: Write failing client tests**

Create `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/tests/schema-admin-client.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

import { addMetric, addProduct, deleteMetric, deleteProduct } from "@/data/schema-admin";

const { invokeMock, supabaseMock } = vi.hoisted(() => {
  const invoke = vi.fn();
  return { invokeMock: invoke, supabaseMock: { functions: { invoke } } };
});

vi.mock("@/data/supabase", () => ({
  supabase: supabaseMock,
}));

describe("schema admin client", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("invokes add_product action", async () => {
    invokeMock.mockResolvedValue({ data: { ok: true }, error: null });

    await addProduct({ name: "VIP" });

    expect(invokeMock).toHaveBeenCalledWith("schema-admin", {
      body: { action: "add_product", payload: { name: "VIP" } },
    });
  });

  it("throws function errors", async () => {
    invokeMock.mockResolvedValue({ data: null, error: new Error("Boom") });

    await expect(addProduct({ name: "VIP" })).rejects.toThrow("Boom");
  });

  it("invokes metric and product delete actions", async () => {
    invokeMock.mockResolvedValue({ data: { ok: true }, error: null });

    await addMetric({ label: "Dư nợ VIP", unit: "tỷ", product_id: "p1", placement: "normal" });
    await deleteMetric({ metric_id: "m1", confirmation: "du_no_vip" });
    await deleteProduct({ product_id: "p1", confirmation: "VIP" });

    expect(invokeMock.mock.calls.map((call) => call[1].body.action)).toEqual([
      "add_metric",
      "delete_metric",
      "delete_product",
    ]);
  });
});
```

- [ ] **Step 2: Run client test and verify failure**

Run:

```powershell
npx vitest run tests/schema-admin-client.test.ts
```

Expected: FAIL because `@/data/schema-admin` does not exist.

- [ ] **Step 3: Implement schema admin client**

Create `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/data/schema-admin.ts`:

```ts
import { supabase } from "@/data/supabase";
import type { MetricPlacement, MetricUnit } from "@/lib/product-metadata";

type SchemaAdminAction = "add_product" | "add_metric" | "delete_metric" | "delete_product";

interface SchemaAdminResponse<T> {
  ok: boolean;
  result?: T;
  error?: string;
}

export interface AddProductPayload {
  name: string;
}

export interface AddMetricPayload {
  label: string;
  unit: MetricUnit;
  product_id: string;
  placement: MetricPlacement;
  sub_product_id?: string;
  sub_product_name?: string;
  is_inverse?: boolean;
}

export interface DeleteMetricPayload {
  metric_id: string;
  confirmation: string;
}

export interface DeleteProductPayload {
  product_id: string;
  confirmation: string;
}

async function invokeSchemaAdmin<T>(action: SchemaAdminAction, payload: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke<SchemaAdminResponse<T>>("schema-admin", {
    body: { action, payload },
  });

  if (error) {
    throw error;
  }

  if (!data?.ok) {
    throw new Error(data?.error ?? "Schema admin request failed");
  }

  return data.result as T;
}

export const addProduct = (payload: AddProductPayload) => invokeSchemaAdmin("add_product", payload);

export const addMetric = (payload: AddMetricPayload) => invokeSchemaAdmin("add_metric", payload);

export const deleteMetric = (payload: DeleteMetricPayload) => invokeSchemaAdmin("delete_metric", payload);

export const deleteProduct = (payload: DeleteProductPayload) => invokeSchemaAdmin("delete_product", payload);
```

- [ ] **Step 4: Run client test and verify pass**

Run:

```powershell
npx vitest run tests/schema-admin-client.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

Run:

```powershell
git add src/data/schema-admin.ts tests/schema-admin-client.test.ts
git commit -m "T03: add schema admin client"
```

---

### Task 4: Database Schema SQL

**Files:**
- Create: `supabase/schema/product_metadata_schema.sql`

- [ ] **Step 1: Check Supabase CLI availability**

Run:

```powershell
supabase --help
```

Expected: command prints Supabase CLI help. If the command is unavailable, use the SQL file created in this task with the Supabase SQL Editor for v1 and install the CLI before creating deployable migrations.

- [ ] **Step 2: Create schema SQL file**

Create `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/supabase/schema/product_metadata_schema.sql`:

```sql
create extension if not exists pgcrypto;

create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),
    key text not null unique,
    name text not null,
    headline_metric_id uuid null,
    sort_order integer not null,
    is_visible boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.sub_products (
    id uuid primary key default gen_random_uuid(),
    product_id uuid not null references public.products(id) on delete cascade,
    name text not null,
    sort_order integer not null,
    is_visible boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (product_id, name)
);

create table if not exists public.metric_definitions (
    id uuid primary key default gen_random_uuid(),
    column_key text not null unique,
    label text not null,
    unit text not null check (unit in ('tỷ', 'KH', 'HĐ', 'tài khoản', '%')),
    product_id uuid not null references public.products(id) on delete restrict,
    sub_product_id uuid null references public.sub_products(id) on delete restrict,
    placement text not null check (placement in ('headline', 'normal', 'sub_product')),
    sort_order integer not null,
    is_visible boolean not null default true,
    is_percent boolean not null default false,
    is_inverse boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (
        (placement = 'sub_product' and sub_product_id is not null)
        or (placement <> 'sub_product' and sub_product_id is null)
    )
);

alter table public.products
    add constraint products_headline_metric_fk
    foreign key (headline_metric_id)
    references public.metric_definitions(id)
    on delete set null;

create index if not exists sub_products_product_order_idx
    on public.sub_products (product_id, sort_order);

create index if not exists metric_definitions_product_order_idx
    on public.metric_definitions (product_id, sort_order);

alter table public.products enable row level security;
alter table public.sub_products enable row level security;
alter table public.metric_definitions enable row level security;

grant select on public.products to anon, authenticated;
grant select on public.sub_products to anon, authenticated;
grant select on public.metric_definitions to anon, authenticated;

create policy "public_read_products"
on public.products
for select
to anon, authenticated
using (true);

create policy "public_read_sub_products"
on public.sub_products
for select
to anon, authenticated
using (true);

create policy "public_read_metric_definitions"
on public.metric_definitions
for select
to anon, authenticated
using (true);

insert into public.products (key, name, sort_order)
values
    ('hose', 'HOSE', 1),
    ('margin', 'Margin', 2),
    ('phaisinh', 'Phái Sinh', 3),
    ('scash', 'S-Cash', 4),
    ('sfund', 'S-Fund', 5),
    ('momoi', 'Mở mới', 6)
on conflict (key) do update
set name = excluded.name,
    sort_order = excluded.sort_order;

with product_ids as (
    select id, key from public.products
),
sub_product_seed(product_key, name, sort_order) as (
    values
        ('margin', 'T+7', 1),
        ('margin', 'Trading Plus', 2),
        ('margin', 'M+', 3),
        ('phaisinh', 'D+', 1)
),
upserted_sub_products as (
    insert into public.sub_products (product_id, name, sort_order)
    select p.id, s.name, s.sort_order
    from sub_product_seed s
    join product_ids p on p.key = s.product_key
    on conflict (product_id, name) do update
    set sort_order = excluded.sort_order
    returning id, product_id, name
),
sub_product_ids as (
    select sp.id, sp.name, p.key as product_key
    from public.sub_products sp
    join public.products p on p.id = sp.product_id
),
inserted_metrics as (
    insert into public.metric_definitions (
        column_key,
        label,
        unit,
        product_id,
        sub_product_id,
        placement,
        sort_order,
        is_percent,
        is_inverse
    )
    values
        ('thi_phan_co_so', 'Thị Phần HOSE', '%', (select id from product_ids where key = 'hose'), null, 'headline', 1, true, false),
        ('thanh_khoan_ttcs', 'Thanh khoản thị trường', 'tỷ', (select id from product_ids where key = 'hose'), null, 'normal', 2, false, false),
        ('gtgd_cs_ssi', 'GTGD SSI', 'tỷ', (select id from product_ids where key = 'hose'), null, 'normal', 3, false, false),
        ('thi_phan_cn', 'Thị Phần CN', '%', (select id from product_ids where key = 'hose'), null, 'normal', 4, true, false),
        ('thi_phan_ds', 'Thị Phần DS', '%', (select id from product_ids where key = 'hose'), null, 'normal', 5, true, false),
        ('tong_du_no_margin', 'Tổng dư nợ Margin TK6+7', 'tỷ', (select id from product_ids where key = 'margin'), null, 'headline', 1, false, false),
        ('slkh_margin', 'SLKH Margin', 'KH', (select id from product_ids where key = 'margin'), null, 'normal', 2, false, false),
        ('du_no_t7', 'Dư nợ T+7', 'tỷ', (select id from product_ids where key = 'margin'), (select id from sub_product_ids where product_key = 'margin' and name = 'T+7'), 'sub_product', 3, false, false),
        ('slkh_t7', 'SLKH T+7', 'KH', (select id from product_ids where key = 'margin'), (select id from sub_product_ids where product_key = 'margin' and name = 'T+7'), 'sub_product', 4, false, false),
        ('du_no_trading_plus', 'Dư nợ Trading Plus', 'tỷ', (select id from product_ids where key = 'margin'), (select id from sub_product_ids where product_key = 'margin' and name = 'Trading Plus'), 'sub_product', 5, false, false),
        ('slkh_trading_plus', 'SLKH Trading Plus', 'KH', (select id from product_ids where key = 'margin'), (select id from sub_product_ids where product_key = 'margin' and name = 'Trading Plus'), 'sub_product', 6, false, false),
        ('slkh_register_mplus', 'SLKH đăng ký M+', 'KH', (select id from product_ids where key = 'margin'), (select id from sub_product_ids where product_key = 'margin' and name = 'M+'), 'sub_product', 7, false, false),
        ('slkh_active_mplus', 'SLKH active M+', 'KH', (select id from product_ids where key = 'margin'), (select id from sub_product_ids where product_key = 'margin' and name = 'M+'), 'sub_product', 8, false, false),
        ('du_no_mplus', 'Dư nợ M+', 'tỷ', (select id from product_ids where key = 'margin'), (select id from sub_product_ids where product_key = 'margin' and name = 'M+'), 'sub_product', 9, false, false),
        ('slkh_co_du_no_mplus', 'SLKH có dư nợ M+', 'KH', (select id from product_ids where key = 'margin'), (select id from sub_product_ids where product_key = 'margin' and name = 'M+'), 'sub_product', 10, false, false),
        ('giai_ngan_mplus', 'Giải ngân M+', 'tỷ', (select id from product_ids where key = 'margin'), (select id from sub_product_ids where product_key = 'margin' and name = 'M+'), 'sub_product', 11, false, false),
        ('slkh_giai_ngan_mplus', 'SLKH giải ngân M+', 'KH', (select id from product_ids where key = 'margin'), (select id from sub_product_ids where product_key = 'margin' and name = 'M+'), 'sub_product', 12, false, false),
        ('du_no_spv', 'Dư nợ SPV', 'tỷ', (select id from product_ids where key = 'margin'), null, 'normal', 13, false, false),
        ('ty_trong_spv', 'Tỷ Trọng SPV', '%', (select id from product_ids where key = 'margin'), null, 'normal', 14, true, false),
        ('thi_phan_phai_sinh', 'Thị Phần Phái Sinh', '%', (select id from product_ids where key = 'phaisinh'), null, 'headline', 1, true, false),
        ('thanh_khoan_tt_ps', 'Thanh khoản TTPS', 'HĐ', (select id from product_ids where key = 'phaisinh'), null, 'normal', 2, false, false),
        ('slkh_ps', 'SLKH PS', 'KH', (select id from product_ids where key = 'phaisinh'), null, 'normal', 3, false, false),
        ('ty_le_slhd_dplus', 'Tỷ Lệ SLHĐ D+', '%', (select id from product_ids where key = 'phaisinh'), (select id from sub_product_ids where product_key = 'phaisinh' and name = 'D+'), 'sub_product', 4, true, false),
        ('slkh_dplus', 'SLKH D+', 'KH', (select id from product_ids where key = 'phaisinh'), (select id from sub_product_ids where product_key = 'phaisinh' and name = 'D+'), 'sub_product', 5, false, false),
        ('ty_le_slkh_dplus', 'Tỷ lệ KH dùng D+', '%', (select id from product_ids where key = 'phaisinh'), (select id from sub_product_ids where product_key = 'phaisinh' and name = 'D+'), 'sub_product', 6, true, false),
        ('kh_cancel_dplus', 'KH hủy D+', 'KH', (select id from product_ids where key = 'phaisinh'), (select id from sub_product_ids where product_key = 'phaisinh' and name = 'D+'), 'sub_product', 7, false, true),
        ('kh_register_dplus', 'KH đăng ký D+', 'KH', (select id from product_ids where key = 'phaisinh'), (select id from sub_product_ids where product_key = 'phaisinh' and name = 'D+'), 'sub_product', 8, false, false),
        ('kh_giu_qua_dem', 'KH giữ qua đêm', 'KH', (select id from product_ids where key = 'phaisinh'), (select id from sub_product_ids where product_key = 'phaisinh' and name = 'D+'), 'sub_product', 9, false, false),
        ('kh_sd_dplus', 'KH sử dụng D+', 'KH', (select id from product_ids where key = 'phaisinh'), (select id from sub_product_ids where product_key = 'phaisinh' and name = 'D+'), 'sub_product', 10, false, false),
        ('slhd_giu_qua_dem', 'SLHĐ giữ qua đêm', 'HĐ', (select id from product_ids where key = 'phaisinh'), (select id from sub_product_ids where product_key = 'phaisinh' and name = 'D+'), 'sub_product', 11, false, false),
        ('du_no_dplus_giai_ngan', 'Giải ngân D+', 'tỷ', (select id from product_ids where key = 'phaisinh'), (select id from sub_product_ids where product_key = 'phaisinh' and name = 'D+'), 'sub_product', 12, false, false),
        ('du_no_dplus_cuoi_ngay', 'Dư nợ D+ cuối ngày', 'tỷ', (select id from product_ids where key = 'phaisinh'), (select id from sub_product_ids where product_key = 'phaisinh' and name = 'D+'), 'sub_product', 13, false, false),
        ('so_du_scash', 'Số dư S-Cash', 'tỷ', (select id from product_ids where key = 'scash'), null, 'headline', 1, false, false),
        ('slkh_scash', 'SLKH S-Cash', 'KH', (select id from product_ids where key = 'scash'), null, 'normal', 2, false, false),
        ('so_du_casa_scash', 'Tổng dư SCASH+CASA', 'tỷ', (select id from product_ids where key = 'scash'), null, 'normal', 3, false, false),
        ('ty_le_scash_casa', 'Tỷ lệ S-Cash/CASA', '%', (select id from product_ids where key = 'scash'), null, 'normal', 4, true, false),
        ('so_du_sfund', 'Số dư S-Fund', 'tỷ', (select id from product_ids where key = 'sfund'), null, 'headline', 1, false, false),
        ('slkh_sfund', 'SLKH S-Fund', 'KH', (select id from product_ids where key = 'sfund'), null, 'normal', 2, false, false),
        ('slkh_mo_moi', 'KH mở tài khoản mới', 'tài khoản', (select id from product_ids where key = 'momoi'), null, 'headline', 1, false, false)
    on conflict (column_key) do update
    set label = excluded.label,
        unit = excluded.unit,
        product_id = excluded.product_id,
        sub_product_id = excluded.sub_product_id,
        placement = excluded.placement,
        sort_order = excluded.sort_order,
        is_percent = excluded.is_percent,
        is_inverse = excluded.is_inverse
    returning id, product_id, column_key
)
update public.products p
set headline_metric_id = m.id
from public.metric_definitions m
where m.product_id = p.id
  and m.placement = 'headline';
```

- [ ] **Step 3: Verify seed completeness before execution**

Run this SQL after the file is applied in a development database:

```sql
select count(*) as metric_count from public.metric_definitions;
select key, name, headline_metric_id is not null as has_headline from public.products order by sort_order;
```

Expected: `metric_count = 39`; all six seeded products return `has_headline = true`.

- [ ] **Step 4: Execute SQL in a staging or development Supabase project**

Use one of these commands:

```powershell
supabase db query --file supabase/schema/product_metadata_schema.sql
```

or paste the SQL into the Supabase SQL Editor.

Expected: metadata tables exist, RLS is enabled, `SELECT * FROM products` returns the six seeded products.

- [ ] **Step 5: Commit Task 4**

Run:

```powershell
git add supabase/schema/product_metadata_schema.sql
git commit -m "T04: add product metadata schema sql"
```

---

### Task 5: Dynamic Data Grid

**Files:**
- Modify: `src/components/DataGrid.tsx`
- Modify: `src/lib/validation.ts`
- Modify: `tests/datagrid.test.tsx`

- [ ] **Step 1: Add failing dynamic column test**

In `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/tests/datagrid.test.tsx`, add this test inside `describe("DataGrid", () => { ... })`:

```ts
it("renders editable columns from metric definitions", () => {
  render(
    <DataGrid
      mode="daily"
      rows={[{ ngay: "2026-05-18", custom_metric: 123 } as never]}
      metrics={[
        {
          id: "m1",
          column_key: "custom_metric",
          label: "Custom Metric",
          unit: "KH",
          product_id: "p1",
          sub_product_id: null,
          placement: "normal",
          sort_order: 1,
          is_visible: true,
          is_percent: false,
          is_inverse: false,
        },
      ]}
      onCellEdit={vi.fn()}
      onAddRow={vi.fn()}
      onDeleteRow={vi.fn()}
      {...defaultProps}
    />,
  );

  expect(screen.getByRole("columnheader", { name: "Custom Metric" })).toBeInTheDocument();
  expect(screen.getByTestId("cell-2026-05-18-custom_metric")).toHaveValue("123");
});
```

- [ ] **Step 2: Run grid test and verify failure**

Run:

```powershell
npx vitest run tests/datagrid.test.tsx
```

Expected: FAIL because `DataGrid` does not accept `metrics`.

- [ ] **Step 3: Update DataGrid props and field helpers**

Modify `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/components/DataGrid.tsx`.

Add import:

```ts
import type { MetricDefinition } from "@/lib/product-metadata";
```

Change props:

```ts
type DataGridProps = {
  mode: Mode;
  rows: Row[];
  metrics?: MetricDefinition[];
  onCellEdit: (ngay: string, field: string, newValue: number | string | null) => void;
  onAddRow: () => void;
  onSaveChanges: () => void;
  onDeleteRow: (ngay: string) => void;
  hasPendingChanges: boolean;
  isSaving: boolean;
};
```

Inside `DataGrid`, derive fields:

```ts
  const editableMetrics = useMemo(
    () =>
      metrics ??
      NUMERIC_FIELDS.map((field) => ({
        id: field,
        column_key: field,
        label: FIELD_LABELS[field],
        unit: PERCENT_FIELDS.has(field) ? "%" : "KH",
        product_id: "",
        sub_product_id: null,
        placement: "normal" as const,
        sort_order: 0,
        is_visible: true,
        is_percent: PERCENT_FIELDS.has(field),
        is_inverse: false,
      })),
    [metrics],
  );
```

Change helpers from `keyof Row` to `string` where needed:

```ts
function toInputValue(field: string, value: number | string | null | undefined, isPercent: boolean): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return isPercent ? String(Number((value * 100).toFixed(4))) : String(value);
  return value;
}

function toStoredValue(field: string, value: string, isPercent: boolean): number | string | null {
  if (field === "ngay") return value.trim();
  const raw = value.trim();
  if (raw === "") return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return Number.NaN;
  return isPercent ? parsed / 100 : parsed;
}
```

Replace `...NUMERIC_FIELDS.map((field)` column generation with:

```ts
      ...editableMetrics.map((metric): ColumnDef<GridRow> => ({
        accessorKey: metric.column_key,
        header: metric.label,
        cell: ({ row }) => {
          const item = row.original;
          const field = metric.column_key;
          const key = getDraftKey(item, field);
          const value = drafts[key] ?? toInputValue(field, item[field], metric.is_percent);
          const validation = validations[key];
          const input = (
            <Input
              key={item.__isNew ? `${key}:${newRowVersion}` : undefined}
              ref={(element) => {
                inputRefs.current[key] = element;
              }}
              data-testid={`cell-${item.__isNew ? NEW_ROW_KEY : item.ngay}-${field}`}
              data-severity={validation?.severity}
              defaultValue={value}
              className={getInputClass(field, validation)}
              onFocus={() => {
                focusedCellKeyRef.current = key;
              }}
              onBlur={(event) => commitCell(item, field, event.target.value, metric.is_percent)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
            />
          );
          if (validation?.severity !== "warn" && validation?.severity !== "outlier") return input;
          return (
            <Tooltip>
              <TooltipTrigger asChild>{input}</TooltipTrigger>
              <TooltipContent>{validation.message}</TooltipContent>
            </Tooltip>
          );
        },
      })),
```

- [ ] **Step 4: Update validation signature**

Modify `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/lib/validation.ts`.

Keep existing default sets, but add optional `isNumeric` and `isPercent` arguments:

```ts
export function validateCell(
  field: string,
  value: unknown,
  history: (number | null)[],
  options: { isNumeric?: boolean; isPercent?: boolean } = {},
): CellValidation {
  if (field === "ngay") {
    if (!isDateYYYYMMDD(value)) return { severity: "error", message: "Ngày không hợp lệ, dùng YYYY-MM-DD." };
    return { severity: "ok" };
  }

  const isNumericField = options.isNumeric ?? NUMERIC_FIELDS.has(field);
  const isPercentField = options.isPercent ?? PERCENT_FIELDS.has(field);

  if (!isNumericField) return { severity: "ok" };

  const n = toNumber(value);
  if (n === null) return { severity: "error", message: "Giá trị phải là số, vui lòng nhập lại." };

  if (isPercentField && (n < 0 || n > 1)) {
    return { severity: "warn", message: "Trường phần trăm nên nằm trong khoảng 0..1." };
  }

  if (n < 0) return { severity: "warn", message: "Giá trị âm cần được kiểm tra lại." };

  const cleanHistory = history.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  const z = robustZScore(n, cleanHistory);
  if (z !== null && Math.abs(z) >= 3) {
    return { severity: "outlier", message: `Giá trị bất thường (z=${Math.abs(z).toFixed(2)}).` };
  }

  return { severity: "ok" };
}
```

- [ ] **Step 5: Run grid tests and verify pass**

Run:

```powershell
npx vitest run tests/datagrid.test.tsx tests/validation.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 5**

Run:

```powershell
git add src/components/DataGrid.tsx src/lib/validation.ts tests/datagrid.test.tsx
git commit -m "T05: render grid columns from metric metadata"
```

---

### Task 6: Section Integration

**Files:**
- Modify: `src/components/Section.tsx`
- Modify: `src/data/mutations.ts`
- Modify: `tests/section.test.tsx`
- Modify: `tests/crud-flow.test.tsx`

- [ ] **Step 1: Update Section tests for metadata hook**

In `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/tests/section.test.tsx`, mock metadata:

```ts
const metadataMocks = vi.hoisted(() => ({
  useProductMetadata: vi.fn(),
}));

vi.mock("@/data/metadata", () => metadataMocks);
```

In `beforeEach`, return sample metadata:

```ts
metadataMocks.useProductMetadata.mockReturnValue({
  data: {
    products: [
      { id: "p1", key: "hose", name: "HOSE", headline_metric_id: "m1", sort_order: 1, is_visible: true },
    ],
    subProducts: [],
    metrics: [
      {
        id: "m1",
        column_key: "thi_phan_co_so",
        label: "Thị Phần HOSE",
        unit: "%",
        product_id: "p1",
        sub_product_id: null,
        placement: "headline",
        sort_order: 1,
        is_visible: true,
        is_percent: true,
        is_inverse: false,
      },
    ],
  },
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
});
```

Change the populated render assertion from six cards to one card:

```ts
expect(screen.getAllByTestId("section-card")).toHaveLength(1);
```

- [ ] **Step 2: Run Section test and verify failure**

Run:

```powershell
npx vitest run tests/section.test.tsx
```

Expected: FAIL because `Section` does not call `useProductMetadata`.

- [ ] **Step 3: Integrate metadata in Section**

Modify `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/components/Section.tsx`.

Add imports:

```ts
import { useProductMetadata, PRODUCT_METADATA_QUERY_KEY } from "@/data/metadata";
import { buildProductCardsFromMetadata, getEditableFields } from "@/lib/product-builder";
```

In `Section`, fetch metadata:

```ts
  const metadataQuery = useProductMetadata();
  return <SectionWithEditor mode={mode} query={query} metadataQuery={metadataQuery} />;
```

Update `SectionWithEditor` props:

```ts
function SectionWithEditor({
  mode,
  query,
  metadataQuery,
}: {
  mode: Mode;
  query: UseQueryResult<Row[]>;
  metadataQuery: ReturnType<typeof useProductMetadata>;
}) {
```

Pass metrics to `DataGrid`:

```tsx
          metrics={metadataQuery.data ? getEditableFields(metadataQuery.data) : undefined}
```

After schema admin operations in this task group, invalidate:

```ts
await queryClient.invalidateQueries({ queryKey: PRODUCT_METADATA_QUERY_KEY });
```

Update `SectionBody`:

```ts
function SectionBody({ query, metadataQuery }: { query: UseQueryResult<Row[]>; metadataQuery: ReturnType<typeof useProductMetadata> }) {
```

Treat metadata loading/error as section loading/error:

```ts
  if (query.isLoading || metadataQuery.isLoading) {
```

```ts
  if (query.isError || metadataQuery.isError) {
```

Build cards dynamically:

```ts
  const cards = metadataQuery.data ? sortCards(buildProductCardsFromMetadata(rows, metadataQuery.data)) : [];
```

- [ ] **Step 4: Keep legacy fallback only while metadata is absent**

Inside `SectionBody`, use this fallback until the migration is applied:

```ts
  const cards = metadataQuery.data
    ? sortCards(buildProductCardsFromMetadata(rows, metadataQuery.data))
    : sortCards(buildCards(rows));
```

This allows development before metadata tables exist. Remove the fallback after production metadata is seeded and tests are adjusted.

- [ ] **Step 5: Run Section and CRUD tests**

Run:

```powershell
npx vitest run tests/section.test.tsx tests/crud-flow.test.tsx
```

Expected: PASS after updating mocks in `crud-flow.test.tsx` the same way as `section.test.tsx`.

- [ ] **Step 6: Commit Task 6**

Run:

```powershell
git add src/components/Section.tsx tests/section.test.tsx tests/crud-flow.test.tsx
git commit -m "T06: integrate product metadata into section rendering"
```

---

### Task 7: In-Place Structure UI

**Files:**
- Create: `src/components/AddProductCard.tsx`
- Create: `src/components/StructureDialog.tsx`
- Modify: `src/components/Card.tsx`
- Modify: `src/components/CardBack.tsx`
- Modify: `src/components/Section.tsx`
- Test: `tests/structure-ui.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Create `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/tests/structure-ui.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AddProductCard } from "@/components/AddProductCard";
import { StructureDialog } from "@/components/StructureDialog";
import type { ProductDefinition } from "@/lib/product-metadata";

const product: ProductDefinition = {
  id: "p1",
  key: "margin",
  name: "Margin",
  headline_metric_id: null,
  sort_order: 1,
  is_visible: true,
};

describe("structure UI", () => {
  it("submits a product name from the add-card tile", () => {
    const onSubmit = vi.fn();
    render(<AddProductCard onSubmit={onSubmit} isSaving={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Thêm card sản phẩm" }));
    fireEvent.change(screen.getByLabelText("Tên sản phẩm"), { target: { value: "VIP Margin" } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo card" }));

    expect(onSubmit).toHaveBeenCalledWith({ name: "VIP Margin" });
  });

  it("submits a normal metric scoped to a product", () => {
    const onAddMetric = vi.fn();
    render(
      <StructureDialog
        open
        mode="add_metric"
        product={product}
        subProducts={[]}
        isSaving={false}
        onOpenChange={vi.fn()}
        onAddMetric={onAddMetric}
        onDeleteMetric={vi.fn()}
        onDeleteProduct={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Tên metric"), { target: { value: "Dư nợ VIP" } });
    fireEvent.change(screen.getByLabelText("Đơn vị"), { target: { value: "tỷ" } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo metric" }));

    expect(onAddMetric).toHaveBeenCalledWith({
      label: "Dư nợ VIP",
      unit: "tỷ",
      product_id: "p1",
      placement: "normal",
      is_inverse: false,
    });
  });

  it("requires confirmation before deleting a metric", () => {
    const onDeleteMetric = vi.fn();
    render(
      <StructureDialog
        open
        mode="delete_metric"
        metric={{
          id: "m1",
          column_key: "du_no_vip",
          label: "Dư nợ VIP",
          unit: "tỷ",
          product_id: "p1",
          sub_product_id: null,
          placement: "normal",
          sort_order: 1,
          is_visible: true,
          is_percent: false,
          is_inverse: false,
        }}
        isSaving={false}
        onOpenChange={vi.fn()}
        onAddMetric={vi.fn()}
        onDeleteMetric={onDeleteMetric}
        onDeleteProduct={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Xóa metric" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Nhập mã xác nhận"), { target: { value: "du_no_vip" } });
    fireEvent.click(screen.getByRole("button", { name: "Xóa metric" }));

    expect(onDeleteMetric).toHaveBeenCalledWith({ metric_id: "m1", confirmation: "du_no_vip" });
  });
});
```

- [ ] **Step 2: Run UI tests and verify failure**

Run:

```powershell
npx vitest run tests/structure-ui.test.tsx
```

Expected: FAIL because components do not exist.

- [ ] **Step 3: Implement AddProductCard**

Create `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/components/AddProductCard.tsx`:

```tsx
import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function AddProductCard({
  onSubmit,
  isSaving,
}: {
  onSubmit: (payload: { name: string }) => void;
  isSaving: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const canSubmit = name.trim().length > 0 && !isSaving;

  return (
    <>
      <button
        type="button"
        aria-label="Thêm card sản phẩm"
        onClick={() => setOpen(true)}
        className="flex min-h-[312px] w-full items-center justify-center rounded-xl border border-dashed border-hairline bg-canvas-soft text-ink-mute transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <Plus size={18} />
          Add Card
        </span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-xl border border-hairline bg-canvas p-5">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!canSubmit) return;
              onSubmit({ name: name.trim() });
              setName("");
              setOpen(false);
            }}
          >
            <h2 className="text-lg font-medium text-ink">Thêm card sản phẩm</h2>
            <label className="block space-y-2 text-sm text-ink-mute">
              <span>Tên sản phẩm</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-sm border border-hairline px-4 py-2 text-sm text-ink">
                Hủy
              </button>
              <button type="submit" disabled={!canSubmit} className="rounded-sm border border-primary bg-primary px-4 py-2 text-sm text-on-primary disabled:opacity-50">
                Tạo card
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 4: Implement StructureDialog**

Create `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/components/StructureDialog.tsx` with add metric and delete metric/product modes. Keep it compact and controlled by props:

```tsx
import { useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { AddMetricPayload, DeleteMetricPayload, DeleteProductPayload } from "@/data/schema-admin";
import type { MetricDefinition, MetricPlacement, MetricUnit, ProductDefinition, SubProductDefinition } from "@/lib/product-metadata";

type Mode = "add_metric" | "delete_metric" | "delete_product";

type Props = {
  open: boolean;
  mode: Mode;
  product?: ProductDefinition;
  metric?: MetricDefinition;
  subProducts?: SubProductDefinition[];
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMetric: (payload: AddMetricPayload) => void;
  onDeleteMetric: (payload: DeleteMetricPayload) => void;
  onDeleteProduct: (payload: DeleteProductPayload) => void;
};

const units: MetricUnit[] = ["tỷ", "KH", "HĐ", "tài khoản", "%"];

export function StructureDialog(props: Props) {
  const [label, setLabel] = useState("");
  const [unit, setUnit] = useState<MetricUnit>("tỷ");
  const [placement, setPlacement] = useState<MetricPlacement>("normal");
  const [confirmation, setConfirmation] = useState("");
  const expectedConfirmation = props.metric?.column_key ?? props.product?.name ?? "";
  const canConfirmDelete = confirmation === expectedConfirmation && !props.isSaving;

  const title = useMemo(() => {
    if (props.mode === "add_metric") return `Thêm metric${props.product ? ` cho ${props.product.name}` : ""}`;
    if (props.mode === "delete_metric") return "Xóa metric";
    return "Xóa card sản phẩm";
  }, [props.mode, props.product]);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="rounded-xl border border-hairline bg-canvas p-5">
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-ink">{title}</h2>
          {props.mode === "add_metric" && props.product ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!label.trim()) return;
                props.onAddMetric({
                  label: label.trim(),
                  unit,
                  product_id: props.product.id,
                  placement,
                  is_inverse: false,
                });
              }}
            >
              <label className="block space-y-2 text-sm text-ink-mute">
                <span>Tên metric</span>
                <Input value={label} onChange={(event) => setLabel(event.target.value)} />
              </label>
              <label className="block space-y-2 text-sm text-ink-mute">
                <span>Vị trí</span>
                <select value={placement} onChange={(event) => setPlacement(event.target.value as MetricPlacement)} className="h-9 w-full rounded-sm border border-hairline bg-canvas px-3 text-ink">
                  <option value="headline">Headline</option>
                  <option value="normal">Normal data</option>
                  <option value="sub_product">Sub-product data</option>
                </select>
              </label>
              <label className="block space-y-2 text-sm text-ink-mute">
                <span>Đơn vị</span>
                <select value={unit} onChange={(event) => setUnit(event.target.value as MetricUnit)} className="h-9 w-full rounded-sm border border-hairline bg-canvas px-3 text-ink">
                  {units.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => props.onOpenChange(false)} className="rounded-sm border border-hairline px-4 py-2 text-sm text-ink">Hủy</button>
                <button type="submit" disabled={!label.trim() || props.isSaving} className="rounded-sm border border-primary bg-primary px-4 py-2 text-sm text-on-primary disabled:opacity-50">Tạo metric</button>
              </div>
            </form>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!canConfirmDelete) return;
                if (props.mode === "delete_metric" && props.metric) props.onDeleteMetric({ metric_id: props.metric.id, confirmation });
                if (props.mode === "delete_product" && props.product) props.onDeleteProduct({ product_id: props.product.id, confirmation });
              }}
            >
              <p className="text-sm text-ink-mute">Nhập <span className="font-number text-ink">{expectedConfirmation}</span> để xác nhận xóa.</p>
              <label className="block space-y-2 text-sm text-ink-mute">
                <span>Nhập mã xác nhận</span>
                <Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => props.onOpenChange(false)} className="rounded-sm border border-hairline px-4 py-2 text-sm text-ink">Hủy</button>
                <button type="submit" disabled={!canConfirmDelete} className="rounded-sm border border-status-down bg-status-down px-4 py-2 text-sm text-white disabled:opacity-50">
                  {props.mode === "delete_metric" ? "Xóa metric" : "Xóa card"}
                </button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: Wire Card and CardBack controls**

Modify `Card.tsx` so it accepts optional structure handlers:

```ts
type CardProps = {
  product: ProductCard;
  onFlip?: () => void;
  onAddMetric?: () => void;
  onDeleteProduct?: () => void;
};
```

Because the root is currently a `<button>`, convert it to a `<div role="button">` or move structure buttons outside the clickable flip target. Use separate icon buttons so clicking `+` or delete does not flip the card.

Add button cluster near the card title:

```tsx
<div className="flex items-center gap-1">
  <button type="button" aria-label={`Thêm metric cho ${product.name}`} onClick={(event) => { event.stopPropagation(); onAddMetric?.(); }} className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-hairline text-ink-mute hover:text-ink">
    <Plus size={14} />
  </button>
  <button type="button" aria-label={`Xóa card ${product.name}`} onClick={(event) => { event.stopPropagation(); onDeleteProduct?.(); }} className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-hairline text-ink-mute hover:text-status-down">
    <Trash2 size={14} />
  </button>
</div>
```

Modify `CardBack.tsx` to accept `onDeleteMetric?: (label: string) => void` or, after Task 6 passes metric IDs into cards, `onDeleteMetric?: (metricId: string) => void`. If metric IDs are not present in `SubMetric`, extend `SubMetric` in `src/lib/types.ts` with optional `metric_id?: string` and set it in `product-builder.ts`.

- [ ] **Step 6: Run UI tests and verify pass**

Run:

```powershell
npx vitest run tests/structure-ui.test.tsx tests/card.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit Task 7**

Run:

```powershell
git add src/components/AddProductCard.tsx src/components/StructureDialog.tsx src/components/Card.tsx src/components/CardBack.tsx src/components/Section.tsx src/lib/types.ts src/lib/product-builder.ts tests/structure-ui.test.tsx tests/card.test.tsx
git commit -m "T07: add in-place structure controls"
```

---

### Task 8: Edge Function

**Files:**
- Create: `supabase/functions/schema-admin/index.ts`

- [ ] **Step 1: Create Edge Function file**

Create `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/supabase/functions/schema-admin/index.ts`:

```ts
import { createClient } from "npm:@supabase/supabase-js@2";
import postgres from "npm:postgres@3.4.5";

const metricTables = ["daily_metrics", "weekly_metrics", "monthly_metrics"] as const;
const reservedColumns = new Set(["id", "ngay", "pushed_at"]);
const units = new Set(["tỷ", "KH", "HĐ", "tài khoản", "%"]);
const placements = new Set(["headline", "normal", "sub_product"]);

type Action = "add_product" | "add_metric" | "delete_metric" | "delete_product";
type Sql = ReturnType<typeof postgres>;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    },
  });
}

function slugify(input: string): string {
  const normalized = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || "metric";
}

function assertSafeIdentifier(identifier: string): void {
  if (!/^[a-z][a-z0-9_]{1,62}$/.test(identifier)) throw new Error("Invalid generated column key");
  if (reservedColumns.has(identifier)) throw new Error("Reserved column key");
}

function quoteIdent(identifier: string): string {
  assertSafeIdentifier(identifier);
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function columnExists(sql: Sql, columnKey: string): Promise<boolean> {
  const rows = await sql`
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('daily_metrics', 'weekly_metrics', 'monthly_metrics')
      and column_name = ${columnKey}
    limit 1
  `;
  return rows.length > 0;
}

async function addMetricColumn(sql: Sql, table: string, columnKey: string): Promise<void> {
  await sql.unsafe(`alter table public.${quoteIdent(table)} add column ${quoteIdent(columnKey)} numeric`);
}

async function dropMetricColumn(sql: Sql, table: string, columnKey: string): Promise<void> {
  await sql.unsafe(`alter table public.${quoteIdent(table)} drop column ${quoteIdent(columnKey)}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json(200, { ok: true });
  if (req.method !== "POST") return json(405, { ok: false, error: "Method not allowed" });

  try {
    const { action, payload } = (await req.json()) as { action: Action; payload: Record<string, unknown> };
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!supabaseUrl || !serviceRole || !dbUrl) throw new Error("Missing Supabase secrets");

    const admin = createClient(supabaseUrl, serviceRole);
    const sql = postgres(dbUrl, { max: 1, prepare: false });

    if (action === "add_product") {
      const name = String(payload.name ?? "").trim();
      if (!name) throw new Error("Product name is required");
      const key = slugify(name);
      const { data: existing } = await admin.from("products").select("id").eq("key", key).maybeSingle();
      if (existing) throw new Error("Product already exists");
      const { data: maxOrder } = await admin.from("products").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
      const { data, error } = await admin
        .from("products")
        .insert({ key, name, sort_order: Number(maxOrder?.sort_order ?? 0) + 1 })
        .select("*")
        .single();
      if (error) throw error;
      return json(200, { ok: true, result: data });
    }

    if (action === "add_metric") {
      const label = String(payload.label ?? "").trim();
      const unit = String(payload.unit ?? "");
      const placement = String(payload.placement ?? "");
      const productId = String(payload.product_id ?? "");
      if (!label) throw new Error("Metric label is required");
      if (!units.has(unit)) throw new Error("Unsupported unit");
      if (!placements.has(placement)) throw new Error("Unsupported placement");
      if (!productId) throw new Error("Product is required");

      const columnKey = slugify(label);
      assertSafeIdentifier(columnKey);
      if (await columnExists(sql, columnKey)) throw new Error("Column already exists");

      for (const table of metricTables) {
        await addMetricColumn(sql, table, columnKey);
      }

      const { data: maxOrder } = await admin
        .from("metric_definitions")
        .select("sort_order")
        .eq("product_id", productId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: metric, error } = await admin
        .from("metric_definitions")
        .insert({
          column_key: columnKey,
          label,
          unit,
          product_id: productId,
          sub_product_id: payload.sub_product_id ?? null,
          placement,
          sort_order: Number(maxOrder?.sort_order ?? 0) + 1,
          is_percent: unit === "%",
          is_inverse: Boolean(payload.is_inverse),
        })
        .select("*")
        .single();
      if (error) throw error;

      if (placement === "headline") {
        const { data: product } = await admin.from("products").select("headline_metric_id").eq("id", productId).single();
        if (product?.headline_metric_id) {
          await admin.from("metric_definitions").update({ placement: "normal" }).eq("id", product.headline_metric_id);
        }
        await admin.from("products").update({ headline_metric_id: metric.id }).eq("id", productId);
      }

      return json(200, { ok: true, result: metric });
    }

    if (action === "delete_metric") {
      const metricId = String(payload.metric_id ?? "");
      const confirmation = String(payload.confirmation ?? "");
      const { data: metric, error } = await admin.from("metric_definitions").select("*").eq("id", metricId).single();
      if (error) throw error;
      if (confirmation !== metric.column_key) throw new Error("Confirmation mismatch");
      assertSafeIdentifier(metric.column_key);

      for (const table of metricTables) {
        await dropMetricColumn(sql, table, metric.column_key);
      }

      await admin.from("products").update({ headline_metric_id: null }).eq("headline_metric_id", metricId);
      await admin.from("metric_definitions").delete().eq("id", metricId);
      return json(200, { ok: true, result: { metric_id: metricId } });
    }

    if (action === "delete_product") {
      const productId = String(payload.product_id ?? "");
      const confirmation = String(payload.confirmation ?? "");
      const { data: product, error } = await admin.from("products").select("*").eq("id", productId).single();
      if (error) throw error;
      if (confirmation !== product.name) throw new Error("Confirmation mismatch");
      const { count } = await admin.from("metric_definitions").select("id", { count: "exact", head: true }).eq("product_id", productId);
      if ((count ?? 0) > 0) throw new Error("Delete metrics before deleting product");
      await admin.from("products").delete().eq("id", productId);
      return json(200, { ok: true, result: { product_id: productId } });
    }

    return json(400, { ok: false, error: "Unknown action" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Schema admin failed";
    return json(400, { ok: false, error: message });
  }
});
```

- [ ] **Step 2: Verify Deno type issues locally**

Run:

```powershell
supabase functions serve schema-admin --env-file supabase/functions/.env.local
```

Expected: function starts. The function uses `SUPABASE_DB_URL` with the `postgres` client for DDL and `SUPABASE_SERVICE_ROLE_KEY` only inside the Edge Function for metadata writes.

- [ ] **Step 3: Commit Task 8**

Run:

```powershell
git add supabase/functions/schema-admin/index.ts
git commit -m "T08: add schema admin edge function"
```

---

### Task 9: Wire Schema Actions Into Section

**Files:**
- Modify: `src/components/Section.tsx`
- Modify: `tests/crud-flow.test.tsx`
- Modify: `tests/structure-ui.test.tsx`

- [ ] **Step 1: Add tests for action callbacks**

In `tests/crud-flow.test.tsx`, mock schema admin:

```ts
const schemaAdminMocks = vi.hoisted(() => ({
  addProduct: vi.fn(),
  addMetric: vi.fn(),
  deleteMetric: vi.fn(),
  deleteProduct: vi.fn(),
}));

vi.mock("@/data/schema-admin", () => schemaAdminMocks);
```

Add a test:

```tsx
it("invalidates metadata after adding a product", async () => {
  schemaAdminMocks.addProduct.mockResolvedValue({ id: "p2", key: "vip", name: "VIP" });
  renderSection();
  fireEvent.click(screen.getByRole("button", { name: "Thêm card sản phẩm" }));
  fireEvent.change(screen.getByLabelText("Tên sản phẩm"), { target: { value: "VIP" } });
  fireEvent.click(screen.getByRole("button", { name: "Tạo card" }));

  await act(async () => {
    await Promise.resolve();
  });

  expect(schemaAdminMocks.addProduct).toHaveBeenCalledWith({ name: "VIP" });
});
```

- [ ] **Step 2: Run test and verify failure**

Run:

```powershell
npx vitest run tests/crud-flow.test.tsx
```

Expected: FAIL until Section wires the add-card flow.

- [ ] **Step 3: Add schema action state and handlers in Section**

Modify `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/components/Section.tsx`.

Import:

```ts
import { AddProductCard } from "@/components/AddProductCard";
import { StructureDialog } from "@/components/StructureDialog";
import { addMetric, addProduct, deleteMetric, deleteProduct, type AddMetricPayload, type DeleteMetricPayload, type DeleteProductPayload } from "@/data/schema-admin";
```

Add local state:

```ts
  const [structureSaving, setStructureSaving] = useState(false);
  const [metricDialogProductId, setMetricDialogProductId] = useState<string | null>(null);
```

Add helper:

```ts
  const refreshStructure = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [mode] }),
      queryClient.invalidateQueries({ queryKey: PRODUCT_METADATA_QUERY_KEY }),
    ]);
  };
```

Add handlers:

```ts
  const handleAddProduct = async (payload: { name: string }) => {
    setStructureSaving(true);
    try {
      await addProduct(payload);
      await refreshStructure();
      toastSaved();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Không tạo được card");
    } finally {
      setStructureSaving(false);
    }
  };

  const handleAddMetric = async (payload: AddMetricPayload) => {
    setStructureSaving(true);
    try {
      await addMetric(payload);
      await refreshStructure();
      setMetricDialogProductId(null);
      toastSaved();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Không tạo được metric");
    } finally {
      setStructureSaving(false);
    }
  };
```

Render `AddProductCard` after cards in `SectionBody`, or pass it as a render prop from `SectionWithEditor`. Keep the add tile in the grid end position.

- [ ] **Step 4: Run all targeted UI/action tests**

Run:

```powershell
npx vitest run tests/crud-flow.test.tsx tests/section.test.tsx tests/structure-ui.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit Task 9**

Run:

```powershell
git add src/components/Section.tsx tests/crud-flow.test.tsx tests/structure-ui.test.tsx
git commit -m "T09: wire schema actions into dashboard"
```

---

### Task 10: Verification And Cleanup

**Files:**
- Modify: `src/lib/product-builder.ts` if typecheck finds metadata/card mapping issues.
- Modify: `src/components/DataGrid.tsx` if typecheck or grid tests find dynamic field issues.
- Modify: `src/components/Section.tsx` if query invalidation or action wiring tests fail.
- Modify: `supabase/functions/schema-admin/index.ts` if local function serving reports Deno or dependency errors.

- [ ] **Step 1: Run typecheck**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 2: Run tests**

Run:

```powershell
npm run test
```

Expected: PASS.

- [ ] **Step 3: Run lint**

Run:

```powershell
npm run lint
```

Expected: PASS.

- [ ] **Step 4: Run build**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 5: Manual Supabase smoke check**

In a development Supabase project:

1. Run `supabase/schema/product_metadata_schema.sql`.
2. Deploy or serve `schema-admin`.
3. Open the app.
4. Add a product card named `Smoke Product`.
5. Add a normal metric named `Smoke Metric` with unit `KH`.
6. Confirm column `smoke_metric` exists in `daily_metrics`, `weekly_metrics`, and `monthly_metrics`.
7. Delete `Smoke Metric`.
8. Confirm column `smoke_metric` is absent from all three metric tables.
9. Delete `Smoke Product`.

- [ ] **Step 6: Commit verification fixes only when files changed**

If verification required fixes in `src/lib/product-builder.ts` and `src/components/Section.tsx`, run:

```powershell
git add src/lib/product-builder.ts src/components/Section.tsx
git commit -m "T10: stabilize product metadata schema flow"
```

If verification required fixes in different files, stage exactly those changed files with explicit paths. If no fixes were required, do not create an empty commit.

---

## Self-Review Checklist

- Spec coverage: metadata tables, Edge Function boundary, add product, add metric, delete metric, delete empty product, dynamic card rendering, dynamic grid rendering, and confirmation flows are covered.
- Deferred features are excluded from implementation tasks: hide/show, rename, reorder, moving existing metrics, non-numeric columns, normalized value storage, cascade product delete.
- Risk called out: Edge Function DDL uses `SUPABASE_DB_URL` with a server-side Postgres client and must be smoke-tested against a development Supabase project before production use.
