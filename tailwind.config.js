/** @type {import('tailwindcss').Config} */
import { colors } from './src/utils/theme/colors';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Main colors
        background: colors.background,
        primary: {
          DEFAULT: colors.primary,
          hover: colors.hover.primary,
        },
        
        // Event card colors
        eventCard: {
          DEFAULT: colors.eventCard,
          hover: colors.hover.background,
        },
        
        // Text colors
        text: colors.text,
        
        // Feedback colors
        success: colors.success,
        error: colors.error,
        warning: colors.warning,
        info: colors.info,
        
        // Utility colors
        border: colors.border,
        divider: colors.divider,
        overlay: colors.overlay,
      },
      
      backgroundColor: theme => ({
        ...theme('colors'),
        modal: '#FFFFFF',
        alert: {
          warning: colors.warning,
          error: colors.error,
          info: colors.info,
        }
      }),
      
      textColor: theme => ({
        ...theme('colors'),
      }),
      
      borderColor: theme => ({
        ...theme('colors'),
      }),
      
      // Opacity configurations
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
        '100': '1',
      },
      
      // Shadow configurations  
      boxShadow: {
        'event': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'event-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      
      // Animation configurations
      animation: {
        'ring': 'ring 4s ease-in-out infinite',
      },
      keyframes: {
        ring: {
          '0%, 100%': { transform: 'rotate(-10deg)' },
          '50%': { transform: 'rotate(10deg)' },
        },
      },
    },
  },
  plugins: [],
}