/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        agrigreen: {
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
        },
        earth: {
          50: '#fbf8f3',
          100: '#f4ede1',
          200: '#e8dac3',
          300: '#d9c29f',
          400: '#c5a478',
          500: '#b38b59',
          600: '#9b7145',
          700: '#7b5737',
          800: '#644730',
          900: '#533b2a',
        }
      }
    },
  },
  plugins: [],
}
