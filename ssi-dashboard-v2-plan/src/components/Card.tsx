import { useEffect, useState } from "react";
import type { ProductCard, Status } from "@/lib/types";
import { getDeltaStatus, getStatusFromVerb } from "@/lib/status";
import { cn } from "@/lib/utils";
import { CardBack } from "@/components/CardBack";

type CardProps = {
  product: ProductCard;
  onFlip?: () => void;
};

const textByStatus: Record<Status, string> = {
  up: "text-status-up",
  down: "text-status-down",
  flat: "text-status-flat",
};

const badgeByStatus: Record<Status, string> = {
  up: "border-status-up/35 bg-canvas-soft text-status-up",
  down: "border-status-down/35 bg-canvas-soft text-status-down",
  flat: "border-hairline bg-canvas-soft text-ink-mute",
};

export function Card({ product, onFlip }: CardProps) {
  const status = getStatusFromVerb(product.verb);
  const pinnedMetrics = product.sub_metrics.filter((m) => m.important && m.value !== "N/A").slice(0, 3);
  const [expanded, setExpanded] = useState(false);
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

  const handleFlip = () => {
    setExpanded((value) => !value);
    onFlip?.();
  };

  const frontContent = (
    <>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{product.trend_emoji}</span>
          <h3 className="text-lg font-medium leading-[1.2] text-ink">{product.name}</h3>
        </div>
        <span className={cn("rounded-full border px-2 py-1 text-xs font-medium", badgeByStatus[status])}>{product.verb}</span>
      </div>

      <div className="mb-5">
        <p className="text-xs uppercase tracking-wide text-ink-mute">{product.headline_label}</p>
        <p className={cn("font-number text-4xl font-semibold leading-[1.15]", textByStatus[status])}>{product.headline_value}</p>
        <p className={cn("font-number text-sm", textByStatus[status])}>{product.headline_delta}</p>
      </div>

      <div className="space-y-2">
        {pinnedMetrics.map((metric) => {
          const deltaStatus = getDeltaStatus(metric.delta, metric.inverse);
          return (
            <div key={metric.label} data-testid="metric-row" className="grid grid-cols-[1.2fr_1fr_auto] items-center gap-3 text-sm">
              <span className="truncate text-ink-mute">{metric.label}</span>
              <span className="font-number truncate text-ink">{metric.value}</span>
              <span className={cn("font-number", textByStatus[deltaStatus])}>{metric.delta}</span>
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <button
      type="button"
      data-status={status}
      data-flipped={expanded}
      data-expanded={expanded}
      aria-pressed={expanded}
      aria-expanded={expanded}
      onClick={handleFlip}
      className={cn(
        "relative h-full min-h-[312px] w-full overflow-hidden rounded-xl border border-hairline bg-canvas text-left shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        reducedMotion ? "" : "transition-all duration-200 hover:-translate-y-1"
      )}
    >
      <div
        className="relative h-full w-full"
        style={{ transition: reducedMotion ? "none" : "max-height 320ms ease, opacity 220ms ease" }}
      >
        <div data-testid="card-front-face" className="p-6">
          {frontContent}
        </div>
        <div
          data-testid="card-back-face"
          className={cn(
            "overflow-hidden border-t border-hairline px-6",
            expanded ? "max-h-[420px] pb-6 pt-4 opacity-100" : "max-h-0 pb-0 pt-0 opacity-0"
          )}
          aria-hidden={!expanded}
        >
          {expanded ? <CardBack product={product} /> : null}
        </div>
      </div>
    </button>
  );
}
