import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Table } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FIELD_LABELS, NUMERIC_FIELDS, PERCENT_FIELDS } from "@/lib/field-labels";
import type { MetricDefinition } from "@/lib/product-metadata";
import type { CellValidation, Mode, Row } from "@/lib/types";
import { validateCell } from "@/lib/validation";

type DataGridProps = {
  mode: Mode;
  rows: Row[];
  onCellEdit: (ngay: string, field: keyof Row, newValue: number | string | null) => void;
  onAddRow: () => void;
  onSaveChanges: () => void;
  onDeleteRow: (ngay: string) => void;
  hasPendingChanges: boolean;
  isSaving: boolean;
  editableFields?: MetricDefinition[];
};

type GridRow = Row & { __isNew: boolean };
const NEW_ROW_KEY = "__new__";
const LARGE_NUMERIC_FIELDS = new Set<keyof Row>([
  "gtgd_cs_ssi",
  "thanh_khoan_ttcs",
  "tong_du_no_margin",
  "du_no_t7",
  "du_no_trading_plus",
  "du_no_mplus",
  "giai_ngan_mplus",
  "du_no_spv",
  "thanh_khoan_tt_ps",
  "du_no_dplus_giai_ngan",
  "du_no_dplus_cuoi_ngay",
  "so_du_scash",
  "so_du_casa_scash",
  "so_du_sfund",
]);

function isPercentField(field: keyof Row, editableFields?: MetricDefinition[]) {
  const metric = editableFields?.find((item) => item.column_key === field);
  return metric ? metric.is_percent : PERCENT_FIELDS.has(field);
}

function toInputValue(field: keyof Row, value: number | string | null | undefined, editableFields?: MetricDefinition[]): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return isPercentField(field, editableFields) ? String(Number((value * 100).toFixed(4))) : String(value);
  return value;
}

function toStoredValue(field: keyof Row, value: string, editableFields?: MetricDefinition[]): number | string | null {
  if (field === "ngay") return value.trim();
  const raw = value.trim();
  if (raw === "") return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return Number.NaN;
  return isPercentField(field, editableFields) ? parsed / 100 : parsed;
}

function getSeverityClass(validation: CellValidation | undefined) {
  if (validation?.severity === "warn") return "border-yellow-400/80 bg-yellow-500/10";
  if (validation?.severity === "outlier") return "border-orange-400/80 bg-orange-500/10";
  return "";
}

function getColumnWidthClass(columnId: string, editableFields?: MetricDefinition[]) {
  if (columnId === "ngay") return "min-w-[150px]";
  if (columnId === "actions") return "min-w-[64px] w-16";
  if (isPercentField(columnId, editableFields)) return "min-w-[96px]";
  if (LARGE_NUMERIC_FIELDS.has(columnId as keyof Row)) return "min-w-36";
  return "min-w-[104px]";
}

function getStickyColumnClass(columnId: string) {
  if (columnId === "ngay") return "sticky left-0 z-20 bg-canvas shadow-[1px_0_0_var(--hairline)]";
  if (columnId === "actions") return "sticky right-0 z-20 bg-canvas shadow-[-1px_0_0_var(--hairline)]";
  return "";
}

function getInputClass(field: keyof Row, validation: CellValidation | undefined) {
  const alignment = field === "ngay" ? "text-left" : "text-right font-number";
  return [
    "h-9 rounded-sm border-hairline bg-canvas px-3 text-[13px] leading-none text-ink",
    "shadow-none outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25",
    "disabled:cursor-not-allowed disabled:bg-canvas-soft disabled:text-ink-mute",
    alignment,
    getSeverityClass(validation),
  ].join(" ");
}

