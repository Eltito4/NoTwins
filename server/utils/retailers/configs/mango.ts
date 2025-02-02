import { RetailerConfig } from '../types';

export const mangoConfig: RetailerConfig = {
  name: 'Mango',
  defaultCurrency: 'EUR',
  selectors: {
    name: [
      '.product-name.text-title',
      '.name-title',
      'meta[property="og:title"]'
    ],
    price: [
      '.product-prices__price',
      '.price-sale',
      'meta[property="product:price:amount"]'
    ],
    color: [
      '.color-selector__selected-color',
      '.selected-color',
      '.product-colors .active'
    ],
    image: [
      '.product-images__image img',
      '.image-container img',
      'meta[property="og:image"]'
    ]
  },
  brand: {
    defaultValue: 'Mango'
  }
};