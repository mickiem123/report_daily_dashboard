import { Trash2 } from "lucide-react";
import type { ProductCard, Status, SubMetric } from "@/lib/types";
import { getDeltaStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

type CardBackProps = {
  product: ProductCard;
  onDeleteMetric?: (metricId: string) => void;
};

const textByStatus: Record<Status, string> = {
  up: "text-status-up",
  down: "text-status-down",
  flat: "text-status-flat",
};

export function CardBack({ product, onDeleteMetric }: CardBackProps) {
  const groups = new Map<string, SubMetric[]>();
  const ungrouped: SubMetric[] = [];

  for (const metric of product.sub_metrics) {
    if (!metric.group) {
      ungrouped.push(metric);
      continue;
    }
    const list = groups.get(metric.group) ?? [];
    list.push(metric);
    groups.set(metric.group, list);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-xs text-ink-mute">{product.name} · Chi tiết</p>
        <p className="text-xs text-ink-faint">(nhấn để quay lại)</p>
      </div>

      <div className="flex-1 space-y-4 overflow-auto">
        {Array.from(groups.entries()).map(([group, metrics]) => (
          <section key={group} className="space-y-2">
            <h4 className="text-xs uppercase tracking-wide text-ink">{group}</h4>
            <div className="space-y-2">
              {metrics.map((metric) => {
                const deltaStatus = getDeltaStatus(metric.delta, metric.inverse);
                return (
                  <div key={`${group}-${metric.label}`} className="grid grid-cols-[1.2fr_1fr_auto_auto] items-center gap-3 text-sm">
                    <span className="truncate text-ink-mute">{metric.label}</span>
                    <span className="font-number truncate text-ink">{metric.value}</span>
                    <span className={cn("font-number", textByStatus[deltaStatus])}>{metric.delta}</span>
                    {onDeleteMetric && metric.metric_id ? (
                      <button
                        type="button"
                        aria-label={`Xóa metric ${metric.label}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteMetric(metric.metric_id!);
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-hairline text-ink-mute hover:text-status-down"
                      >
                        <Trash2 size={13} />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {ungrouped.length > 0 ? (
          <div className="space-y-2 pt-1">
            {ungrouped.map((metric) => {
              const deltaStatus = getDeltaStatus(metric.delta, metric.inverse);
              return (
                <div key={metric.label} className="grid grid-cols-[1.2fr_1fr_auto_auto] items-center gap-3 text-sm">
                  <span className="truncate text-ink-mute">{metric.label}</span>
                  <span className="font-number truncate text-ink">{metric.value}</span>
                  <span className={cn("font-number", textByStatus[deltaStatus])}>{metric.delta}</span>
                  {onDeleteMetric && metric.metric_id ? (
                    <button
                      type="button"
                      aria-label={`Xóa metric ${metric.label}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteMetric(metric.metric_id!);
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-hairline text-ink-mute hover:text-status-down"
                    >
                      <Trash2 size={13} />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
