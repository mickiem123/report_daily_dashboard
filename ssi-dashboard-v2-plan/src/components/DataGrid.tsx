import { useMemo, useState } from "react";
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
import type { CellValidation, Mode, Row } from "@/lib/types";
import { validateCell } from "@/lib/validation";

type DataGridProps = {
  mode: Mode;
  rows: Row[];
  onCellEdit: (ngay: string, field: keyof Row, newValue: number | string | null) => void;
  onAddRow: () => void;
  onDeleteRow: (ngay: string) => void;
};

type GridRow = Row & { __isNew: boolean };
const NEW_ROW_KEY = "__new__";

function toInputValue(field: keyof Row, value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return PERCENT_FIELDS.has(field) ? String(value * 100) : String(value);
  return value;
}

function toStoredValue(field: keyof Row, value: string): number | string | null {
  if (field === "ngay") return value.trim();
  const raw = value.trim();
  if (raw === "") return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return Number.NaN;
  return PERCENT_FIELDS.has(field) ? parsed / 100 : parsed;
}

function getSeverityClass(validation: CellValidation | undefined) {
  if (validation?.severity === "warn") return "border-yellow-400";
  if (validation?.severity === "outlier") return "border-orange-400";
  return "";
}

export function DataGrid({ mode, rows, onCellEdit, onAddRow, onDeleteRow }: DataGridProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [validations, setValidations] = useState<Record<string, CellValidation>>({});
  const [localError, setLocalError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const data = useMemo<GridRow[]>(
    () => [...rows, { ngay: "", __isNew: true } as GridRow],
    [rows]
  );

  const getDraftKey = (row: GridRow, field: keyof Row) => `${row.__isNew ? NEW_ROW_KEY : row.ngay}:${field}`;

  const commitCell = (row: GridRow, field: keyof Row, rawValue: string) => {
    if (!row.__isNew && rawValue === toInputValue(field, row[field])) return;
    const key = getDraftKey(row, field);
    const storedValue = toStoredValue(field, rawValue);
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
    setValidations((prev) => ({ ...prev, [key]: validation }));
    onCellEdit(row.ngay, field, storedValue);

    if (row.__isNew) {
      const current = { ...drafts, [key]: rawValue };
      const ngay = (field === "ngay" ? rawValue : current[`${NEW_ROW_KEY}:ngay`] ?? "").trim();
      const hasNumeric = NUMERIC_FIELDS.some((numericField) => {
        const cell = current[`${NEW_ROW_KEY}:${numericField}`];
        return cell !== undefined && cell.trim() !== "" && Number.isFinite(Number(cell));
      });
      if (validateCell("ngay", ngay, []).severity === "ok" && hasNumeric) onAddRow();
    }
  };

  const columns: ColumnDef<GridRow>[] = [
      {
        accessorKey: "ngay",
        header: FIELD_LABELS.ngay,
        cell: ({ row }) => {
          const item = row.original;
          const field: keyof Row = "ngay";
          const key = getDraftKey(item, field);
          const value = drafts[key] ?? toInputValue(field, item.ngay);
          return (
            <Input
              data-testid={`cell-${item.__isNew ? NEW_ROW_KEY : item.ngay}-${field}`}
              type="date"
              value={value}
              disabled={!item.__isNew}
              onChange={(event) => {
                const next = event.target.value;
                setDrafts((prev) => ({ ...prev, [key]: next }));
                commitCell(item, field, next);
              }}
              onBlur={(event) => commitCell(item, field, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
            />
          );
        },
      },
      ...NUMERIC_FIELDS.map((field): ColumnDef<GridRow> => ({
        accessorKey: field,
        header: FIELD_LABELS[field],
        cell: ({ row }) => {
          const item = row.original;
          const key = getDraftKey(item, field);
          const value = drafts[key] ?? toInputValue(field, item[field]);
          const validation = validations[key];
          const input = (
            <Input
              data-testid={`cell-${item.__isNew ? NEW_ROW_KEY : item.ngay}-${field}`}
              data-severity={validation?.severity}
              value={value}
              className={getSeverityClass(validation)}
              onChange={(event) => {
                const next = event.target.value;
                setDrafts((prev) => ({ ...prev, [key]: next }));
                commitCell(item, field, next);
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
              <TooltipTrigger>{input}</TooltipTrigger>
              <TooltipContent>{validation.message}</TooltipContent>
            </Tooltip>
          );
        },
      })),
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15"
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
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <TooltipProvider>
      <div className="space-y-3" data-mode={mode}>
        {localError ? <p className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">{localError}</p> : null}
        <div className="max-h-[60vh] overflow-auto rounded-md border border-white/10">
          <Table>
            <thead className="sticky top-0 bg-bg-elev">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="border-b border-white/10 px-2 py-2 text-left text-xs font-medium text-text-muted">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="border-b border-white/5 px-2 py-2 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
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
