import { CATEGORIES } from './categories.js';

export function detectProductType(text) {
  if (!text) return null;
  
  const normalizedText = text.toLowerCase();

  // First try to find a match in subcategories
  for (const category of CATEGORIES) {
    for (const subcategory of category.subcategories) {
      if (subcategory.keywords.some(keyword => normalizedText.includes(keyword.toLowerCase()))) {
        return {
          category: category.id,
          subcategory: subcategory.id,
          name: subcategory.name
        };
      }
    }
  }

  // If no specific match, try to determine the category at least
  for (const category of CATEGORIES) {
    const allKeywords = category.subcategories.flatMap(sub => sub.keywords);
    if (allKeywords.some(keyword => normalizedText.includes(keyword.toLowerCase()))) {
      return {
        category: category.id,
        subcategory: 'other',
        name: `Other ${category.name}`
      };
    }
  }

  // Default to clothes/other if no match found
  return {
    category: 'clothes',
    subcategory: 'other',
    name: 'Other'
  };
}

export function getCategoryName(categoryId) {
  const category = CATEGORIES.find(c => c.id === categoryId);
  return category?.name || 'Other';
}

export function getSubcategoryName(categoryId, subcategoryId) {
  const category = CATEGORIES.find(c => c.id === categoryId);
  const subcategory = category?.subcategories.find(s => s.id === subcategoryId);
  return subcategory?.name || 'Other';
}

export function getAllCategories() {
  return CATEGORIES;
}

export function getSubcategories(categoryId) {
  const category = CATEGORIES.find(c => c.id === categoryId);
  return category?.subcategories || [];
}