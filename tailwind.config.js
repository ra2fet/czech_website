/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f7f9f3',
          100: '#eef2e6',
          200: '#dde6ce',
          300: '#c6d4ab',
          400: '#a8c082',
          500: '#7a9640', // Main company green
          600: '#6b8539',
          700: '#566a2e',
          800: '#465527',
          900: '#3a4722',
          950: '#1e250f',
        },
        secondary: {
          50: '#fefdf8',
          100: '#fdfbf0',
          200: '#fbf5de',
          300: '#f8ecc4',
          400: '#f4dd9f',
          500: '#f9c923', // Main company yellow
          600: '#e6b520',
          700: '#c19a1c',
          800: '#9e7e1a',
          900: '#82681a',
          950: '#47370c',
        },
        accent: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#343433', // Main company charcoal
          950: '#262625',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fefdf8',
          100: '#fdfbf0',
          200: '#fbf5de',
          300: '#f8ecc4',
          400: '#f4dd9f',
          500: '#f9c923',
          600: '#e6b520',
          700: '#c19a1c',
          800: '#9e7e1a',
          900: '#82681a',
          950: '#47370c',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backgroundImage: {
        'world-map': "url('/public/world-map.png')",
      },
    },
  },
  plugins: [],
};
