import { CATEGORIES } from './categories';
import { ProductType, ProductTypeImpl } from './types';

export function detectProductType(text: string): ProductType {
  const normalizedText = text.toLowerCase();

  // First try to find a match in subcategories
  for (const category of CATEGORIES) {
    for (const subcategory of category.subcategories) {
      if (subcategory.keywords.some(keyword => normalizedText.includes(keyword.toLowerCase()))) {
        return new ProductTypeImpl(
          category.id,
          subcategory.id,
          subcategory.name
        );
      }
    }
  }

  // If no specific match, try to determine the category at least
  for (const category of CATEGORIES) {
    const allKeywords = category.subcategories.flatMap(sub => sub.keywords);
    if (allKeywords.some(keyword => normalizedText.includes(keyword.toLowerCase()))) {
      return new ProductTypeImpl(
        category.id,
        'other',
        `Other ${category.name}`
      );
    }
  }

  // Default to garments/other if no match found
  return new ProductTypeImpl('garments', 'other', 'Other');
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