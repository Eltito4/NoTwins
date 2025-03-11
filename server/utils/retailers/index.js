import { logger } from '../logger.js';

// In-memory cache for retailer configurations
const retailerConfigCache = new Map();

export function getCachedRetailers() {
  return Array.from(retailerConfigCache.keys());
}

// Common selectors that work across most e-commerce sites
const commonSelectors = {
  name: [
    // Meta tags
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'meta[property="product:title"]',
    // Common product title selectors
    'h1[itemprop="name"]',
    '.product-name h1',
    '.product-title h1',
    '.pdp-title h1',
    '[data-testid="product-name"]',
    '[data-testid="product-title"]',
    '.product-detail-name',
    '.product-info__name'
  ],
  price: [
    // Meta tags
    'meta[property="product:price:amount"]',
    'meta[property="og:price:amount"]',
    // Common price selectors
    '[itemprop="price"]',
    '.product-price',
    '.price__amount',
    '.price-value',
    '[data-testid="product-price"]',
    '.current-price',
    '.price-amount'
  ],
  color: [
    // Common color selectors
    '[itemprop="color"]',
    '.selected-color',
    '.color-selector .active',
    '.product-color',
    '[data-testid="selected-color"]',
    '.color-picker__selected',
    '.variant-color'
  ],
  image: [
    // Meta tags
    'meta[property="og:image"]',
    'meta[property="og:image:secure_url"]',
    'meta[name="twitter:image"]',
    // Common image selectors
    '[itemprop="image"]',
    '.product-image img',
    '.gallery-image img',
    '.pdp-image img',
    '[data-testid="product-image"]',
    'picture source[srcset]'
  ],
  brand: [
    // Meta tags
    'meta[property="og:brand"]',
    'meta[property="product:brand"]',
    // Common brand selectors
    '[itemprop="brand"]',
    '.product-brand',
    '.brand-name',
    '[data-testid="product-brand"]'
  ],
  description: [
    // Meta tags
    'meta[name="description"]',
    'meta[property="og:description"]',
    // Common description selectors
    '[itemprop="description"]',
    '.product-description',
    '.pdp-description',
    '[data-testid="product-description"]'
  ]
};

// Retailer-specific overrides and configurations
const retailers = {
  'zara.com': {
    name: 'Zara',
    selectors: {
      name: [
        '[data-qa-id="product-name"]',
        '[data-qa-id="product-title"]',
        '.product-detail-info h1',
        '.product-name-wrapper h1',
        ...commonSelectors.name
      ],
      price: [
        '[data-qa-id="product-price"]',
        '.price__amount',
        '.product-price',
        ...commonSelectors.price
      ],
      color: [
        '[data-qa-id="selected-color"]',
        '.product-detail-color-selector__selected',
        '.product-detail-selected-color',
        ...commonSelectors.color
      ],
      image: [
        '[data-qa-id="product-image"]',
        '.media-image img',
        '.product-detail-image img',
        ...commonSelectors.image
      ]
    },
    brand: {
      defaultValue: 'Zara'
    }
  }
};

export function getRetailerConfig(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    
    // Try to find exact match first
    if (retailers[hostname]) {
      return {
        ...retailers[hostname],
        selectors: {
          ...commonSelectors,
          ...retailers[hostname].selectors
        }
      };
    }

    // If no exact match, try partial match
    const partialMatch = Object.entries(retailers).find(([key]) => hostname.includes(key));
    if (partialMatch) {
      return {
        ...partialMatch[1],
        selectors: {
          ...commonSelectors,
          ...partialMatch[1].selectors
        }
      };
    }

    // If no match, return common selectors
    return {
      name: 'Unknown Retailer',
      selectors: commonSelectors
    };
  } catch {
    // On any error, return common selectors as fallback
    return {
      name: 'Unknown Retailer',
      selectors: commonSelectors
    };
  }
}

export function getRetailerHeaders(retailerConfig) {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Referer': 'https://www.google.com',
    ...retailerConfig?.headers
  };
}