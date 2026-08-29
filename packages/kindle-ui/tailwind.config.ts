import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './.storybook/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: 'var(--ku-surface)',
        paper: 'var(--ku-paper)',
        ink: 'var(--ku-ink)',
        muted: 'var(--ku-muted)',
        subtle: 'var(--ku-subtle)',
        divider: 'var(--ku-divider)',
        accent: 'var(--ku-accent)',
        focus: 'var(--ku-focus)',
        device: {
          shell: 'var(--ku-device-shell)',
          bezel: 'var(--ku-device-bezel)',
          inset: 'var(--ku-device-inset)',
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        serif: [
          'ui-serif',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'Times',
          'serif',
        ],
      },
      borderRadius: {
        kindle: '24px',
        screen: '4px',
        dialog: '6px',
      },
      boxShadow: {
        eink: 'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -2px 7px rgba(0,0,0,0.08)',
        screen: 'inset 0 0 5px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.32)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
} satisfies Config
