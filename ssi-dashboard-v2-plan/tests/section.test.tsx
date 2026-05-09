import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Section } from "@/components/Section";
import { sampleDailyRows } from "@/fixtures/sample-rows";

const queryMocks = vi.hoisted(() => ({
  useDaily: vi.fn(),
  useWeekly: vi.fn(),
  useMonthly: vi.fn(),
}));

const mountMocks = vi.hoisted(() => ({
  useFirstMount: vi.fn(),
}));

const countUpMocks = vi.hoisted(() => ({
  useCountUp: vi.fn((value: string) => value),
}));

vi.mock("@/data/queries", () => queryMocks);
vi.mock("@/lib/use-first-mount", () => mountMocks);
vi.mock("@/lib/use-count-up", () => countUpMocks);

const makeQuery = (overrides: Record<string, unknown> = {}) => ({
  data: sampleDailyRows,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
  ...overrides,
});

function renderSection(mode: "daily" | "weekly" | "monthly" = "daily") {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <Section mode={mode} />
    </QueryClientProvider>
  );
}

describe("Section", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    countUpMocks.useCountUp.mockImplementation((value: string) => value);
  });

  it("renders 6 cards on populated data", () => {
    queryMocks.useDaily.mockReturnValue(makeQuery());
    queryMocks.useWeekly.mockReturnValue(makeQuery({ data: [] }));
    queryMocks.useMonthly.mockReturnValue(makeQuery({ data: [] }));
    mountMocks.useFirstMount.mockReturnValue(false);

    renderSection();
    expect(screen.getAllByTestId("section-card")).toHaveLength(6);
  });

  it("renders loading skeleton placeholders", () => {
    queryMocks.useDaily.mockReturnValue(makeQuery({ isLoading: true, data: undefined }));
    mountMocks.useFirstMount.mockReturnValue(false);

    renderSection();
    expect(screen.getAllByTestId("section-skeleton")).toHaveLength(6);
  });

  it("renders error state and retry button", () => {
    const refetch = vi.fn();
    queryMocks.useDaily.mockReturnValue(makeQuery({ isError: true, refetch }));
    mountMocks.useFirstMount.mockReturnValue(false);

    renderSection();
    expect(screen.getByText("Lỗi tải dữ liệu")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("renders empty state", () => {
    queryMocks.useDaily.mockReturnValue(makeQuery({ data: [] }));
    mountMocks.useFirstMount.mockReturnValue(false);

    renderSection();
    expect(screen.getByText("Chưa có dữ liệu")).toBeInTheDocument();
  });

  it("applies stagger class only on first mount render", () => {
    queryMocks.useDaily.mockReturnValue(makeQuery());
    mountMocks.useFirstMount.mockReturnValueOnce(true).mockReturnValueOnce(false);

    const first = renderSection();
    expect(first.getAllByTestId("section-card")[0]).toHaveClass("section-card-stagger");
    first.unmount();

    const second = renderSection();
    expect(second.getAllByTestId("section-card")[0]).not.toHaveClass("section-card-stagger");
  });

  it("disables stagger and count-up when reduced motion is enabled", () => {
    const originalMatchMedia = window.matchMedia;
    try {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as typeof window.matchMedia;

      queryMocks.useDaily.mockReturnValue(makeQuery());
      mountMocks.useFirstMount.mockReturnValue(true);

      renderSection();
      expect(screen.getAllByTestId("section-card")[0]).not.toHaveClass("section-card-stagger");
      expect(countUpMocks.useCountUp).toHaveBeenCalled();
      expect(countUpMocks.useCountUp.mock.calls[0][1]).toBe(false);
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
