import { useState } from "react";
import { BgPattern } from "./components/BgPattern";
import { DashboardLayout } from "./components/Layout";
import { Hero } from "./components/Hero";
import { Section } from "./components/Section";
import { ToastProvider } from "./components/Toast";
import { useAutoStaleRefresh } from "./lib/use-auto-stale-refresh";

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  useAutoStaleRefresh(unlocked);

  return (
    <ToastProvider>
      <div className="relative min-h-screen overflow-hidden bg-bg-base">
        <BgPattern />
        {unlocked ? (
          <DashboardLayout>{(mode) => <Section mode={mode} />}</DashboardLayout>
        ) : (
          <Hero onUnlock={() => setUnlocked(true)} />
        )}
      </div>
    </ToastProvider>
  );
}
