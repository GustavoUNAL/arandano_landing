/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        berry: {
          50: '#f5f0f8',
          100: '#e8d8ed',
          200: '#d4b5dc',
          300: '#b889c5',
          400: '#9a5fa8',
          500: '#7d4289',
          600: '#65346f',
          700: '#4A2C5A',
          800: '#3d2450',
          900: '#2a1a35',
          950: '#1a0f23',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'serif'],
      },
    },
  },
  plugins: [],
}

