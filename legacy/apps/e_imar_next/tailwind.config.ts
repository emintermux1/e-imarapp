import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: 'var(--bg-base)',
          surface: 'var(--bg-surface)',
          subtle: 'var(--bg-subtle)',
          inverse: 'var(--bg-inverse)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)',
        },
        border: {
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
          subtle: 'var(--border-subtle)',
        },
        brand: {
          navy: 'var(--brand-navy)',
          'muted-blue': 'var(--brand-muted-blue)',
        },
        state: {
          'gov-red': 'var(--state-gov-red)',
          warn: 'var(--state-warn)',
          success: 'var(--state-success)',
          info: 'var(--state-info)',
        },
        map: {
          'parcel-fill': 'var(--map-parcel-fill)',
          'parcel-stroke': 'var(--map-parcel-stroke)',
          'plan-fill': 'var(--map-plan-fill)',
          'risk-overlay': 'var(--map-risk-overlay)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        data: ['var(--font-plex)', '"IBM Plex Sans"', 'monospace'],
      },
      fontSize: {
        h1: ['28px', { lineHeight: '34px', fontWeight: '600' }],
        h2: ['22px', { lineHeight: '28px', fontWeight: '600' }],
        h3: ['18px', { lineHeight: '24px', fontWeight: '500' }],
        body: ['14px', { lineHeight: '20px', fontWeight: '400' }],
        data: ['12px', { lineHeight: '16px', fontWeight: '500' }],
      },
      spacing: {
        '1.5': '6px',
        '4.5': '18px',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        panel: '0 1px 2px rgba(15,39,67,0.04), 0 4px 12px rgba(15,39,67,0.06)',
        sheet: '0 -8px 24px rgba(15,39,67,0.10)',
        focus: '0 0 0 3px rgba(45,91,136,0.30)',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
