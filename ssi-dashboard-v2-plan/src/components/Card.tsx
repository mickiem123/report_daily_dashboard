import { useEffect, useState } from "react";
import type { ProductCard, Status } from "@/lib/types";
import { getDeltaStatus, getStatusFromVerb } from "@/lib/status";
import { cn } from "@/lib/utils";
import { CardBack } from "@/components/CardBack";

type CardProps = {
  product: ProductCard;
  onFlip?: () => void;
};

const auraByStatus: Record<Status, string> = {
  up: "from-status-up/20 hover:from-status-up/30",
  down: "from-status-down/20 hover:from-status-down/30",
  flat: "from-status-flat/20 hover:from-status-flat/30",
};

const textByStatus: Record<Status, string> = {
  up: "text-status-up",
  down: "text-status-down",
  flat: "text-status-flat",
};

const badgeByStatus: Record<Status, string> = {
  up: "bg-status-up/15 text-status-up",
  down: "bg-status-down/15 text-status-down",
  flat: "bg-status-flat/15 text-status-flat",
};

export function Card({ product, onFlip }: CardProps) {
  const status = getStatusFromVerb(product.verb);
  const pinnedMetrics = product.sub_metrics.filter((m) => m.important && m.value !== "N/A");
  const [flipped, setFlipped] = useState(false);
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
    setFlipped((value) => !value);
    onFlip?.();
  };

  const frontContent = (
    <>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{product.trend_emoji}</span>
          <h3 className="font-semibold text-text-primary">{product.name}</h3>
        </div>
        <span className={cn("rounded-full px-2 py-1 text-xs font-medium", badgeByStatus[status])}>{product.verb}</span>
      </div>

      <div className="mb-5">
        <p className="text-xs uppercase tracking-wide text-text-muted">{product.headline_label}</p>
        <p className={cn("font-mono text-4xl font-bold", textByStatus[status])}>{product.headline_value}</p>
        <p className={cn("font-mono text-sm", textByStatus[status])}>{product.headline_delta}</p>
      </div>

      <div className="space-y-2">
        {pinnedMetrics.map((metric) => {
          const deltaStatus = getDeltaStatus(metric.delta, metric.inverse);
          return (
            <div key={metric.label} data-testid="metric-row" className="grid grid-cols-[1.2fr_1fr_auto] items-center gap-2 text-sm">
              <span className="truncate text-text-muted">{metric.label}</span>
              <span className="truncate font-mono text-text-primary">{metric.value}</span>
              <span className={cn("font-mono", textByStatus[deltaStatus])}>{metric.delta}</span>
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
      data-flipped={flipped}
      aria-pressed={flipped}
      onClick={handleFlip}
      className={cn(
        "relative h-full min-h-[312px] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal/60",
        reducedMotion ? "" : "transition-all duration-200 hover:-translate-y-1"
      )}
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)", perspective: "1200px" }}
    >
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br to-transparent blur-3xl",
            reducedMotion ? "" : "transition-all duration-200",
            auraByStatus[status]
          )}
        />

        <div
          className={cn("relative h-full w-full [transform-style:preserve-3d]", flipped ? "rotate-y-180" : "")}
          style={{ transition: reducedMotion ? "none" : "transform 600ms ease" }}
        >
          <div data-testid="card-front-face" className="absolute inset-0 p-6 [backface-visibility:hidden]">
            {frontContent}
          </div>
          <div data-testid="card-back-face" className="absolute inset-0 p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {flipped ? <CardBack product={product} /> : null}
          </div>
        </div>
    </button>
  );
}
