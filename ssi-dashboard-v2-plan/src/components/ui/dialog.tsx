import * as React from "react";
import { cn } from "@/lib/utils";

export function Dialog({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-md border border-glass bg-bg-elev p-4", className)}>{children}</div>;
}
