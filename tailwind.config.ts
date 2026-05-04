import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: "#111827",
        panel: "#182033",
        ink: "#e5e7eb",
        muted: "#94a3b8",
        accent: "#22c55e",
        warn: "#f97316"
      }
    }
  },
  plugins: []
};

export default config;
