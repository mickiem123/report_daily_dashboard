import { useEffect, useMemo, useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { PencilLine } from "lucide-react";
import { AddProductCard } from "@/components/AddProductCard";
import { Card } from "@/components/Card";
import { DataGrid } from "@/components/DataGrid";
import { Modal } from "@/components/Modal";
import { RefreshButton } from "@/components/SectionHeader";
import { StructureDialog } from "@/components/StructureDialog";
import { useToastHelpers } from "@/components/Toast";
import { PRODUCT_METADATA_QUERY_KEY, useProductMetadata } from "@/data/metadata";
import { deleteRow, upsertRow } from "@/data/mutations";
import { useDaily, useMonthly, useWeekly } from "@/data/queries";
import {
  addMetric,
  addProduct,
  deleteMetric,
  deleteProduct,
  type AddMetricPayload,
  type DeleteMetricPayload,
  type DeleteProductPayload,
} from "@/data/schema-admin";
import { buildProductCardsFromMetadata, getEditableFields } from "@/lib/product-builder";
import type { MetricDefinition, ProductDefinition, ProductMetadata } from "@/lib/product-metadata";
import { buildCards, sortCards } from "@/lib/section";
import type { Mode, ProductCard, Row } from "@/lib/types";
import { useCountUp } from "@/lib/use-count-up";
import { useFirstMount } from "@/lib/use-first-mount";

type SectionProps = { mode: Mode };

function CountUpHeadlineCard({
  product,
  enabled,
  onAddMetric,
  onDeleteProduct,
  onDeleteMetric,
}: {
  product: ProductCard;
  enabled: boolean;
  onAddMetric?: () => void;
  onDeleteProduct?: () => void;
  onDeleteMetric?: (metricId: string) => void;
}) {
  const headline = useCountUp(product.headline_value, enabled);
  const animatedProduct = useMemo(() => ({ ...product, headline_value: headline }), [headline, product]);
  return (
    <Card
      product={animatedProduct}
      onAddMetric={onAddMetric}
      onDeleteProduct={onDeleteProduct}
      onDeleteMetric={onDeleteMetric}
    />
  );
}

function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return reducedMotion;
}

const SKELETON_ITEMS = Array.from({ length: 6 }, (_, index) => index);
const MODE_NAMES: Record<Mode, string> = {
  daily: "ngày",
  weekly: "tuần",
  monthly: "tháng",
};

export function Section({ mode }: SectionProps) {
  const dailyQuery = useDaily();
  const weeklyQuery = useWeekly();
  const monthlyQuery = useMonthly();
  const query = mode === "daily" ? dailyQuery : mode === "weekly" ? weeklyQuery : monthlyQuery;
  return <SectionWithEditor mode={mode} query={query} />;
}

