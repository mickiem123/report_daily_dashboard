import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        "canvas-soft": "var(--canvas-soft)",
        "canvas-night": "var(--canvas-night)",
        ink: "var(--ink)",
        "ink-secondary": "var(--ink-secondary)",
        "ink-mute": "var(--ink-mute)",
        "ink-faint": "var(--ink-faint)",
        hairline: "var(--hairline)",
        "hairline-strong": "var(--hairline-strong)",
        primary: "var(--primary)",
        "primary-deep": "var(--primary-deep)",
        "on-primary": "var(--on-primary)",
        "on-dark": "var(--on-dark)",
        "bg-base": "var(--bg-base)",
        "bg-elev": "var(--bg-elev)",
        "text-primary": "var(--text-primary)",
        "text-muted": "var(--text-muted)",
        "accent-teal": "var(--accent-teal)",
        "accent-emerald": "var(--accent-emerald)",
        "accent-cyan": "var(--accent-cyan)",
        "status-up": "var(--status-up)",
        "status-down": "var(--status-down)",
        "status-flat": "var(--status-flat)",
      },
      borderColor: {
        glass: "var(--border-glass)",
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(0,0,0,0.06)",
        panel: "0 8px 24px rgba(0,0,0,0.08)",
        modal: "0 16px 48px rgba(0,0,0,0.12)",
      },
      fontFamily: {
        sans: ["Inter", "\"Helvetica Neue\"", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "Menlo", "Monaco", "Consolas", "\"Liberation Mono\"", "monospace"],
        number: [
          "\"Geist Mono\"",
          "ui-monospace",
          "Menlo",
          "Monaco",
          "Consolas",
          "\"Liberation Mono\"",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
