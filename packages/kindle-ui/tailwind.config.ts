import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './.storybook/**/*.{js,ts,jsx,tsx}',
  ],
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
          screen: 'var(--ku-device-screen)',
          'screen-border': 'var(--ku-device-screen-border)',
          logo: 'var(--ku-device-logo)',
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
        kindle: 'var(--ku-radius-kindle)',
        screen: 'var(--ku-radius-screen)',
        dialog: 'var(--ku-radius-dialog)',
      },
      boxShadow: {
        eink: 'var(--ku-shadow-eink)',
        screen: 'var(--ku-shadow-screen)',
        shell: 'var(--ku-shadow-shell)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderWidth: {
        '3': '3px',
      },
      transitionDuration: {
        flash: 'var(--ku-motion-flash)',
      },
    },
  },
  plugins: [],
} satisfies Config
