/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Warm, dark, slightly toasted background palette.
        ink: {
          DEFAULT: '#14110c',
          900: '#14110c',
          800: '#1b1712',
          700: '#231d16',
          600: '#2c251b',
          500: '#3a3125',
        },
        // Deep gold accent — a nod to energy cards without being childish.
        gold: {
          DEFAULT: '#e0a94b',
          soft: '#f0c67e',
          deep: '#c1852c',
        },
        cream: '#efe9dd',
        muted: '#a1968380',
        stone: '#9a9083',
        // Status hues, muted to fit the dark theme.
        approve: '#5fbf7a',
        deny: '#e26d6d',
        pending: '#e0a94b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.45), 0 10px 30px -16px rgba(0,0,0,.75)',
        lift: '0 8px 34px -10px rgba(0,0,0,.8), 0 0 0 1px rgba(224,169,75,.18)',
        glow: '0 0 0 1px rgba(224,169,75,.35), 0 8px 30px -12px rgba(224,169,75,.25)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in .3s ease-out both',
        'scale-in': 'scale-in .18s ease-out both',
      },
    },
  },
  plugins: [],
};
