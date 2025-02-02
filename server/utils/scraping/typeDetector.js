import { ARTICLE_TYPES } from './constants.js';

export function detectProductType(text) {
  if (!text) return null;
  
  const normalizedText = text.toLowerCase();

  // Check each category and subcategory
  for (const [categoryId, category] of Object.entries(ARTICLE_TYPES)) {
    for (const [subcategoryId, subcategory] of Object.entries(category.subcategories)) {
      if (subcategory.items.some(keyword => normalizedText.includes(keyword.toLowerCase()))) {
        return {
          category: categoryId,
          subcategory: subcategoryId,
          name: subcategory.name
        };
      }
    }
  }

  // If no specific match found, try to determine the category at least
  for (const [categoryId, category] of Object.entries(ARTICLE_TYPES)) {
    const allKeywords = Object.values(category.subcategories)
      .flatMap(subcategory => subcategory.items);
      
    if (allKeywords.some(keyword => normalizedText.includes(keyword.toLowerCase()))) {
      return {
        category: categoryId,
        subcategory: 'other',
        name: `Other ${category.name}`
      };
    }
  }

  // Default to clothes/other if no match found
  return {
    category: 'clothes',
    subcategory: 'other',
    name: 'Other Clothes'
  };
}

export function getCategoryName(categoryId) {
  return ARTICLE_TYPES[categoryId]?.name || 'Other';
}

export function getSubcategoryName(categoryId, subcategoryId) {
  return ARTICLE_TYPES[categoryId]?.subcategories[subcategoryId]?.name || 'Other';
}

export function getAllCategories() {
  return Object.entries(ARTICLE_TYPES).map(([id, category]) => ({
    id,
    name: category.name,
    subcategories: Object.entries(category.subcategories).map(([subId, sub]) => ({
      id: subId,
      name: sub.name
    }))
  }));
}

export function getSubcategories(categoryId) {
  const category = ARTICLE_TYPES[categoryId];
  if (!category) return [];
  
  return Object.entries(category.subcategories).map(([id, sub]) => ({
    id,
    name: sub.name
  }));
}