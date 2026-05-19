import { supabase } from "@/data/supabase";
import type { MetricPlacement, MetricUnit } from "@/lib/product-metadata";

export type AddProductPayload = {
  name: string;
};

export type AddMetricPayload = {
  label: string;
  unit: MetricUnit;
  product_id: string;
  placement: MetricPlacement;
  sub_product_id?: string | null;
  is_inverse?: boolean;
};

export type DeleteMetricPayload = {
  metric_id: string;
  confirmation: string;
};

export type DeleteProductPayload = {
  product_id: string;
  confirmation: string;
};

type SchemaAdminAction = "add_product" | "add_metric" | "delete_metric" | "delete_product";

type FunctionError = Error & {
  context?: Response;
};

async function normalizeFunctionError(error: unknown): Promise<Error> {
  const response = (error as FunctionError).context;
  if (response instanceof Response) {
    try {
      const body = (await response.clone().json()) as { error?: unknown; message?: unknown; code?: unknown };
      const message = typeof body.error === "string" ? body.error : typeof body.message === "string" ? body.message : null;
      if (message) {
        return new Error(typeof body.code === "string" ? `${body.code}: ${message}` : message);
      }
    } catch {
      const text = await response.clone().text();
      if (text) return new Error(text);
    }
  }

  return error instanceof Error ? error : new Error("Schema admin failed");
}

async function invokeSchemaAdmin<TPayload, TResult>(action: SchemaAdminAction, payload: TPayload): Promise<TResult> {
  const { data, error } = await supabase.functions.invoke("schema-admin", {
    body: { action, payload },
  });

  if (error) throw await normalizeFunctionError(error);
  if (data && typeof data === "object" && "ok" in data && data.ok === false) {
    throw new Error(typeof data.error === "string" ? data.error : "Schema admin failed");
  }

  return (data?.result ?? data) as TResult;
}

export const addProduct = (payload: AddProductPayload) => invokeSchemaAdmin<AddProductPayload, unknown>("add_product", payload);

export const addMetric = (payload: AddMetricPayload) => invokeSchemaAdmin<AddMetricPayload, unknown>("add_metric", payload);

export const deleteMetric = (payload: DeleteMetricPayload) =>
  invokeSchemaAdmin<DeleteMetricPayload, unknown>("delete_metric", payload);

export const deleteProduct = (payload: DeleteProductPayload) =>
  invokeSchemaAdmin<DeleteProductPayload, unknown>("delete_product", payload);
