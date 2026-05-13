import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem"
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: [
          "var(--font-sans)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace"
        ]
      },
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface-1) / <alpha-value>)",
          1: "rgb(var(--surface-1) / <alpha-value>)",
          2: "rgb(var(--surface-2) / <alpha-value>)",
          3: "rgb(var(--surface-3) / <alpha-value>)"
        },
        border: {
          DEFAULT: "rgb(var(--border-subtle) / <alpha-value>)",
          subtle: "rgb(var(--border-subtle) / <alpha-value>)",
          strong: "rgb(var(--border-strong) / <alpha-value>)"
        },
        fg: {
          DEFAULT: "rgb(var(--text-primary) / <alpha-value>)",
          primary: "rgb(var(--text-primary) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary) / <alpha-value>)",
          muted: "rgb(var(--text-muted) / <alpha-value>)"
        },
        brand: {
          red: "rgb(var(--accent-red) / <alpha-value>)",
          navy: "rgb(var(--accent-navy) / <alpha-value>)",
          blue: "rgb(var(--accent-blue) / <alpha-value>)"
        },
        status: {
          success: "rgb(var(--status-success) / <alpha-value>)",
          warning: "rgb(var(--status-warning) / <alpha-value>)",
          error: "rgb(var(--status-error) / <alpha-value>)"
        },
        zoning: {
          konut: "rgb(var(--z-konut) / <alpha-value>)",
          "konut-stroke": "rgb(var(--z-konut-stroke) / <alpha-value>)",
          ticaret: "rgb(var(--z-ticaret) / <alpha-value>)",
          "ticaret-stroke": "rgb(var(--z-ticaret-stroke) / <alpha-value>)",
          karma: "rgb(var(--z-karma) / <alpha-value>)",
          "karma-stroke": "rgb(var(--z-karma-stroke) / <alpha-value>)",
          sanayi: "rgb(var(--z-sanayi) / <alpha-value>)",
          "sanayi-stroke": "rgb(var(--z-sanayi-stroke) / <alpha-value>)",
          yesil: "rgb(var(--z-yesil) / <alpha-value>)",
          "yesil-stroke": "rgb(var(--z-yesil-stroke) / <alpha-value>)",
          tarim: "rgb(var(--z-tarim) / <alpha-value>)",
          "tarim-stroke": "rgb(var(--z-tarim-stroke) / <alpha-value>)",
          kamu: "rgb(var(--z-kamu) / <alpha-value>)",
          "kamu-stroke": "rgb(var(--z-kamu-stroke) / <alpha-value>)",
          turizm: "rgb(var(--z-turizm) / <alpha-value>)",
          "turizm-stroke": "rgb(var(--z-turizm-stroke) / <alpha-value>)"
        }
      },
      borderRadius: {
        none: "0",
        sm: "4px",
        DEFAULT: "6px",
        md: "6px",
        lg: "8px",
        xl: "12px"
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(0,0,0,0.04), 0 1px 2px 0 rgba(0,0,0,0.06)",
        pop: "0 4px 8px -2px rgba(15,23,42,0.10), 0 2px 4px -2px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.04)",
        sheet: "0 -8px 24px -6px rgba(0,0,0,0.18), 0 -2px 8px -2px rgba(0,0,0,0.10)",
        "card-dark": "0 1px 0 0 rgba(0,0,0,0.55), 0 1px 2px 0 rgba(0,0,0,0.45)",
        "pop-dark": "0 8px 24px -6px rgba(0,0,0,0.65), 0 2px 6px -1px rgba(0,0,0,0.45)"
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px", letterSpacing: "0.04em" }],
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["13px", { lineHeight: "18px" }],
        base: ["14px", { lineHeight: "20px" }],
        md: ["15px", { lineHeight: "22px" }],
        lg: ["16px", { lineHeight: "22px" }],
        xl: ["18px", { lineHeight: "26px" }],
        "2xl": ["22px", { lineHeight: "28px" }],
        "3xl": ["28px", { lineHeight: "34px" }]
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" }
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 180ms ease-out",
        "accordion-up": "accordion-up 180ms ease-out",
        shimmer: "shimmer 1.4s infinite",
        "fade-in": "fade-in 150ms ease-out"
      }
    }
  },
  plugins: []
};

export default config;
