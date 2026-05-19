import { createClient } from "npm:@supabase/supabase-js@2";
import postgres from "npm:postgres@3.4.5";

const metricTables = ["daily_metrics", "weekly_metrics", "monthly_metrics"] as const;
const reservedColumns = new Set(["id", "ngay", "pushed_at"]);
const units = new Set(["tỷ", "KH", "HĐ", "tài khoản", "%"]);
const placements = new Set(["headline", "normal", "sub_product"]);

type Action = "add_product" | "add_metric" | "delete_metric" | "delete_product";
type Sql = ReturnType<typeof postgres>;

type SchemaRequest = {
  action?: Action;
  payload?: Record<string, unknown>;
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
      "access-control-allow-methods": "POST, OPTIONS",
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
  if (!/^[a-z][a-z0-9_]{1,62}$/.test(identifier)) {
    throw new Error("Invalid generated column key");
  }

  if (reservedColumns.has(identifier)) {
    throw new Error("Reserved column key");
  }
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

  let sql: Sql | null = null;

  try {
    const { action, payload = {} } = (await req.json()) as SchemaRequest;
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");

    if (!supabaseUrl || !serviceRole || !dbUrl) {
      throw new Error("Missing Supabase secrets");
    }

    const admin = createClient(supabaseUrl, serviceRole);
    sql = postgres(dbUrl, { max: 1, prepare: false });

    if (action === "add_product") {
      const name = String(payload.name ?? "").trim();
      if (!name) throw new Error("Product name is required");

      const key = slugify(name);
      const { data: existing } = await admin.from("products").select("id").eq("key", key).maybeSingle();
      if (existing) throw new Error("Product already exists");

      const { data: maxOrder } = await admin
        .from("products")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

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

      const { count } = await admin
        .from("metric_definitions")
        .select("id", { count: "exact", head: true })
        .eq("product_id", productId);
      if ((count ?? 0) > 0) throw new Error("Delete metrics before deleting product");

      await admin.from("products").delete().eq("id", productId);

      return json(200, { ok: true, result: { product_id: productId } });
    }

    return json(400, { ok: false, error: "Unknown action" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Schema admin failed";
    return json(400, { ok: false, error: message });
  } finally {
    await sql?.end({ timeout: 1 });
  }
});