function SectionWithEditor({ mode, query }: { mode: Mode; query: UseQueryResult<Row[]> }) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [structureSaving, setStructureSaving] = useState(false);
  const [metricDialogProductId, setMetricDialogProductId] = useState<string | null>(null);
  const [deleteMetricTarget, setDeleteMetricTarget] = useState<MetricDefinition | null>(null);
  const [deleteProductTarget, setDeleteProductTarget] = useState<ProductDefinition | null>(null);
  const queryClient = useQueryClient();
  const { toastSaved, toastError } = useToastHelpers();
  const [pendingByNgay, setPendingByNgay] = useState<Record<string, Partial<Row> & { ngay: string }>>({});
  const metadataQuery = useProductMetadata();
  const metadata = metadataQuery.data;
  const editableFields = metadata ? getEditableFields(metadata) : undefined;

  const handleCellEdit = (ngay: string, field: keyof Row, newValue: number | string | null) => {
    setPendingByNgay((prev) => {
      const rowKey = ngay || "__new__";
      return {
        ...prev,
        [rowKey]: {
          ...(prev[rowKey] ?? { ngay }),
          [field]: newValue,
        },
      };
    });
  };

  const handleAddRow = () => {
    const candidate = pendingByNgay.__new__;
    const ngay = candidate?.ngay?.trim();
    if (!candidate || !ngay) return;
    const changes = { ...candidate };
    delete changes.ngay;
    if (Object.keys(changes).length === 0) return;
    setPendingByNgay((prev) => {
      const rest = { ...prev };
      delete rest.__new__;
      return { ...rest, [ngay]: { ngay, ...changes } };
    });
  };

  const handleSaveChanges = async () => {
    const payloads = Object.values(pendingByNgay)
      .map((entry) => {
        const ngay = (entry.ngay ?? "").trim();
        if (!ngay) return null;
        const changes = Object.fromEntries(Object.entries(entry).filter(([key]) => key !== "ngay"));
        if (Object.keys(changes).length === 0) return null;
        return { ngay, changes };
      })
      .filter((item): item is { ngay: string; changes: Partial<Row> } => item !== null);

    if (payloads.length === 0) return;

    setIsSaving(true);
    try {
      await Promise.all(payloads.map((item) => upsertRow(mode, { ngay: item.ngay, ...item.changes })));
      toastSaved();
      await queryClient.invalidateQueries({ queryKey: [mode] });
      setPendingByNgay({});
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lưu dữ liệu thất bại";
      toastError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRow = async (ngay: string) => {
    try {
      await deleteRow(mode, ngay);
      await queryClient.invalidateQueries({ queryKey: [mode] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Xóa dữ liệu thất bại";
      toastError(message);
    }
  };

  const refreshStructure = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [mode] }),
      queryClient.invalidateQueries({ queryKey: PRODUCT_METADATA_QUERY_KEY }),
    ]);
  };

  const handleAddProduct = async (payload: { name: string }) => {
    setStructureSaving(true);
    try {
      await addProduct(payload);
      await refreshStructure();
      toastSaved();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Không tạo được card");
    } finally {
      setStructureSaving(false);
    }
  };

  const handleAddMetric = async (payload: AddMetricPayload) => {
    setStructureSaving(true);
    try {
      await addMetric(payload);
      await refreshStructure();
      setMetricDialogProductId(null);
      toastSaved();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Không tạo được metric");
    } finally {
      setStructureSaving(false);
    }
  };

  const handleDeleteMetric = async (payload: DeleteMetricPayload) => {
    setStructureSaving(true);
    try {
      await deleteMetric(payload);
      await refreshStructure();
      setDeleteMetricTarget(null);
      toastSaved();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Không xóa được metric");
    } finally {
      setStructureSaving(false);
    }
  };

  const handleDeleteProduct = async (payload: DeleteProductPayload) => {
    setStructureSaving(true);
    try {
      await deleteProduct(payload);
      await refreshStructure();
      setDeleteProductTarget(null);
      toastSaved();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Không xóa được card");
    } finally {
      setStructureSaving(false);
    }
  };

  const metricDialogProduct = metadata?.products.find((product) => product.id === metricDialogProductId);

  return (
    <section className="space-y-6">
      {metadataQuery.isError ? (
        <div className="rounded-sm border border-status-down/45 bg-status-down/10 px-3 py-2 text-sm text-status-down">
          Metadata schema chưa sẵn sàng trên Supabase. Cần tạo bảng metadata và deploy Edge Function `schema-admin` để dùng thêm/xóa card hoặc metric.
        </div>
      ) : null}
      <div className="flex items-center justify-end gap-2">
        <RefreshButton mode={mode} />
        <button
          type="button"
          onClick={() => setEditorOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-primary bg-primary px-4 text-sm font-medium text-on-primary transition hover:border-primary-deep hover:bg-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <PencilLine size={16} aria-hidden />
          Nhập liệu
        </button>
      </div>
      <SectionBody
        query={query}
        metadata={metadata}
        structureSaving={structureSaving}
        onAddProduct={handleAddProduct}
        onAddMetric={(productId) => setMetricDialogProductId(productId)}
        onDeleteMetric={(metricId) => {
          const metric = metadata?.metrics.find((item) => item.id === metricId);
          if (metric) setDeleteMetricTarget(metric);
        }}
        onDeleteProduct={(productId) => {
          const product = metadata?.products.find((item) => item.id === productId);
          if (product) setDeleteProductTarget(product);
        }}
      />
      <Modal open={editorOpen} onOpenChange={setEditorOpen} title={`Nhập liệu ${MODE_NAMES[mode]}`}>
        <DataGrid
          mode={mode}
          rows={query.data ?? []}
          editableFields={editableFields}
          onCellEdit={(ngay, field, newValue) => {
            handleCellEdit(ngay, field, newValue);
          }}
          onAddRow={handleAddRow}
          onSaveChanges={handleSaveChanges}
          onDeleteRow={handleDeleteRow}
          hasPendingChanges={Object.keys(pendingByNgay).length > 0}
          isSaving={isSaving}
        />
      </Modal>
      {metricDialogProduct ? (
        <StructureDialog
          open
          mode="add_metric"
          product={metricDialogProduct}
          isSaving={structureSaving}
          onOpenChange={(open) => {
            if (!open) setMetricDialogProductId(null);
          }}
          onAddMetric={handleAddMetric}
          onDeleteMetric={handleDeleteMetric}
          onDeleteProduct={handleDeleteProduct}
        />
      ) : null}
      {deleteMetricTarget ? (
        <StructureDialog
          open
          mode="delete_metric"
          metric={deleteMetricTarget}
          isSaving={structureSaving}
          onOpenChange={(open) => {
            if (!open) setDeleteMetricTarget(null);
          }}
          onAddMetric={handleAddMetric}
          onDeleteMetric={handleDeleteMetric}
          onDeleteProduct={handleDeleteProduct}
        />
      ) : null}
      {deleteProductTarget ? (
        <StructureDialog
          open
          mode="delete_product"
          product={deleteProductTarget}
          isSaving={structureSaving}
          onOpenChange={(open) => {
            if (!open) setDeleteProductTarget(null);
          }}
          onAddMetric={handleAddMetric}
          onDeleteMetric={handleDeleteMetric}
          onDeleteProduct={handleDeleteProduct}
        />
      ) : null}
    </section>
  );
}

