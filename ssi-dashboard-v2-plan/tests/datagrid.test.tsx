import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataGrid } from "@/components/DataGrid";
import { sampleDailyRows } from "@/fixtures/sample-rows";

const makeRows = () => sampleDailyRows.slice(0, 5);
const defaultProps = {
  onSaveChanges: vi.fn(),
  hasPendingChanges: false,
  isSaving: false,
};

describe("DataGrid", () => {
  it("renders rows plus one blank add row", () => {
    render(<DataGrid mode="daily" rows={makeRows()} onCellEdit={vi.fn()} onAddRow={vi.fn()} onDeleteRow={vi.fn()} {...defaultProps} />);
    const body = screen.getAllByRole("rowgroup")[1];
    expect(within(body).getAllByRole("row")).toHaveLength(6);
  });

  it("edits numeric cell and calls onCellEdit with parsed number", () => {
    const onCellEdit = vi.fn();
    render(<DataGrid mode="daily" rows={makeRows()} onCellEdit={onCellEdit} onAddRow={vi.fn()} onDeleteRow={vi.fn()} {...defaultProps} />);
    fireEvent.change(screen.getByTestId("cell-2026-04-08-gtgd_cs_ssi"), { target: { value: "4900" } });
    fireEvent.blur(screen.getByTestId("cell-2026-04-08-gtgd_cs_ssi"));
    expect(onCellEdit).toHaveBeenCalledWith("2026-04-08", "gtgd_cs_ssi", 4900);
  });

  it("reverts invalid numeric value and does not call onCellEdit", () => {
    const onCellEdit = vi.fn();
    render(<DataGrid mode="daily" rows={makeRows()} onCellEdit={onCellEdit} onAddRow={vi.fn()} onDeleteRow={vi.fn()} {...defaultProps} />);
    fireEvent.change(screen.getByTestId("cell-2026-04-08-gtgd_cs_ssi"), { target: { value: "abc" } });
    fireEvent.blur(screen.getByTestId("cell-2026-04-08-gtgd_cs_ssi"));
    expect(onCellEdit).not.toHaveBeenCalled();
    expect(screen.getByTestId("cell-2026-04-08-gtgd_cs_ssi")).toHaveValue("4800");
  });

  it("converts percent display value to stored fraction", () => {
    const onCellEdit = vi.fn();
    render(<DataGrid mode="daily" rows={makeRows()} onCellEdit={onCellEdit} onAddRow={vi.fn()} onDeleteRow={vi.fn()} {...defaultProps} />);
    expect(screen.getByTestId("cell-2026-04-08-thi_phan_co_so")).toHaveValue("8.1");
    fireEvent.change(screen.getByTestId("cell-2026-04-08-thi_phan_co_so"), { target: { value: "8.52" } });
    fireEvent.blur(screen.getByTestId("cell-2026-04-08-thi_phan_co_so"));
    expect(onCellEdit).toHaveBeenCalledWith("2026-04-08", "thi_phan_co_so", 0.0852);
  });

  it("uses readable spreadsheet sizing and sticky navigation classes", () => {
    render(<DataGrid mode="daily" rows={makeRows()} onCellEdit={vi.fn()} onAddRow={vi.fn()} onDeleteRow={vi.fn()} {...defaultProps} />);

    expect(screen.getByTestId("data-grid-scroll")).toHaveClass("overflow-auto", "rounded-xl", "bg-canvas", "border-hairline");
    expect(screen.getByRole("columnheader", { name: "Ngày" })).toHaveClass("sticky", "left-0", "min-w-[150px]");
    expect(screen.getByRole("columnheader", { name: "Thị Phần HOSE" })).toHaveClass("min-w-[96px]");
    expect(screen.getByRole("columnheader", { name: "GTGD Cơ Sở SSI" })).toHaveClass("min-w-36");
    expect(screen.getByRole("button", { name: "Xóa dòng 2026-04-08" }).closest("td")).toHaveClass("sticky", "right-0");
  });

  it("right-aligns numeric cells with shared number font", () => {
    render(<DataGrid mode="daily" rows={makeRows()} onCellEdit={vi.fn()} onAddRow={vi.fn()} onDeleteRow={vi.fn()} {...defaultProps} />);
    expect(screen.getByTestId("cell-2026-04-08-gtgd_cs_ssi")).toHaveClass("text-right", "font-number");
    expect(screen.getByTestId("cell-2026-04-08-ngay")).toHaveClass("text-left");
  });

  it("marks outlier severity on cell", () => {
    render(<DataGrid mode="daily" rows={makeRows()} onCellEdit={vi.fn()} onAddRow={vi.fn()} onDeleteRow={vi.fn()} {...defaultProps} />);
    fireEvent.change(screen.getByTestId("cell-2026-04-08-gtgd_cs_ssi"), { target: { value: "9999999" } });
    fireEvent.blur(screen.getByTestId("cell-2026-04-08-gtgd_cs_ssi"));
    expect(screen.getByTestId("cell-2026-04-08-gtgd_cs_ssi")).toHaveAttribute("data-severity", "outlier");
  });

  it("opens delete confirm dialog", () => {
    render(<DataGrid mode="daily" rows={makeRows()} onCellEdit={vi.fn()} onAddRow={vi.fn()} onDeleteRow={vi.fn()} {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Xóa dòng 2026-04-08" }));
    expect(screen.getByText("Xác nhận xóa dòng 2026-04-08?")).toBeInTheDocument();
  });

  it("enables explicit add-row action after date and numeric draft", () => {
    const onAddRow = vi.fn();
    render(<DataGrid mode="daily" rows={makeRows()} onCellEdit={vi.fn()} onAddRow={onAddRow} onDeleteRow={vi.fn()} {...defaultProps} />);
    const addButton = screen.getByRole("button", { name: "+ Thêm dòng" });

    expect(addButton).toBeDisabled();
    fireEvent.change(screen.getByTestId("cell-__new__-ngay"), { target: { value: "2026-05-09" } });
    fireEvent.change(screen.getByTestId("cell-__new__-gtgd_cs_ssi"), { target: { value: "5300" } });
    fireEvent.click(addButton);

    expect(onAddRow).toHaveBeenCalledTimes(1);
    expect(addButton).toBeDisabled();
  });

  it("fires explicit save callback only when save button is enabled", () => {
    const onSaveChanges = vi.fn();
    const { rerender } = render(
      <DataGrid
        mode="daily"
        rows={makeRows()}
        onCellEdit={vi.fn()}
        onAddRow={vi.fn()}
        onDeleteRow={vi.fn()}
        onSaveChanges={onSaveChanges}
        hasPendingChanges={false}
        isSaving={false}
      />
    );

    const saveButton = screen.getByRole("button", { name: "Lưu thay đổi" });
    expect(saveButton).toBeDisabled();

    rerender(
      <DataGrid
        mode="daily"
        rows={makeRows()}
        onCellEdit={vi.fn()}
        onAddRow={vi.fn()}
        onDeleteRow={vi.fn()}
        onSaveChanges={onSaveChanges}
        hasPendingChanges={true}
        isSaving={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(onSaveChanges).toHaveBeenCalledTimes(1);
  });

  it("allows typing multiple characters in one focus session", async () => {
    const user = userEvent.setup();
    render(<DataGrid mode="daily" rows={makeRows()} onCellEdit={vi.fn()} onAddRow={vi.fn()} onDeleteRow={vi.fn()} {...defaultProps} />);
    const input = screen.getByTestId("cell-2026-04-08-thi_phan_co_so");

    await user.click(input);
    await user.clear(input);
    await user.type(input, "7.89");

    expect(input).toHaveValue("7.89");
    expect(document.activeElement).toBe(input);
  });
});
