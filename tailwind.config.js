/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#CADFD9',
        eventCard: '#CADFD9',
        primary: {
          DEFAULT: '#629FA2',
          50: '#edf4f4',
          100: '#dbeaeb',
          200: '#b7d5d7',
          300: '#93c0c2',
          400: '#6fabae',
          500: '#629FA2',  // Our main primary color
          600: '#588f92',
          700: '#4e7f82',
          800: '#446f71',
          900: '#3a5f61'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        ring: {
          '0%, 100%': { transform: 'rotate(-10deg)' },
          '50%': { transform: 'rotate(10deg)' }
        }
      },
      animation: {
        ring: 'ring 4s ease-in-out infinite'
      },
      boxShadow: {
        'event': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}