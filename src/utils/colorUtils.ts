export interface ColorInfo {
    name: string;
    value: string;
  }
  
  export const AVAILABLE_COLORS: ColorInfo[] = [
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
    { name: 'Dark Gray', value: '#A9A9A9' },
    { name: 'Coral', value: '#FF7F50' },
    { name: 'Turquoise', value: '#40E0D0' },
    { name: 'Lavender', value: '#E6E6FA' },
    { name: 'Mint', value: '#98FF98' },
    { name: 'Salmon', value: '#FA8072' },
    { name: 'Plum', value: '#DDA0DD' },
    { name: 'Indigo', value: '#4B0082' },
    { name: 'Violet', value: '#8F00FF' },
    { name: 'Magenta', value: '#FF00FF' }
  ];
  
  export function findClosestNamedColor(color: string): string | null {
    if (!color) return null;
    
    // Normalize color input
    const normalizedColor = color.toLowerCase().trim();
    
    // Direct match
    const directMatch = AVAILABLE_COLORS.find(c => 
      c.name.toLowerCase() === normalizedColor
    );
    if (directMatch) return directMatch.name;
  
    // Check for partial matches
    const partialMatch = AVAILABLE_COLORS.find(c => 
      normalizedColor.includes(c.name.toLowerCase())
    );
    if (partialMatch) return partialMatch.name;
  
    return null;
  }
  
  export function normalizeColorName(color: string): string {
    return color.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  export function getColorValue(colorName: string): string | undefined {
    const color = AVAILABLE_COLORS.find(c => c.name === colorName);
    return color?.value;
  }