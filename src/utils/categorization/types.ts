export interface Category {
    id: string;
    name: string;
    subcategories: Subcategory[];
  }
  
  export interface Subcategory {
    id: string;
    name: string;
    keywords: string[];
  }
  
  export interface ProductType {
    category: string;
    subcategory: string;
  }