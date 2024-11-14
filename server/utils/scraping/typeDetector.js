import { ARTICLE_TYPES } from './constants.js';

export function detectArticleType(name, description = '') {
  const text = `${name} ${description}`.toLowerCase();

  // Check for Spanish dress keywords first
  if (text.includes('vestido')) {
    return 'dress';
  }

  // Special case for German product names
  if (text.includes('bluse')) return 'top';
  if (text.includes('t-shirt') || text.includes('tshirt')) return 'top';

  // Check each type and its variations
  for (const [type, keywords] of Object.entries(ARTICLE_TYPES)) {
    // Check for exact word matches using word boundaries
    const hasMatch = keywords.some(keyword => {
      // Handle multi-word keywords properly
      const escapedKeyword = keyword.toLowerCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const pattern = new RegExp(`\\b${escapedKeyword}\\b`);
      return pattern.test(text);
    });
    
    if (hasMatch) {
      return type;
    }
  }

  // Additional checks for common product name patterns
  if (/\b(vestido|dress|kleid)\b/i.test(text)) return 'dress';
  if (/\b(shirt|hemd|oberteile?)\b/i.test(text)) return 'top';
  if (/\b(hose|pants|trousers)\b/i.test(text)) return 'pants';
  if (/\b(jacke|jacket|coat)\b/i.test(text)) return 'outerwear';
  if (/\b(schuhe|shoes|boots)\b/i.test(text)) return 'shoes';
  if (/\b(tasche|bag|purse)\b/i.test(text)) return 'bags';
  if (/\b(schmuck|jewelry)\b/i.test(text)) return 'jewelry';

  // Check description for type hints
  if (text.includes('manga') || text.includes('escote')) {
    return 'dress';
  }

  // If no specific type is found, check for generic clothing words
  const genericClothing = [
    'wear', 'clothing', 'apparel', 'fashion', 'outfit',
    'ropa', 'vêtement', 'kleidung', 'abbigliamento'
  ];

  if (genericClothing.some(word => text.includes(word))) {
    return 'clothing';
  }

  return 'other';
}