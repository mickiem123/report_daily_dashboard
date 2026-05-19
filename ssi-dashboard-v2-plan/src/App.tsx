import { useEffect, useState } from "react";
import { BgPattern } from "./components/BgPattern";
import { DashboardLayout } from "./components/Layout";
import { Hero } from "./components/Hero";
import { Section } from "./components/Section";
import { ToastProvider } from "./components/Toast";
import { useAutoStaleRefresh } from "./lib/use-auto-stale-refresh";

type Theme = "dark" | "light";
const THEME_STORAGE_KEY = "ssi-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
}

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  useAutoStaleRefresh(unlocked);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  return (
    <ToastProvider>
      <div className="relative min-h-screen overflow-hidden bg-canvas text-ink">
        <BgPattern />
        {unlocked ? (
          <DashboardLayout theme={theme} onToggleTheme={handleToggleTheme}>
            {(mode) => <Section mode={mode} />}
          </DashboardLayout>
        ) : (
          <Hero onUnlock={() => setUnlocked(true)} />
        )}
      </div>
    </ToastProvider>
  );
}
