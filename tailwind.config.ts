import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
            DEFAULT: '#8A70D6',
            start: '#A370F7',
            end: '#6D53C1'
        },
        "background-light": "#F3F4F6",
        "background-dark": "#0D0D0D",
        "surface-light": "#FFFFFF",
        "surface-dark": "#1A1A1A",
        "muted-light": "#6B7280",
        "muted-dark": "#9CA3AF",
        "subtle-light": "#E5E7EB",
        "subtle-dark": "#374151",
        "accent-green": "#10B981",
        "accent-red": "#EF4444",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      borderRadius: {
        'lg': '1rem',
        'xl': '1.25rem',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [],
};
export default config;
