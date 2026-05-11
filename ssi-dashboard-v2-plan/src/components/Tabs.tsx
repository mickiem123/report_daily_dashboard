import { ReactNode } from "react";
import type { Mode } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type DashboardTabsProps = {
  value: Mode;
  onValueChange: (m: Mode) => void;
  children: ReactNode;
};

const triggerClassName = cn(
  "rounded-md px-5 py-2 text-sm font-medium transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
  "data-[state=active]:bg-canvas-night data-[state=active]:text-on-dark",
  "data-[state=inactive]:text-ink-mute data-[state=inactive]:hover:bg-canvas-soft data-[state=inactive]:hover:text-ink",
);

export function DashboardTabs({ value, onValueChange, children }: DashboardTabsProps) {
  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(next as Mode)} className="w-full">
      <TabsList className="sticky top-4 z-30 mx-auto flex w-fit gap-1 rounded-lg border border-hairline bg-canvas p-1 shadow-subtle">
        <TabsTrigger value="daily" className={triggerClassName}>
          Daily
        </TabsTrigger>
        <TabsTrigger value="weekly" className={triggerClassName}>
          Weekly
        </TabsTrigger>
        <TabsTrigger value="monthly" className={triggerClassName}>
          Monthly
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}
