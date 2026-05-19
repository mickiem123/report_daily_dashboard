import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { AddMetricPayload, DeleteMetricPayload, DeleteProductPayload } from "@/data/schema-admin";
import type { MetricDefinition, MetricPlacement, MetricUnit, ProductDefinition } from "@/lib/product-metadata";

type StructureDialogProps =
  | {
      open: boolean;
      mode: "add_metric";
      product: ProductDefinition;
      metric?: never;
      isSaving: boolean;
      onOpenChange: (open: boolean) => void;
      onAddMetric: (payload: AddMetricPayload) => void | Promise<void>;
      onDeleteMetric: (payload: DeleteMetricPayload) => void | Promise<void>;
      onDeleteProduct: (payload: DeleteProductPayload) => void | Promise<void>;
    }
  | {
      open: boolean;
      mode: "delete_metric";
      product?: ProductDefinition;
      metric: MetricDefinition;
      isSaving: boolean;
      onOpenChange: (open: boolean) => void;
      onAddMetric: (payload: AddMetricPayload) => void | Promise<void>;
      onDeleteMetric: (payload: DeleteMetricPayload) => void | Promise<void>;
      onDeleteProduct: (payload: DeleteProductPayload) => void | Promise<void>;
    }
  | {
      open: boolean;
      mode: "delete_product";
      product: ProductDefinition;
      metric?: never;
      isSaving: boolean;
      onOpenChange: (open: boolean) => void;
      onAddMetric: (payload: AddMetricPayload) => void | Promise<void>;
      onDeleteMetric: (payload: DeleteMetricPayload) => void | Promise<void>;
      onDeleteProduct: (payload: DeleteProductPayload) => void | Promise<void>;
    };

const units: MetricUnit[] = ["tỷ", "KH", "HĐ", "tài khoản", "%"];

export function StructureDialog(props: StructureDialogProps) {
  const [label, setLabel] = useState("");
  const [unit, setUnit] = useState<MetricUnit>("tỷ");
  const [placement, setPlacement] = useState<MetricPlacement>("normal");
  const [confirmation, setConfirmation] = useState("");

  const expectedConfirmation = useMemo(() => {
    if (props.mode === "delete_metric") return props.metric.column_key;
    if (props.mode === "delete_product") return props.product.name;
    return "";
  }, [props]);

  if (!props.open) return null;

  const isDelete = props.mode === "delete_metric" || props.mode === "delete_product";
  const canConfirmDelete = isDelete && confirmation === expectedConfirmation && !props.isSaving;

  return (
    <Dialog>
      <DialogContent className="mx-auto max-w-md">
        {props.mode === "add_metric" ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const trimmed = label.trim();
              if (!trimmed) return;
              void props.onAddMetric({
                label: trimmed,
                unit,
                product_id: props.product.id,
                placement,
                is_inverse: false,
              });
            }}
          >
            <h2 className="text-base font-semibold text-ink">Thêm metric cho {props.product.name}</h2>
            <label className="block space-y-2 text-sm text-ink-mute">
              <span>Tên metric</span>
              <Input value={label} onChange={(event) => setLabel(event.target.value)} />
            </label>
            <label className="block space-y-2 text-sm text-ink-mute">
              <span>Vị trí</span>
              <select
                value={placement}
                onChange={(event) => setPlacement(event.target.value as MetricPlacement)}
                className="h-9 w-full rounded-sm border border-hairline bg-canvas px-3 text-ink"
              >
                <option value="headline">Headline</option>
                <option value="normal">Normal data</option>
                <option value="sub_product">Sub-product data</option>
              </select>
            </label>
            <label className="block space-y-2 text-sm text-ink-mute">
              <span>Đơn vị</span>
              <select
                value={unit}
                onChange={(event) => setUnit(event.target.value as MetricUnit)}
                className="h-9 w-full rounded-sm border border-hairline bg-canvas px-3 text-ink"
              >
                {units.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => props.onOpenChange(false)}
                className="rounded-sm border border-hairline px-4 py-2 text-sm text-ink"
              >
                Hủy
              </button>
              <Button type="submit" disabled={!label.trim() || props.isSaving}>
                Tạo metric
              </Button>
            </div>
          </form>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!canConfirmDelete) return;
              if (props.mode === "delete_metric") {
                void props.onDeleteMetric({ metric_id: props.metric.id, confirmation });
              } else {
                void props.onDeleteProduct({ product_id: props.product.id, confirmation });
              }
            }}
          >
            <h2 className="text-base font-semibold text-ink">
              {props.mode === "delete_metric" ? "Xóa metric" : "Xóa card"}
            </h2>
            <p className="text-sm text-ink-mute">
              Nhập <span className="font-number text-ink">{expectedConfirmation}</span> để xác nhận xóa.
            </p>
            <label className="block space-y-2 text-sm text-ink-mute">
              <span>Nhập mã xác nhận</span>
              <Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => props.onOpenChange(false)}
                className="rounded-sm border border-hairline px-4 py-2 text-sm text-ink"
              >
                Hủy
              </button>
              <Button type="submit" disabled={!canConfirmDelete} className="border-status-down bg-status-down text-white">
                {props.mode === "delete_metric" ? "Xóa metric" : "Xóa card"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