function hasReadyNewRow(drafts: Record<string, string>, editableFields: MetricDefinition[]) {
  const ngay = (drafts[`${NEW_ROW_KEY}:ngay`] ?? "").trim();
  const hasValidDate = validateCell("ngay", ngay, []).severity === "ok";
  const hasNumeric = editableFields.some((numericField) => {
    const field = numericField.column_key;
    const cell = drafts[`${NEW_ROW_KEY}:${field}`];
    return cell !== undefined && cell.trim() !== "" && Number.isFinite(Number(cell));
  });
  return hasValidDate && hasNumeric;
}

export function DataGrid({
  mode,
  rows,
  onCellEdit,
  onAddRow,
  onSaveChanges,
  onDeleteRow,
  hasPendingChanges,
  isSaving,
  editableFields,
}: DataGridProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [validations, setValidations] = useState<Record<string, CellValidation>>({});
  const [localError, setLocalError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newRowVersion, setNewRowVersion] = useState(0);
  const focusedCellKeyRef = useRef<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const data = useMemo<GridRow[]>(
    () => [...rows, { ngay: "", __isNew: true } as GridRow],
    [rows]
  );

  const getDraftKey = (row: GridRow, field: keyof Row) => `${row.__isNew ? NEW_ROW_KEY : row.ngay}:${field}`;

  useLayoutEffect(() => {
    const focusedCellKey = focusedCellKeyRef.current;
    if (!focusedCellKey) return;
    const input = inputRefs.current[focusedCellKey];
    if (input && document.activeElement !== input) {
      input.focus();
    }
  }, [rows]);

  const metricFields = useMemo<MetricDefinition[]>(
    () =>
      editableFields ??
      NUMERIC_FIELDS.map((field, index) => ({
        id: field,
        column_key: field,
        label: FIELD_LABELS[field],
        unit: PERCENT_FIELDS.has(field) ? "%" : "KH",
        product_id: "",
        sub_product_id: null,
        placement: "normal",
        sort_order: index,
        is_visible: true,
        is_percent: PERCENT_FIELDS.has(field),
        is_inverse: false,
      })),
    [editableFields]
  );

  const commitCell = (row: GridRow, field: keyof Row, rawValue: string) => {
    if (!row.__isNew && rawValue === toInputValue(field, row[field], metricFields)) return;
    const key = getDraftKey(row, field);
    const storedValue = toStoredValue(field, rawValue, metricFields);
    const history =
      field === "ngay"
        ? []
        : rows
            .map((item) => item[field])
            .filter((item): item is number | null => typeof item === "number" || item === null);
    const validation = validateCell(field, storedValue, history);

    if (validation.severity === "error" || (typeof storedValue === "number" && Number.isNaN(storedValue))) {
      setLocalError("Giá trị không hợp lệ");
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setValidations((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    setLocalError(null);
    setDrafts((prev) => ({ ...prev, [key]: rawValue }));
    setValidations((prev) => ({ ...prev, [key]: validation }));
    onCellEdit(row.ngay, field, storedValue);
  };

  const newRowReady = hasReadyNewRow(drafts, metricFields);
  const clearNewRowDrafts = () => {
    setDrafts((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith(`${NEW_ROW_KEY}:`))));
    setValidations((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith(`${NEW_ROW_KEY}:`))));
    setLocalError(null);
    setNewRowVersion((current) => current + 1);
  };

  const columns: ColumnDef<GridRow>[] = [
      {
        accessorKey: "ngay",
        header: FIELD_LABELS.ngay,
        cell: ({ row }) => {
          const item = row.original;
          const field: keyof Row = "ngay";
          const key = getDraftKey(item, field);
          const value = drafts[key] ?? toInputValue(field, item.ngay, metricFields);
          const isExistingRow = !item.__isNew;
          return (
            <Input
              key={item.__isNew ? `${key}:${newRowVersion}` : undefined}
              ref={(element) => {
                inputRefs.current[key] = element;
              }}
              data-testid={`cell-${item.__isNew ? NEW_ROW_KEY : item.ngay}-${field}`}
              type="date"
              defaultValue={value}
              disabled={isExistingRow}
              className={getInputClass(field, undefined)}
              onFocus={() => {
                focusedCellKeyRef.current = key;
              }}
              onBlur={(event) => commitCell(item, field, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
            />
          );
        },
      },
      ...metricFields.map((metric): ColumnDef<GridRow> => {
        const field = metric.column_key;
        return {
        accessorKey: field,
        header: metric.label,
        cell: ({ row }) => {
          const item = row.original;
          const key = getDraftKey(item, field);
          const value = drafts[key] ?? toInputValue(field, item[field], metricFields);
          const validation = validations[key];
          const input = (
            <Input
              key={item.__isNew ? `${key}:${newRowVersion}` : undefined}
              ref={(element) => {
                inputRefs.current[key] = element;
              }}
              data-testid={`cell-${item.__isNew ? NEW_ROW_KEY : item.ngay}-${field}`}
              data-severity={validation?.severity}
              defaultValue={value}
              className={getInputClass(field, validation)}
              onFocus={() => {
                focusedCellKeyRef.current = key;
              }}
              onBlur={(event) => commitCell(item, field, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
            />
          );
          if (validation?.severity !== "warn" && validation?.severity !== "outlier") return input;
          return (
            <Tooltip>
              <TooltipTrigger asChild>{input}</TooltipTrigger>
              <TooltipContent>{validation.message}</TooltipContent>
            </Tooltip>
          );
        },
      };
      }),
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const item = row.original;
          if (item.__isNew) return null;
          return (
            <button
              type="button"
              aria-label={`Xóa dòng ${item.ngay}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-hairline bg-canvas text-ink-mute transition hover:border-hairline-strong hover:text-ink"
              onClick={() => setDeleteTarget(item.ngay)}
            >
              <Trash2 size={16} />
            </button>
          );
        },
      },
  ];

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => (row.__isNew ? NEW_ROW_KEY : row.ngay),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <TooltipProvider>
      <div className="space-y-3" data-mode={mode}>
        {localError ? (
          <p className="rounded-sm border border-status-down/45 bg-status-down/10 px-3 py-2 text-sm text-status-down">{localError}</p>
        ) : null}
        <div
          data-testid="data-grid-scroll"
          className="max-h-[60vh] overflow-auto rounded-xl border border-hairline bg-canvas shadow-panel [scrollbar-gutter:stable]"
        >
          <Table className="min-w-max border-separate border-spacing-0 text-[13px]">
            <thead className="sticky top-0 z-30 bg-canvas">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={[
                        "h-12 border-b border-hairline px-3 text-left text-xs font-medium leading-tight text-ink-mute",
                        getColumnWidthClass(header.column.id, metricFields),
                        getStickyColumnClass(header.column.id),
                      ].join(" ")}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="h-11">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={[
                        "border-b border-hairline px-3 py-1 align-middle",
                        getColumnWidthClass(cell.column.id, metricFields),
                        getStickyColumnClass(cell.column.id),
                      ].join(" ")}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        <div className="flex justify-end gap-2 border-t border-hairline bg-canvas pt-3">
          <button
            type="button"
            disabled={!hasPendingChanges || isSaving}
            onClick={onSaveChanges}
            className="min-h-9 rounded-sm border border-primary bg-primary px-4 py-2 text-sm font-medium leading-none text-on-primary transition hover:border-primary-deep hover:bg-primary-deep disabled:cursor-not-allowed disabled:border-hairline disabled:bg-canvas-soft disabled:text-ink-faint"
          >
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          <button
            type="button"
            disabled={!newRowReady}
            onClick={() => {
              if (!newRowReady) return;
              onAddRow();
              clearNewRowDrafts();
            }}
            className="min-h-9 rounded-sm border border-hairline-strong bg-canvas px-4 py-2 text-sm font-medium leading-none text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:border-hairline disabled:text-ink-faint"
          >
            + Thêm dòng
          </button>
        </div>
      </div>
      <AlertDialog open={Boolean(deleteTarget)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>Xác nhận xóa dòng {deleteTarget}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) onDeleteRow(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
