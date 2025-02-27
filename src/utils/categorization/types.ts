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
  name: string;
  toString(): string;
}

// Create a class that implements ProductType to handle string conversion
export class ProductTypeImpl implements ProductType {
  constructor(
    public category: string,
    public subcategory: string,
    public name: string
  ) {}

  toString(): string {
    return this.name;
  }
}