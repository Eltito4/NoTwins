import { RetailerConfig } from '../types';

export const rosaClaraConfig: RetailerConfig = {
  name: 'Rosa Clará',
  defaultCurrency: 'EUR',
  selectors: {
    name: [
      '.product-name',
      '.pdp-title',
      'meta[property="og:title"]'
    ],
    price: [
      '.product-price',
      '.price-current',
      'meta[property="product:price:amount"]'
    ],
    color: [
      '.product-color',
      '.selected-color',
      '.color-selector .selected'
    ],
    image: [
      '.product-gallery__image',
      '.pdp-main-image img',
      'meta[property="og:image"]'
    ]
  },
  brand: {
    defaultValue: 'Rosa Clará'
  }
};