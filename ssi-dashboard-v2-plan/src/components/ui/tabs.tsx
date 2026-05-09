import * as React from "react";
import { cn } from "@/lib/utils";

export function Tabs({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex items-center gap-2", className)}>{children}</div>;
}
