import * as React from "react";
import { cn } from "@/lib/utils";

export function Dialog({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-lg border border-hairline bg-canvas p-4 text-ink shadow-modal", className)}>{children}</div>;
}
