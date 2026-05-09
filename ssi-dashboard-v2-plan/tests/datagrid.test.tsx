import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataGrid } from "@/components/DataGrid";
import { sampleDailyRows } from "@/fixtures/sample-rows";

const makeRows = () => sampleDailyRows.slice(0, 5);

describe("DataGrid", () => {
  it("renders rows plus one blank add row", () => {
    render(<DataGrid mode="daily" rows={makeRows()} onCellEdit={vi.fn()} onAddRow={vi.fn()} onDeleteRow={vi.fn()} />);
    const body = screen.getAllByRole("rowgroup")[1];
    expect(within(body).getAllByRole("row")).toHaveLength(6);
  });

  it("edits numeric cell and calls onCellEdit with parsed number", () => {
    const onCellEdit = vi.fn();
    render(<DataGrid mode="daily" rows={makeRows()} onCellEdit={onCellEdit} onAddRow={vi.fn()} onDeleteRow={vi.fn()} />);
    fireEvent.change(screen.getByTestId("cell-2026-04-08-gtgd_cs_ssi"), { target: { value: "4900" } });
    fireEvent.blur(screen.getByTestId("cell-2026-04-08-gtgd_cs_ssi"));
    expect(onCellEdit).toHaveBeenCalledWith("2026-04-08", "gtgd_cs_ssi", 4900);
  });

  it("reverts invalid numeric value and does not call onCellEdit", () => {
    const onCellEdit = vi.fn();
    render(<DataGrid mode="daily" rows={makeRows()} onCellEdit={onCellEdit} onAddRow={vi.fn()} onDeleteRow={vi.fn()} />);
    fireEvent.change(screen.getByTestId("cell-2026-04-08-gtgd_cs_ssi"), { target: { value: "abc" } });
    fireEvent.blur(screen.getByTestId("cell-2026-04-08-gtgd_cs_ssi"));
    expect(onCellEdit).not.toHaveBeenCalled();
    expect(screen.getByTestId("cell-2026-04-08-gtgd_cs_ssi")).toHaveValue("4800");
  });

  it("converts percent display value to stored fraction", () => {
    const onCellEdit = vi.fn();
    render(<DataGrid mode="daily" rows={makeRows()} onCellEdit={onCellEdit} onAddRow={vi.fn()} onDeleteRow={vi.fn()} />);
    fireEvent.change(screen.getByTestId("cell-2026-04-08-thi_phan_co_so"), { target: { value: "8.52" } });
    fireEvent.blur(screen.getByTestId("cell-2026-04-08-thi_phan_co_so"));
    expect(onCellEdit).toHaveBeenCalledWith("2026-04-08", "thi_phan_co_so", 0.0852);
  });

  it("marks outlier severity on cell", () => {
    render(<DataGrid mode="daily" rows={makeRows()} onCellEdit={vi.fn()} onAddRow={vi.fn()} onDeleteRow={vi.fn()} />);
    fireEvent.change(screen.getByTestId("cell-2026-04-08-gtgd_cs_ssi"), { target: { value: "9999999" } });
    fireEvent.blur(screen.getByTestId("cell-2026-04-08-gtgd_cs_ssi"));
    expect(screen.getByTestId("cell-2026-04-08-gtgd_cs_ssi")).toHaveAttribute("data-severity", "outlier");
  });

  it("opens delete confirm dialog", () => {
    render(<DataGrid mode="daily" rows={makeRows()} onCellEdit={vi.fn()} onAddRow={vi.fn()} onDeleteRow={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Xóa dòng 2026-04-08" }));
    expect(screen.getByText("Xác nhận xóa dòng 2026-04-08?")).toBeInTheDocument();
  });
});
