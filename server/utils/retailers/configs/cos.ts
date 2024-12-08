import { RetailerConfig } from '../types';

export const cosConfig: RetailerConfig = {
  name: 'COS',
  defaultCurrency: 'EUR',
  selectors: {
    name: [
      '[data-test-id="product-title"]',
      '.product-hero h1',
      '.product-title'
    ],
    price: [
      '[data-test-id="product-price"]',
      '.product-price',
      '.price-value'
    ],
    color: [
      '[data-test-id="selected-color"]',
      '.color-selector .active',
      '.selected-color'
    ],
    image: [
      '.product-detail-main-image img',
      '.pdp-image img',
      'meta[property="og:image"]'
    ]
  },
  brand: {
    defaultValue: 'COS'
  }
};