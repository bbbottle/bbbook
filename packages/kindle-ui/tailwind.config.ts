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
          screenframe: {
            top: 'var(--ku-device-screen-frame-top)',
            bottom: 'var(--ku-device-screen-frame-bottom)',
            left: 'var(--ku-device-screen-frame-left)',
            right: 'var(--ku-device-screen-frame-right)',
          },
          logo: 'var(--ku-device-logo)',
        },
      },
      fontFamily: {
        sans: [
          '"Amazon Ember"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        serif: [
          'Bookerly',
          'ui-serif',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'Times',
          'serif',
        ],
      },
      borderRadius: {
        sm: 'var(--ku-radius-sm)',
        md: 'var(--ku-radius-md)',
        lg: 'var(--ku-radius-lg)',
        kindle: 'var(--ku-radius-kindle)',
        screen: 'var(--ku-radius-screen)',
        dialog: 'var(--ku-radius-dialog)',
        screenFrame: 'var(--ku-radius-screenFrame)',
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
        DEFAULT: '1px',
      },
      transitionDuration: {
        flash: 'var(--ku-motion-flash)',
      },
    },
  },
  plugins: [],
} satisfies Config
