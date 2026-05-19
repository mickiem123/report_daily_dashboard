import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { sampleProductMetadata } from "@/fixtures/product-metadata";
import { hasSupabaseEnv, supabase } from "@/data/supabase";
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
  if (!hasSupabaseEnv) {
    return sampleProductMetadata;
  }

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
