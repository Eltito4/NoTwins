import { spanishRetailers } from './spanish.js';
import { luxuryRetailers } from './luxury.js';
import { internationalRetailers } from './international.js';

const retailers = {
  'ladypipa.com': {
    name: 'Lady Pipa',
    selectors: {
      name: ['.product-title', '.product-single__title', '.product__title', 'h1.product-title'],
      price: ['.price', '.product-single__price', '.price__regular'],
      color: ['.variant-input-wrap[data-option="Color"] .active', '.swatch-element.active'],
      brand: { defaultValue: 'Lady Pipa' },
      image: ['.product__media-item img', '.product-featured-media', 'meta[property="og:image"]']
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1'
    }
  },
  'hm.com': {
    name: 'H&M',
    selectors: {
      name: ['.product-detail-main-image-container h1', '.product-item-headline'],
      price: ['.price-value', '.product-item-price'],
      color: ['.product-colors .filter-option--selected', '.product-input-label'],
      brand: { defaultValue: 'H&M' },
      image: ['.product-detail-main-image-container img', '.product-detail-thumbnail-image']
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Cookie': '_abck=; bm_sz=; ak_bmsc=;',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1'
    },
    transformUrl: (url) => {
      return url.replace('www2.hm.com', 'www.hm.com');
    }
  },
  'cos.com': {
    name: 'COS',
    selectors: {
      name: ['.product-detail-title', '.pdp-title h1'],
      price: ['.product-price', '.pdp-price'],
      color: ['.product-color-name', '.selected-color'],
      brand: { defaultValue: 'COS' },
      image: ['.product-detail-main-image img', '.pdp-image img']
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Cookie': '_abck=; bm_sz=; ak_bmsc=;',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1'
    },
    transformUrl: (url) => {
      return url.split('?')[0];
    }
  },
  ...spanishRetailers,
  ...luxuryRetailers,
  ...internationalRetailers
};

export function getRetailerConfig(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\d*\./, '');
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
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1'
  };

  return {
    ...defaultHeaders,
    ...retailerConfig.headers,
    'Referer': 'https://www.google.com'
  };
}