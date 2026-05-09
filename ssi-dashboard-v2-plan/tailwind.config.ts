import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
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
    },
  },
  plugins: [],
};

export default config;
