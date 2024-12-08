import { RetailerConfig } from '../types';

export const louisVuittonConfig: RetailerConfig = {
  name: 'Louis Vuitton',
  defaultCurrency: 'EUR',
  selectors: {
    name: [
      '.lv-product__title',
      '.product-name h1',
      'meta[property="og:title"]'
    ],
    price: [
      '.lv-product__price',
      '.product-price',
      'meta[property="product:price:amount"]'
    ],
    color: [
      '.lv-product__color',
      '.product-color',
      '.selected-color'
    ],
    image: [
      '.lv-product__image img',
      '.product-images img',
      'meta[property="og:image"]'
    ]
  },
  brand: {
    defaultValue: 'Louis Vuitton'
  }
};