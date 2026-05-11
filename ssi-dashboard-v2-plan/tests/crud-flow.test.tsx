import { act, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Section } from "@/components/Section";
import { sampleDailyRows } from "@/fixtures/sample-rows";

const queryMocks = vi.hoisted(() => ({
  useDaily: vi.fn(),
  useWeekly: vi.fn(),
  useMonthly: vi.fn(),
}));

const mutationMocks = vi.hoisted(() => ({
  upsertRow: vi.fn(),
  deleteRow: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  toastSaved: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/data/queries", () => queryMocks);
vi.mock("@/data/mutations", () => mutationMocks);
vi.mock("@/components/Toast", () => ({
  useToastHelpers: () => ({
    toastSaved: toastMocks.toastSaved,
    toastError: toastMocks.toastError,
  }),
}));
vi.mock("@/lib/use-first-mount", () => ({ useFirstMount: () => false }));
vi.mock("@/lib/use-count-up", () => ({ useCountUp: (value: string) => value }));
vi.mock("@/components/DataGrid", () => ({
  DataGrid: ({
    onCellEdit,
    onAddRow,
    onSaveChanges,
    onDeleteRow,
  }: {
    onCellEdit: (ngay: string, field: string, newValue: number | string | null) => void;
    onAddRow: () => void;
    onSaveChanges: () => void;
    onDeleteRow: (ngay: string) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onCellEdit("2026-04-08", "gtgd_cs_ssi", 5000)}>
        edit-success
      </button>
      <button type="button" onClick={() => onCellEdit("2026-04-08", "gtgd_cs_ssi", 5100)}>
        edit-rapid
      </button>
      <button type="button" onClick={() => onCellEdit("", "ngay", "2026-05-09")}>
        new-date
      </button>
      <button type="button" onClick={() => onCellEdit("", "gtgd_cs_ssi", 5300)}>
        new-value
      </button>
      <button type="button" onClick={onAddRow}>
        add-row
      </button>
      <button type="button" onClick={onSaveChanges}>
        save-changes
      </button>
      <button type="button" onClick={() => onDeleteRow("2026-04-08")}>
        delete-row
      </button>
    </div>
  ),
}));

const makeQuery = (overrides: Record<string, unknown> = {}) => ({
  data: sampleDailyRows,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
  ...overrides,
});

function renderSection() {
  const queryClient = new QueryClient();
  const result = render(
    <QueryClientProvider client={queryClient}>
      <Section mode="daily" />
    </QueryClientProvider>
  );
  fireEvent.click(screen.getByRole("button", { name: "Nhập liệu" }));
  return result;
}

describe("CRUD flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    queryMocks.useDaily.mockReturnValue(makeQuery());
    queryMocks.useWeekly.mockReturnValue(makeQuery({ data: [] }));
    queryMocks.useMonthly.mockReturnValue(makeQuery({ data: [] }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stages edit and saves only when save action is clicked", async () => {
    mutationMocks.upsertRow.mockResolvedValue(undefined);
    renderSection();
    fireEvent.click(screen.getByText("edit-success"));
    expect(mutationMocks.upsertRow).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("save-changes"));
    await act(async () => {
      await Promise.resolve();
    });

    expect(mutationMocks.upsertRow).toHaveBeenCalledWith("daily", { ngay: "2026-04-08", gtgd_cs_ssi: 5000 });
    expect(toastMocks.toastSaved).toHaveBeenCalledTimes(1);
  });

  it("calls toastError when upsert fails", async () => {
    mutationMocks.upsertRow.mockRejectedValue(new Error("Boom"));
    renderSection();
    fireEvent.click(screen.getByText("edit-success"));
    fireEvent.click(screen.getByText("save-changes"));

    await act(async () => {
      await Promise.resolve();
    });

    expect(toastMocks.toastError).toHaveBeenCalledWith("Boom");
  });

  it("calls deleteRow with mode and ngay", async () => {
    mutationMocks.deleteRow.mockResolvedValue(undefined);
    renderSection();
    fireEvent.click(screen.getByText("delete-row"));
    await act(async () => {
      await Promise.resolve();
    });
    expect(mutationMocks.deleteRow).toHaveBeenCalledWith("daily", "2026-04-08");
  });

  it("coalesces rapid edits to one upsert call on save", async () => {
    mutationMocks.upsertRow.mockResolvedValue(undefined);
    renderSection();
    fireEvent.click(screen.getByText("edit-success"));
    fireEvent.click(screen.getByText("edit-rapid"));
    fireEvent.click(screen.getByText("save-changes"));

    await act(async () => {
      await Promise.resolve();
    });

    expect(mutationMocks.upsertRow).toHaveBeenCalledTimes(1);
    expect(mutationMocks.upsertRow).toHaveBeenCalledWith("daily", { ngay: "2026-04-08", gtgd_cs_ssi: 5100 });
  });

  it("adds a new row via upsert path when save is clicked", async () => {
    mutationMocks.upsertRow.mockResolvedValue(undefined);
    renderSection();
    fireEvent.click(screen.getByText("new-date"));
    fireEvent.click(screen.getByText("new-value"));
    fireEvent.click(screen.getByText("add-row"));
    fireEvent.click(screen.getByText("save-changes"));

    await act(async () => {
      await Promise.resolve();
    });

    expect(mutationMocks.upsertRow).toHaveBeenCalledWith("daily", { ngay: "2026-05-09", gtgd_cs_ssi: 5300 });
  });

  it("does not save before explicit save action", async () => {
    mutationMocks.upsertRow.mockResolvedValue(undefined);
    renderSection();
    fireEvent.click(screen.getByText("new-date"));

    await act(async () => {
      await Promise.resolve();
    });

    expect(mutationMocks.upsertRow).not.toHaveBeenCalled();
  });
});
