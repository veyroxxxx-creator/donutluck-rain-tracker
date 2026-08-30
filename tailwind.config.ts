import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="black-purple"]'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        surface2: 'rgb(var(--color-surface-2) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'accent-strong': 'rgb(var(--color-accent-strong) / <alpha-value>)',
        active: 'rgb(var(--color-active) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(0 0 0 / 0.12)',
        card: 'var(--shadow-card)',
        glow: 'var(--shadow-glow)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'rain-fall': {
          '0%': { transform: 'translateY(-120%)', opacity: '0' },
          '10%': { opacity: 'var(--rain-opacity, 0.5)' },
          '90%': { opacity: 'var(--rain-opacity, 0.5)' },
          '100%': { transform: 'translateY(220%)', opacity: '0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'rain-fall': 'rain-fall linear infinite',
        pulseGlow: 'pulseGlow 2.4s ease-in-out infinite',
        fadeUp: 'fadeUp 0.4s ease-out both',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
