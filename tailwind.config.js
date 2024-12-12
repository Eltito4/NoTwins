/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Main app colors
        app: {
          background: '#CADFD9',
          event: '#CADFD9',
          alert: '#E4EDE1',
        },
        
        // Primary color and its variations
        primary: {
          DEFAULT: '#629FA2',
          light: '#7AAFB2',
          dark: '#4A8F92',
          50: '#F0F7F7',
          100: '#E1EEEF',
          200: '#C3DEDF',
          300: '#A5CECF',
          400: '#87BEBF',
          500: '#629FA2', // Main primary color
          600: '#4E8F92',
          700: '#3A7F82',
          800: '#266F72',
          900: '#125F62'
        },

        // Event card specific colors
        event: {
          background: '#CADFD9',
          alert: {
            warning: '#E4EDE1',
            error: '#FEE2E2',
          },
          button: {
            add: '#629FA2',
            delete: '#EF4444',
          },
          text: {
            title: '#1F2937',
            subtitle: '#4B5563',
            body: '#6B7280',
          }
        },

        // Modal/Dialog colors
        modal: {
          background: '#FFFFFF',
          overlay: 'rgba(0, 0, 0, 0.5)',
          button: {
            primary: '#629FA2',
            secondary: '#CADFD9'
          }
        },

        // Fetching modal specific colors
        fetch: {
          background: '#FFFFFF',
          button: {
            fetch: '#629FA2',
            cancel: '#CADFD9'
          },
          input: {
            border: '#629FA2',
            focus: '#4A8F92'
          }
        }
      },

      // Opacity variations available for all colors
      opacity: {
        '0': '0',
        '5': '0.05',
        '10': '0.1',
        '20': '0.2',
        '25': '0.25',
        '30': '0.3',
        '40': '0.4',
        '50': '0.5',
        '60': '0.6',
        '70': '0.7',
        '75': '0.75',
        '80': '0.8',
        '90': '0.9',
        '95': '0.95',
        '100': '1'
      },

      // Shadow configurations
      boxShadow: {
        'event': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'event-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      },

      // Animation configurations
      animation: {
        'ring': 'ring 4s ease-in-out infinite'
      },
      keyframes: {
        ring: {
          '0%, 100%': { transform: 'rotate(-10deg)' },
          '50%': { transform: 'rotate(10deg)' }
        }
      }
    },
  },
  plugins: [],
}