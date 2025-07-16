/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  important: true,
  theme: {
    extend: {
      colors: {
        // Main colors
        background: '#CADFD9',
        primary: {
          DEFAULT: '#629FA2',
          hover: '#548b8e',
        },
        
        // Event card colors
        eventCard: {
          DEFAULT: '#FEFCE9',
          hover: '#bbd2cc',
        },
        
        // Text colors
        text: {
          primary: '#1F2937',
          secondary: '#4B5563',
          muted: '#6B7280',
        },
        
        // Feedback colors
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
        
        // Utility colors
        border: '#E5E7EB',
        divider: '#D1D5DB',
        overlay: 'rgba(0, 0, 0, 0.5)',
      },
      
      backgroundColor: theme => ({
        ...theme('colors'),
        modal: '#FFFFFF',
        alert: {
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        }
      }),
      
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