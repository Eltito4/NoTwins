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
  'cos.com': {
    name: 'COS',
    selectors: {
      name: [
        '[data-test-id="product-title"]',
        '.product-hero h1',
        ...commonSelectors.name
      ],
      price: [
        '[data-test-id="product-price"]',
        ...commonSelectors.price
      ],
      color: [
        '[data-test-id="selected-color"]',
        ...commonSelectors.color
      ],
      image: [
        '.product-detail-main-image img',
        ...commonSelectors.image
      ]
    },
    brand: {
      defaultValue: 'COS'
    }
  },
  'zara.com': {
    name: 'Zara',
    selectors: {
      name: [
        '.product-detail-info h1',
        ...commonSelectors.name
      ],
      price: [
        '.price__amount',
        ...commonSelectors.price
      ],
      color: [
        '.product-detail-color-selector__selected',
        ...commonSelectors.color
      ],
      image: [
        '.media-image img',
        ...commonSelectors.image
      ]
    },
    brand: {
      defaultValue: 'Zara'
    }
  }
  // Add more retailers as needed
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