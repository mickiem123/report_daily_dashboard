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
  hasSupabaseEnv: true,
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
          label: "Thi Phan HOSE",
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