function SectionBody({
  query,
  metadata,
  structureSaving,
  onAddProduct,
  onAddMetric,
  onDeleteMetric,
  onDeleteProduct,
}: {
  query: UseQueryResult<Row[]>;
  metadata?: ProductMetadata;
  structureSaving: boolean;
  onAddProduct: (payload: { name: string }) => void | Promise<void>;
  onAddMetric: (productId: string) => void;
  onDeleteMetric: (metricId: string) => void;
  onDeleteProduct: (productId: string) => void;
}) {
  const reducedMotion = useReducedMotion();
  const firstMount = useFirstMount();
  const enableChoreography = firstMount && !reducedMotion;
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (!enableChoreography) return;
    const timer = setTimeout(() => setAnimateIn(true), 0);
    return () => clearTimeout(timer);
  }, [enableChoreography]);

  if (query.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {SKELETON_ITEMS.map((item) => (
          <div key={item} data-testid="section-skeleton" className="min-h-[312px] animate-pulse rounded-xl border border-hairline bg-canvas-soft" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-hairline bg-canvas p-6 text-center shadow-subtle">
          <p className="text-ink">Lỗi tải dữ liệu</p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-4 rounded-md border border-hairline-strong bg-canvas px-4 py-2 text-sm font-medium text-ink transition hover:bg-canvas-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const rows = query.data ?? [];
  if (rows.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-hairline bg-canvas p-6 text-center shadow-subtle">
          <p className="text-ink">Chưa có dữ liệu</p>
        </div>
      </div>
    );
  }

  const cards = metadata ? buildProductCardsFromMetadata(rows, metadata) : sortCards(buildCards(rows));

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((product, index) => (
        <div
          key={product.key}
          data-testid="section-card"
          className={enableChoreography ? "section-card-stagger transition-all duration-300 ease-out" : ""}
          style={
            enableChoreography
              ? { transitionDelay: `${index * 50}ms`, opacity: animateIn ? 1 : 0, transform: animateIn ? "translateY(0)" : "translateY(6px)" }
              : undefined
          }
        >
          <CountUpHeadlineCard
            product={product}
            enabled={enableChoreography}
            onAddMetric={product.product_id ? () => onAddMetric(product.product_id!) : undefined}
            onDeleteProduct={product.product_id ? () => onDeleteProduct(product.product_id!) : undefined}
            onDeleteMetric={onDeleteMetric}
          />
        </div>
      ))}
      {metadata ? <AddProductCard onAddProduct={onAddProduct} isSaving={structureSaving} /> : null}
    </div>
  );
}
