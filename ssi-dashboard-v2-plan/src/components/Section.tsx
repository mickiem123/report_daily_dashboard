import { useEffect, useMemo, useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/Card";
import { DataGrid } from "@/components/DataGrid";
import { Modal, NhapLieuButton } from "@/components/Modal";
import { RefreshButton } from "@/components/SectionHeader";
import { useToastHelpers } from "@/components/Toast";
import { deleteRow, upsertRow } from "@/data/mutations";
import { useDaily, useMonthly, useWeekly } from "@/data/queries";
import { buildCards, sortCards } from "@/lib/section";
import type { Mode, ProductCard, Row } from "@/lib/types";
import { useDebouncedSave } from "@/lib/use-debounced-save";
import { useCountUp } from "@/lib/use-count-up";
import { useFirstMount } from "@/lib/use-first-mount";

type SectionProps = { mode: Mode };

function CountUpHeadlineCard({ product, enabled }: { product: ProductCard; enabled: boolean }) {
  const headline = useCountUp(product.headline_value, enabled);
  const animatedProduct = useMemo(() => ({ ...product, headline_value: headline }), [headline, product]);
  return <Card product={animatedProduct} />;
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
  const queryClient = useQueryClient();
  const { toastSaved, toastError } = useToastHelpers();
  const [pendingByNgay, setPendingByNgay] = useState<Record<string, Partial<Row> & { ngay: string }>>({});

  const { save: saveDebounced } = useDebouncedSave(
    async ({ ngay, changes }: { ngay: string; changes: Partial<Row> }) => {
      try {
        await upsertRow(mode, { ngay, ...changes });
        toastSaved();
        await queryClient.invalidateQueries({ queryKey: [mode] });
        setPendingByNgay((prev) => {
          const next = { ...prev };
          delete next[ngay];
          return next;
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Lưu dữ liệu thất bại";
        toastError(message);
        throw err;
      }
    },
    1000
  );

  const handleCellEdit = (ngay: string, field: keyof Row, newValue: number | string | null) => {
    setPendingByNgay((prev) => {
      const rowKey = ngay || "__new__";
      const next = {
        ...prev,
        [rowKey]: {
          ...(prev[rowKey] ?? { ngay }),
          [field]: newValue,
        },
      };
      const targetNgay = (next[rowKey].ngay ?? "").trim();
      if (targetNgay) saveDebounced({ ngay: targetNgay, changes: next[rowKey] });
      return next;
    });
  };

  const handleAddRow = () => {
    const candidate = pendingByNgay.__new__;
    const ngay = candidate?.ngay?.trim();
    if (!candidate || !ngay) return;
    const changes = { ...candidate };
    delete changes.ngay;
    setPendingByNgay((prev) => ({ ...prev, [ngay]: { ngay, ...changes }, __new__: { ngay: "" } }));
    saveDebounced({ ngay, changes });
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

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <RefreshButton mode={mode} />
        <NhapLieuButton onClick={() => setEditorOpen(true)} />
      </div>
      <SectionBody query={query} />
      <Modal open={editorOpen} onOpenChange={setEditorOpen} title={`Nhập liệu ${MODE_NAMES[mode]}`}>
        <DataGrid
          mode={mode}
          rows={query.data ?? []}
          onCellEdit={(ngay, field, newValue) => {
            handleCellEdit(ngay, field, newValue);
          }}
          onAddRow={handleAddRow}
          onDeleteRow={handleDeleteRow}
        />
      </Modal>
    </section>
  );
}

function SectionBody({ query }: { query: UseQueryResult<Row[]> }) {
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
          <div key={item} data-testid="section-skeleton" className="min-h-[312px] animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-md">
          <p className="text-text-primary">Lỗi tải dữ liệu</p>
          <button type="button" onClick={() => query.refetch()} className="mt-4 rounded-md border border-white/15 px-4 py-2 text-sm text-text-primary">
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
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-md">
          <p className="text-text-primary">Chưa có dữ liệu</p>
        </div>
      </div>
    );
  }

  const cards = sortCards(buildCards(rows));

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
          <CountUpHeadlineCard product={product} enabled={enableChoreography} />
        </div>
      ))}
    </div>
  );
}
