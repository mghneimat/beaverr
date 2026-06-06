/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Blue/navy palette (inspired by UI Examples)
        bg: {
          DEFAULT: '#EFF4FB',
          dark: '#0F1724',
        },
        surface: {
          DEFAULT: '#F8FAFF',
          dark: '#172032',
        },
        primary: {
          DEFAULT: '#1E3A5F',
          hover: '#162B45',
          dark: '#818CF8',
          'dark-hover': '#A5B4FC',
        },
        accent: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          dark: '#60A5FA',
          'dark-hover': '#93C5FD',
        },
        positive: {
          DEFAULT: '#10B981',
          dark: '#22C55E',
        },
        warning: '#F59E0B',
        danger: {
          DEFAULT: '#EF4444',
          dark: '#EF4444',
        },
        debt: {
          DEFAULT: '#6B4FA0',
          dark: '#9F6BFF',
        },
        text: {
          DEFAULT: '#1E3A5F',
          dark: '#E8EAF0',
        },
        muted: {
          DEFAULT: '#6B7A99',
          dark: '#8B95A8',
        },
        border: {
          DEFAULT: '#D1DCF0',
          dark: '#2A3650',
        },
        divider: {
          DEFAULT: '#D1DCF0',
          dark: '#2A3650',
        },
        chip: {
          active: 'rgba(30,58,95,0.1)',
          'active-border': '#1E3A5F',
          'active-dark': 'rgba(129,140,248,0.15)',
          'active-border-dark': '#818CF8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
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
        'xl': '12px',
        'lg': '10px',
        'md': '8px',
      },
    },
  },
  plugins: [],
}
