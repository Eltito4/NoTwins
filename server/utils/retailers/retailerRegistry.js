import { logger } from '../logger.js';

// In-memory registry for retailer configurations
const retailerRegistry = new Map();

/**
 * Register a retailer configuration
 * @param {string} domain - The domain name (e.g., 'zara.com')
 * @param {object} config - The retailer configuration
 */
export function registerRetailer(domain, config) {
  if (!domain || !config) {
    logger.warn('Invalid retailer registration attempt', { domain });
    return;
  }
  
  // Normalize domain (remove www. prefix)
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
  
  retailerRegistry.set(normalizedDomain, config);
  logger.debug(`Registered retailer: ${normalizedDomain}`);
}

/**
 * Get a retailer configuration by domain
 * @param {string} domain - The domain name
 * @returns {object|null} - The retailer configuration or null if not found
 */
export function getRetailerByDomain(domain) {
  if (!domain) return null;
  
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
  return retailerRegistry.get(normalizedDomain) || null;
}

/**
 * Get all registered retailers
 * @returns {Array} - Array of registered retailer domains
 */
export function getAllRetailers() {
  return Array.from(retailerRegistry.keys());
}

/**
 * Check if a retailer is registered
 * @param {string} domain - The domain name
 * @returns {boolean} - True if the retailer is registered
 */
export function isRetailerRegistered(domain) {
  if (!domain) return false;
  
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
  return retailerRegistry.has(normalizedDomain);
}

/**
 * Clear all registered retailers
 */
export function clearRetailerRegistry() {
  retailerRegistry.clear();
  logger.debug('Cleared retailer registry');
}

// Register common retailers
const commonRetailers = {
  'zara.com': {
    name: 'Zara',
    selectors: {
      name: [
        '.product-detail-info h1',
        '[data-qa-id="product-name"]',
        '.product-name',
        'meta[property="og:title"]'
      ],
      price: [
        '.price__amount',
        '[data-qa-id="product-price"]',
        '.product-price',
        'meta[property="product:price:amount"]'
      ],
      color: [
        '.product-detail-color-selector__selected',
        '[data-qa-id="selected-color"]',
        '.product-detail-selected-color'
      ],
      image: [
        '.media-image img',
        '[data-qa-id="product-image"]',
        'meta[property="og:image"]'
      ]
    },
    brand: { defaultValue: 'Zara' }
  },
  'hm.com': {
    name: 'H&M',
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
    brand: { defaultValue: 'H&M' }
  },
  'mango.com': {
    name: 'Mango',
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
    brand: { defaultValue: 'Mango' }
  }
};

// Register common retailers
Object.entries(commonRetailers).forEach(([domain, config]) => {
  registerRetailer(domain, config);
});

export default {
  registerRetailer,
  getRetailerByDomain,
  getAllRetailers,
  isRetailerRegistered,
  clearRetailerRegistry
};