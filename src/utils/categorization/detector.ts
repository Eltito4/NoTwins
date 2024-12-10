import { CATEGORIES } from './categories';
import { ProductType } from './types';

export function detectProductType(text: string): ProductType {
  const normalizedText = text.toLowerCase();

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

  // Default to garments/other if no specific match found
  return {
    category: 'garments',
    subcategory: 'other',
    name: 'Other'
  };
}

export function getCategoryName(categoryId: string): string {
  const category = CATEGORIES.find(c => c.id === categoryId);
  return category?.name || 'Other';
}

export function getSubcategoryName(categoryId: string, subcategoryId: string): string {
  const category = CATEGORIES.find(c => c.id === categoryId);
  const subcategory = category?.subcategories.find(s => s.id === subcategoryId);
  return subcategory?.name || 'Other';
}

export function getAllCategories() {
  return CATEGORIES;
}

export function getSubcategories(categoryId: string) {
  const category = CATEGORIES.find(c => c.id === categoryId);
  return category?.subcategories || [];
}