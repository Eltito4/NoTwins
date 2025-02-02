import { RetailerConfig } from '../types';

export const carolinaHerreraConfig: RetailerConfig = {
  name: 'Carolina Herrera',
  defaultCurrency: 'EUR',
  selectors: {
    name: [
      '.product-name h1',
      '[data-testid="product-name"]',
      '.pdp-title'
    ],
    price: [
      '.product-price',
      '[data-testid="product-price"]',
      '.price-value'
    ],
    color: [
      '.selected-color',
      '[data-testid="selected-color"]',
      '.color-selector .active'
    ],
    image: [
      '.product-image img',
      '[data-testid="product-image"]',
      'meta[property="og:image"]'
    ]
  },
  brand: {
    defaultValue: 'Carolina Herrera'
  }
};