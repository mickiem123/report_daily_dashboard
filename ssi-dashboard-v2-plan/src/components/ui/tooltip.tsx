import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: ReactNode }) {
  return <div className="group/tooltip relative">{children}</div>;
}

export function TooltipTrigger({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function TooltipContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="tooltip"
      className={cn(
        "pointer-events-none absolute left-1/2 top-full z-20 mt-1 hidden w-max max-w-64 -translate-x-1/2 rounded-sm border border-hairline bg-canvas px-2 py-1 text-xs text-ink shadow-panel group-hover/tooltip:block",
        className
      )}
    >
      {children}
    </div>
  );
}
