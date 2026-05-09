import * as React from "react";
import { cn } from "@/lib/utils";

export function Toast({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-md border border-glass bg-bg-elev p-3 text-sm", className)}>{children}</div>;
}
