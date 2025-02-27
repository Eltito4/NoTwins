// Color mappings with translations and variations
export const COLOR_MAPPINGS = {
    // English
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
    'beige': 'Beige',
    'cream': 'Cream',
    'ivory': 'Ivory',
    'gold': 'Gold',
    'silver': 'Silver',
    'bronze': 'Bronze',
    'burgundy': 'Burgundy',
    'maroon': 'Maroon',
    'teal': 'Teal',
    'olive': 'Olive',
    'khaki': 'Khaki',
    // Spanish translations
    'negro': 'Black',
    'blanco': 'White',
    'rojo': 'Red',
    'azul': 'Blue',
    'verde': 'Green',
    'amarillo': 'Yellow',
    'morado': 'Purple',
    'rosa': 'Pink',
    'naranja': 'Orange',
    'marrón': 'Brown',
    'gris': 'Gray',
    'dorado': 'Gold',
    'plateado': 'Silver',
    'beige': 'Beige',
    'crema': 'Cream',
    'marfil': 'Ivory'
  };
  
  export const AVAILABLE_COLORS = [
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Red', value: '#FF0000' },
    { name: 'Blue', value: '#0000FF' },
    { name: 'Green', value: '#008000' },
    { name: 'Yellow', value: '#FFD700' },
    { name: 'Purple', value: '#800080' },
    { name: 'Pink', value: '#FFC0CB' },
    { name: 'Orange', value: '#FFA500' },
    { name: 'Brown', value: '#8B4513' },
    { name: 'Gray', value: '#808080' },
    { name: 'Navy Blue', value: '#000080' },
    { name: 'Beige', value: '#F5F5DC' },
    { name: 'Gold', value: '#FFD700' },
    { name: 'Silver', value: '#C0C0C0' },
    { name: 'Bronze', value: '#CD7F32' },
    { name: 'Burgundy', value: '#800020' },
    { name: 'Maroon', value: '#800000' },
    { name: 'Teal', value: '#008080' },
    { name: 'Olive', value: '#808000' },
    { name: 'Khaki', value: '#F0E68C' },
    { name: 'Cream', value: '#FFFDD0' },
    { name: 'Ivory', value: '#FFFFF0' },
    { name: 'Light Blue', value: '#ADD8E6' },
    { name: 'Dark Blue', value: '#00008B' },
    { name: 'Light Green', value: '#90EE90' },
    { name: 'Dark Green', value: '#006400' },
    { name: 'Light Pink', value: '#FFB6C1' },
    { name: 'Hot Pink', value: '#FF69B4' },
    { name: 'Light Gray', value: '#D3D3D3' },
    { name: 'Dark Gray', value: '#A9A9A9' }
  ];
  
  export function findClosestNamedColor(color) {
    if (!color) return null;
    
    const normalizedInput = color.toLowerCase().trim();
    
    // Check for patterns first
    const patterns = ['leopard', 'tiger', 'snake', 'zebra', 'animal', 'floral'];
    for (const pattern of patterns) {
      if (normalizedInput.includes(pattern)) {
        return `${pattern.charAt(0).toUpperCase() + pattern.slice(1)} Print`;
      }
    }
    
    // Direct match
    const directMatch = AVAILABLE_COLORS.find(c => 
      c.name.toLowerCase() === normalizedInput
    );
    if (directMatch) return directMatch.name;
  
    // Check for compound colors (e.g., "light blue", "dark green")
    const words = normalizedInput.split(/\s+/);
    if (words.length > 1) {
      const modifier = words[0];
      const baseColor = words.slice(1).join(' ');
      const colorMatch = AVAILABLE_COLORS.find(c => 
        c.name.toLowerCase() === baseColor
      );
      
      if (colorMatch && ['light', 'dark', 'bright', 'pale', 'deep'].includes(modifier)) {
        return `${modifier.charAt(0).toUpperCase() + modifier.slice(1)} ${colorMatch.name}`;
      }
    }
  
    // Partial match
    const partialMatch = AVAILABLE_COLORS.find(c => 
      normalizedInput.includes(c.name.toLowerCase())
    );
    if (partialMatch) return partialMatch.name;
  
    // Default to most similar color based on word presence
    for (const color of AVAILABLE_COLORS) {
      const colorWords = color.name.toLowerCase().split(/\s+/);
      if (colorWords.some(word => normalizedInput.includes(word))) {
        return color.name;
      }
    }
  
    return null;
  }
  
  export function normalizeColorName(color) {
    return color.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  export function getColorValue(colorName) {
    const color = AVAILABLE_COLORS.find(c => c.name === colorName);
    return color?.value;
  }