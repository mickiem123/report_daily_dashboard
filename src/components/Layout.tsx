import { ReactNode, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import type { Mode } from "@/lib/types";
import { DashboardTabs } from "@/components/Tabs";

type DashboardLayoutProps = {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  children: (mode: Mode) => ReactNode;
};

export function DashboardLayout({ theme, onToggleTheme, children }: DashboardLayoutProps) {
  const [mode, setMode] = useState<Mode>("daily");

  return (
    <div className="relative z-10 min-h-screen bg-bg-base text-text-primary">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between border-b border-hairline px-6 py-5">
        <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
          SSI Bao Cao
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex h-8 items-center gap-2 rounded-sm border border-hairline bg-canvas-soft px-2.5 text-xs font-medium text-text-primary transition-colors hover:border-hairline-strong hover:bg-bg-elev"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          <span>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>
      </header>

      <div className="px-4 pt-6 md:px-6">
        <DashboardTabs value={mode} onValueChange={setMode}>
          <TabsContent value="daily">
            <main className="mx-auto max-w-7xl px-2 pb-24 pt-8 md:px-6">{children("daily")}</main>
          </TabsContent>
          <TabsContent value="weekly">
            <main className="mx-auto max-w-7xl px-2 pb-24 pt-8 md:px-6">{children("weekly")}</main>
          </TabsContent>
          <TabsContent value="monthly">
            <main className="mx-auto max-w-7xl px-2 pb-24 pt-8 md:px-6">{children("monthly")}</main>
          </TabsContent>
        </DashboardTabs>
      </div>
    </div>
  );
}
