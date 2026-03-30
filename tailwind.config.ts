import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'sans-serif',
        ],
      },
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          card: 'var(--bg-card)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
        },
        destructive: 'var(--destructive)',
        success: 'var(--success)',
        warning: 'var(--warning)',
      },
      borderRadius: {
        pill: '980px',
        card: '12px',
        input: '10px',
        tag: '980px',
        ghost: '8px',
      },
      fontSize: {
        'page-title': ['28px', { fontWeight: '600', letterSpacing: '-0.5px' }],
        'section-header': ['17px', { fontWeight: '600', letterSpacing: '-0.2px' }],
        body: ['15px', { lineHeight: '1.6' }],
        caption: ['13px', { fontWeight: '400' }],
        micro: ['12px', { fontWeight: '400' }],
      },
      maxWidth: {
        content: '1200px',
      },
      spacing: {
        'page-x-desktop': '48px',
        'page-x-tablet': '24px',
        'page-x-mobile': '20px',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'ease',
      },
      boxShadow: {
        none: 'none',
      },
    },
  },
  plugins: [],
}

export default config
