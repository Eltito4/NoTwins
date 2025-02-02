export interface RetailerConfig {
    name: string;
    defaultCurrency: 'EUR' | 'USD';
    selectors: {
      name: string[];
      price: string[];
      color: string[];
      brand?: string[];
      image: string[];
    };
    transformUrl?: (url: string) => string;
    headers?: Record<string, string>;
    brand?: {
      defaultValue: string;
    };
  }