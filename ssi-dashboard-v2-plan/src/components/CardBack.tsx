import type { ProductCard, Status, SubMetric } from "@/lib/types";
import { getDeltaStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

type CardBackProps = {
  product: ProductCard;
};

const textByStatus: Record<Status, string> = {
  up: "text-status-up",
  down: "text-status-down",
  flat: "text-status-flat",
};

export function CardBack({ product }: CardBackProps) {
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
        <p className="text-xs text-text-muted">{product.name} · Chi tiết</p>
        <p className="text-xs text-text-muted">(nhấn để quay lại)</p>
      </div>

      <div className="flex-1 space-y-4 overflow-auto">
        {Array.from(groups.entries()).map(([group, metrics]) => (
          <section key={group} className="space-y-2">
            <h4 className="text-xs uppercase tracking-wide text-accent-teal">{group}</h4>
            <div className="space-y-2">
              {metrics.map((metric) => {
                const deltaStatus = getDeltaStatus(metric.delta, metric.inverse);
                return (
                  <div key={`${group}-${metric.label}`} className="grid grid-cols-[1.2fr_1fr_auto] items-center gap-2 text-sm">
                    <span className="truncate text-text-muted">{metric.label}</span>
                    <span className="truncate font-mono text-text-primary">{metric.value}</span>
                    <span className={cn("font-mono", textByStatus[deltaStatus])}>{metric.delta}</span>
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
                <div key={metric.label} className="grid grid-cols-[1.2fr_1fr_auto] items-center gap-2 text-sm">
                  <span className="truncate text-text-muted">{metric.label}</span>
                  <span className="truncate font-mono text-text-primary">{metric.value}</span>
                  <span className={cn("font-mono", textByStatus[deltaStatus])}>{metric.delta}</span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
