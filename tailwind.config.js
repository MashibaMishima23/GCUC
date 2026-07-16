/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef4fb',
          100: '#d5e6f5',
          200: '#b8d4e8',
          300: '#7fb0d6',
          400: '#4a8bbf',
          500: '#2e6da4',
          600: '#1e5490',
          700: '#1e4d8c',
          800: '#1a3a6b',
          900: '#132d55',
        },
        gcuc: {
          navy:   '#1a3a6b',
          royal:  '#1e4d8c',
          steel:  '#2e6da4',
          sky:    '#4a8bbf',
          ice:    '#b8d4e8',
          red:    '#cc2222',
          flame:  '#f5a623',
          white:  '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
