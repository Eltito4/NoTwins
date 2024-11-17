import { spanishRetailers } from './spanish.js';
import { luxuryRetailers } from './luxury.js';
import { internationalRetailers } from './international.js';

const retailers = {
  'ladypipa.com': {
    name: 'Lady Pipa',
    selectors: {
      name: '.product-title, h1.title, [data-testid="product-name"]',
      price: '.product-price, [data-testid="product-price"]',
      color: '.product-color, [data-testid="color"], .color-value',
      brand: '.product-brand, [data-testid="brand"]',
      image: 'meta[property="og:image"], .product-image img[src], img[data-main-image]'
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    }
  },
  ...spanishRetailers,
  ...luxuryRetailers,
  ...internationalRetailers
};

export function getRetailerConfig(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace('www.', '');
    const retailer = retailers[hostname];
    
    if (!retailer) {
      throw new Error('This retailer is not supported. Please try a different store.');
    }
    
    return retailer;
  } catch (error) {
    throw new Error(error.message || 'Invalid URL format');
  }
}

export function getRetailerHeaders(retailerConfig) {
  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };

  return {
    ...defaultHeaders,
    ...retailerConfig.headers,
    'Referer': 'https://www.google.com'
  };
}