import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement } from "react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { deleteRow, upsertRow } from "@/data/mutations";
import { useDaily, useMonthly, useWeekly } from "@/data/queries";

const { fromMock, supabaseMock } = vi.hoisted(() => {
  const from = vi.fn();
  return { fromMock: from, supabaseMock: { from } };
});

vi.mock("@/data/supabase", () => ({
  hasSupabaseEnv: true,
  supabase: supabaseMock,
}));

const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: ReactNode }) => (
    createElement(QueryClientProvider, { client: queryClient }, children)
  );
};

describe("data layer smoke", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("routes upsertRow by mode", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ upsert });

    await upsertRow("daily", { ngay: "2026-05-09" });
    await upsertRow("weekly", { ngay: "2026-05-09" });
    await upsertRow("monthly", { ngay: "2026-05-09" });

    expect(fromMock).toHaveBeenNthCalledWith(1, "daily_metrics");
    expect(fromMock).toHaveBeenNthCalledWith(2, "weekly_metrics");
    expect(fromMock).toHaveBeenNthCalledWith(3, "monthly_metrics");
  });

  it("routes deleteRow by mode", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const deleteFn = vi.fn().mockReturnValue({ eq });
    fromMock.mockReturnValue({ delete: deleteFn });

    await deleteRow("daily", "2026-05-09");
    await deleteRow("weekly", "2026-05-09");
    await deleteRow("monthly", "2026-05-09");

    expect(fromMock).toHaveBeenNthCalledWith(1, "daily_metrics");
    expect(fromMock).toHaveBeenNthCalledWith(2, "weekly_metrics");
    expect(fromMock).toHaveBeenNthCalledWith(3, "monthly_metrics");
  });

  it("useDaily fetches, keys, and returns ascending rows after reverse", async () => {
    const limit = vi.fn().mockResolvedValue({
      data: [{ ngay: "2026-05-09" }, { ngay: "2026-05-08" }],
      error: null,
    });
    const order = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ order });
    fromMock.mockReturnValue({ select });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useDaily(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fromMock).toHaveBeenCalledWith("daily_metrics");
    expect(select).toHaveBeenCalledWith("*");
    expect(order).toHaveBeenCalledWith("ngay", { ascending: false });
    expect(limit).toHaveBeenCalledWith(22);
    expect(result.current.data?.map((row) => row.ngay)).toEqual(["2026-05-08", "2026-05-09"]);
    expect(queryClient.getQueryData(["daily"])).toBeDefined();
  });

  it("useWeekly and useMonthly route to the right tables", async () => {
    const limit = vi.fn().mockResolvedValue({ data: [], error: null });
    const order = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ order });
    fromMock.mockReturnValue({ select });

    const weeklyClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const weekly = renderHook(() => useWeekly(), { wrapper: createWrapper(weeklyClient) });
    await waitFor(() => expect(weekly.result.current.isSuccess).toBe(true));
    expect(fromMock).toHaveBeenLastCalledWith("weekly_metrics");

    const monthlyClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const monthly = renderHook(() => useMonthly(), { wrapper: createWrapper(monthlyClient) });
    await waitFor(() => expect(monthly.result.current.isSuccess).toBe(true));
    expect(fromMock).toHaveBeenLastCalledWith("monthly_metrics");
  });
});
