export const colors = {
    // Base colors
    background: '#CADFD9',
    eventCard: '#CADFD9',
    primary: '#629FA2',
    
    // Semantic colors
    text: {
      primary: '#1F2937',
      secondary: '#4B5563',
      muted: '#6B7280',
    },
    
    // State colors
    hover: {
      primary: '#548b8e',  // Darker shade of primary
      background: '#bbd2cc', // Darker shade of background
    },
    
    // Feedback colors
    success: '#10B981',
    error: '#F8D4D8',
    warning: '#F8CE47',
    info: '#3B82F6',
    
    // Utility colors
    border: '#E5E7EB',
    divider: '#D1D5DB',
    overlay: 'rgba(0, 0, 0, 0.5)',
  };
  
  export const gradients = {
    primary: `linear-gradient(to right, ${colors.primary}, ${colors.hover.primary})`,
  };
  
  export type ColorScheme = typeof colors;