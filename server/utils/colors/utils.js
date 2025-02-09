import { AVAILABLE_COLORS } from './constants.js';

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