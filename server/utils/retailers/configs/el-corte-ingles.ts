import { RetailerConfig } from '../types';

export const elCorteInglesConfig: RetailerConfig = {
  name: 'El Corte Inglés',
  defaultCurrency: 'EUR',
  selectors: {
    name: [
      '.product-title h1',
      '.pdp-title',
      'meta[property="og:title"]'
    ],
    price: [
      '.price-amount',
      '.current-price',
      'meta[property="product:price:amount"]'
    ],
    color: [
      '.product-color-name',
      '.selected-color',
      '.color-selector .selected'
    ],
    image: [
      '.product-image__main img',
      '.gallery-image',
      'meta[property="og:image"]'
    ]
  }
};