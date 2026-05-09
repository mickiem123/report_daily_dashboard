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
  "rounded-full px-5 py-2 text-sm transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal/60",
  "data-[state=active]:bg-accent-teal/15 data-[state=active]:text-accent-teal data-[state=active]:shadow-[0_0_24px_rgba(95,201,178,0.25)]",
  "data-[state=inactive]:text-text-muted data-[state=inactive]:hover:text-text-primary",
);

export function DashboardTabs({ value, onValueChange, children }: DashboardTabsProps) {
  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(next as Mode)} className="w-full">
      <TabsList className="sticky top-4 z-30 mx-auto flex w-fit gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-md">
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
