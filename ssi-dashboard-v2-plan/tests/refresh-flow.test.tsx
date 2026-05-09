import { act, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RefreshButton } from "@/components/SectionHeader";
import { useAutoStaleRefresh } from "@/lib/use-auto-stale-refresh";

function renderWithClient(node: ReactNode, queryClient: QueryClient) {
  return render(<QueryClientProvider client={queryClient}>{node}</QueryClientProvider>);
}

function AutoStaleHarness({ enabled }: { enabled: boolean }) {
  useAutoStaleRefresh(enabled);
  return null;
}

describe("refresh flow", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
        clear: () => {
          store.clear();
        },
      },
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T10:00:00.000Z"));
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shows confirm dialog on refresh click", () => {
    const queryClient = new QueryClient();
    renderWithClient(<RefreshButton mode="daily" />, queryClient);
    fireEvent.click(screen.getByRole("button", { name: "↻ Tải lại" }));
    expect(screen.getByText("Xác nhận tải lại")).toBeInTheDocument();
    expect(screen.getByText("Tải lại dữ liệu ngày?")).toBeInTheDocument();
  });

  it("invalidates mode query on confirm", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
    renderWithClient(<RefreshButton mode="weekly" />, queryClient);
    fireEvent.click(screen.getByRole("button", { name: "↻ Tải lại" }));
    fireEvent.click(screen.getByRole("button", { name: "Tải lại" }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["weekly"] });
  });

  it("keeps refresh button disabled for 5 seconds", async () => {
    const queryClient = new QueryClient();
    vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
    renderWithClient(<RefreshButton mode="monthly" />, queryClient);
    const refreshButton = screen.getByRole("button", { name: "↻ Tải lại" });
    fireEvent.click(refreshButton);
    fireEvent.click(screen.getByRole("button", { name: "Tải lại" }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(refreshButton).toBeDisabled();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(refreshButton).toBeEnabled();
  });

  it("does not auto-invalidate when date is already today", async () => {
    localStorage.setItem("ssi-last-refresh-date", "2026-05-09");
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
    renderWithClient(<AutoStaleHarness enabled={true} />, queryClient);
    await act(async () => {
      await Promise.resolve();
    });
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("auto-invalidates all modes when day changes and only after unlock", async () => {
    localStorage.setItem("ssi-last-refresh-date", "2026-05-08");
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
    const view = renderWithClient(<AutoStaleHarness enabled={false} />, queryClient);
    expect(invalidateSpy).not.toHaveBeenCalled();
    view.rerender(
      <QueryClientProvider client={queryClient}>
        <AutoStaleHarness enabled={true} />
      </QueryClientProvider>
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["daily"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["weekly"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["monthly"] });
    expect(invalidateSpy).toHaveBeenCalledTimes(3);
    expect(localStorage.getItem("ssi-last-refresh-date")).toBe("2026-05-09");
  });
});
