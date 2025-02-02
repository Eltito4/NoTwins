export function findClosestNamedColor(color) {
    if (!color) return null;
    
    // Basic color mapping
    const colorMap = {
      'black': 'Black',
      'white': 'White',
      'red': 'Red',
      'blue': 'Blue',
      'green': 'Green',
      'yellow': 'Yellow',
      'purple': 'Purple',
      'pink': 'Pink',
      'orange': 'Orange',
      'brown': 'Brown',
      'gray': 'Gray',
      'grey': 'Gray',
      'navy': 'Navy Blue',
      'beige': 'Beige'
    };
  
    const normalizedColor = color.toLowerCase().trim();
    
    // Direct match
    if (colorMap[normalizedColor]) {
      return colorMap[normalizedColor];
    }
  
    // Check for compound colors (e.g., "light blue", "dark green")
    const words = normalizedColor.split(/\s+/);
    if (words.length > 1) {
      const modifier = words[0];
      const baseColor = words.slice(1).join(' ');
      if (colorMap[baseColor] && ['light', 'dark', 'bright', 'pale', 'deep'].includes(modifier)) {
        return `${modifier.charAt(0).toUpperCase() + modifier.slice(1)} ${colorMap[baseColor]}`;
      }
    }
  
    // Return the original color if no match found
    return color;
  }