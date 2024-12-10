import { ARTICLE_TYPES } from './constants.js';

export function detectProductType(text) {
  const normalizedText = text.toLowerCase();

  // Check for garments first
  for (const [type, keywords] of Object.entries(ARTICLE_TYPES)) {
    if (keywords.some(keyword => normalizedText.includes(keyword.toLowerCase()))) {
      return {
        category: type.includes('dress') || type.includes('top') || type.includes('pants') || type.includes('skirt') ? 'garments' : 'accessories',
        subcategory: type,
        name: type.charAt(0).toUpperCase() + type.slice(1)
      };
    }
  }

  // Default to garments/other if no specific match found
  return {
    category: 'garments',
    subcategory: 'other',
    name: 'Other'
  };
}