/** @type {import('tailwindcss').Config} */
const { PALETTES } = require('./constants/palette');

const light = PALETTES.light;
const dark = PALETTES.dark;

module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: ['class', '[data-color-scheme="dark"]'],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: light.bg,
          dark: dark.bg,
        },
        surface: {
          DEFAULT: light.surface,
          tint: light.surfaceTint,
          dark: dark.surface,
        },
        primary: {
          DEFAULT: light.primary,
          hover: light.primaryPressed,
          dark: dark.primary,
          'dark-hover': dark.primaryPressed,
        },
        accent: {
          DEFAULT: light.accent,
          hover: light.accentPressed,
          dark: dark.accent,
          'dark-hover': dark.accentPressed,
        },
        delight: {
          DEFAULT: light.delight,
          dark: dark.delight,
        },
        positive: {
          DEFAULT: light.positive,
          bg: light.positiveBg,
          border: light.positiveBorder,
          dark: dark.positive,
        },
        warning: {
          DEFAULT: light.warning,
          bg: light.warningBg,
          border: light.warningBorder,
          cycle: light.cycleWarning,
        },
        danger: {
          DEFAULT: light.danger,
          bg: light.dangerBg,
          border: light.dangerBorder,
          dark: dark.danger,
        },
        info: {
          DEFAULT: light.info,
          bg: light.infoBg,
          border: light.infoBorder,
        },
        debt: {
          DEFAULT: light.debt,
          dark: dark.debt,
        },
        text: {
          DEFAULT: light.text,
          dark: dark.text,
        },
        muted: {
          DEFAULT: light.muted,
          dark: dark.muted,
        },
        border: {
          DEFAULT: light.border,
          dark: dark.border,
        },
        divider: {
          DEFAULT: light.border,
          dark: dark.border,
        },
        chip: {
          active: light.overlaySelected,
          'active-border': light.primary,
          'active-dark': dark.overlaySelected,
          'active-border-dark': dark.primary,
        },
        selected: {
          bg: light.selectedBg,
          text: light.selectedText,
        },
      },
      fontFamily: {
        sans: ['GeneralSans-Regular', 'system-ui', 'sans-serif'],
        serif: ['DM Serif Display', 'serif'],
        mono: ['DM Mono', 'monospace'],
      },
      fontSize: {
        'display': ['32px', { lineHeight: '1.12', fontWeight: '400' }],
        'section': ['24px', { lineHeight: '1.2', fontWeight: '400' }],
        'body': ['15px', { lineHeight: '1.6', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '1.4', fontWeight: '500' }],
        'money-large': ['40px', { lineHeight: '1.1', fontWeight: '300' }],
        'eyebrow': ['11px', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.12em' }],
      },
      borderRadius: {
        card: '22px',
        input: '22px',
        pill: '999px',
        xl: '22px',
        lg: '22px',
        md: '16px',
      },
    },
  },
  plugins: [],
};
