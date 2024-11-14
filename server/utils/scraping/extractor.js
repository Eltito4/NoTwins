import { COLOR_MAPPINGS, CLOTHING_TYPES, COMMON_MATERIALS } from './mappings.js';

export function extractPrice(text) {
  if (!text) return null;
  
  // Remove currency symbols and normalize decimal separator
  const normalized = text.replace(/[^\d.,]/g, '').replace(/[.,](\d{2})$/, '.$1').replace(/[.,]/g, '');
  const price = parseFloat(normalized);
  
  return isNaN(price) ? null : price;
}

export function normalizeColor(color) {
  if (!color) return null;
  color = color.toLowerCase().trim();
  
  // Check direct mapping
  if (COLOR_MAPPINGS[color]) {
    return COLOR_MAPPINGS[color];
  }

  // Check if color is contained in any mapping
  for (const [key, value] of Object.entries(COLOR_MAPPINGS)) {
    if (color.includes(key)) {
      return value;
    }
  }

  return color;
}

export function detectClothingType(text) {
  if (!text) return 'other';
  text = text.toLowerCase();
  
  for (const [type, keywords] of Object.entries(CLOTHING_TYPES)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return type;
    }
  }
  
  return 'other';
}

export function extractMaterials(text) {
  if (!text) return null;
  
  const materials = [];
  const lowerText = text.toLowerCase();

  // Find direct material mentions
  for (const material of COMMON_MATERIALS) {
    if (lowerText.includes(material)) {
      materials.push(material);
    }
  }

  // Look for percentage patterns (e.g., "80% cotton")
  const percentageRegex = /(\d+)%\s*([a-zA-Z]+)/g;
  let match;
  while ((match = percentageRegex.exec(lowerText)) !== null) {
    const material = match[2];
    if (COMMON_MATERIALS.includes(material)) {
      materials.push(`${match[1]}% ${material}`);
    }
  }

  return materials.length > 0 ? materials.join(', ') : null;
}