import { ReactNode, useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import type { Mode } from "@/lib/types";
import { DashboardTabs } from "@/components/Tabs";

type DashboardLayoutProps = {
  children: (mode: Mode) => ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mode, setMode] = useState<Mode>("daily");

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 pt-6">
        <div className="font-mono text-xs tracking-[0.2em] text-text-muted">SSI · Báo Cáo</div>
        <div aria-hidden />
      </header>

      <div className="px-6 pt-4">
        <DashboardTabs value={mode} onValueChange={setMode}>
          <TabsContent value="daily">
            <main className="mx-auto max-w-7xl px-6 pb-24 pt-8">{children("daily")}</main>
          </TabsContent>
          <TabsContent value="weekly">
            <main className="mx-auto max-w-7xl px-6 pb-24 pt-8">{children("weekly")}</main>
          </TabsContent>
          <TabsContent value="monthly">
            <main className="mx-auto max-w-7xl px-6 pb-24 pt-8">{children("monthly")}</main>
          </TabsContent>
        </DashboardTabs>
      </div>
    </div>
  );
}
