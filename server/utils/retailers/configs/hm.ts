import { RetailerConfig } from '../types';

export const hmConfig: RetailerConfig = {
  name: 'H&M',
  defaultCurrency: 'EUR',
  selectors: {
    name: [
      '.product-detail-name',
      '.pdp-heading',
      'meta[property="og:title"]'
    ],
    price: [
      '.product-price-value',
      '.price-value',
      'meta[property="product:price:amount"]'
    ],
    color: [
      '.product-input-label',
      '.product-detail-colour-picker__selected',
      '.selected-color'
    ],
    image: [
      '.product-detail-main-image-container img',
      '.product-images img',
      'meta[property="og:image"]'
    ]
  },
  brand: {
    defaultValue: 'H&M'
  }
};