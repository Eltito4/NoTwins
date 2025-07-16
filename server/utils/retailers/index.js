// Retailer configurations and utilities
import { logger } from '../logger.js';

// Common retailer headers
export function getRetailerHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0'
  };
}

// Brand mappings from domains
const BRAND_MAPPINGS = {
  'bimbaylola.com': 'Bimba y Lola',
  'zara.com': 'Zara',
  'hm.com': 'H&M',
  'mango.com': 'Mango',
  'massimodutti.com': 'Massimo Dutti',
  'cos.com': 'COS',
  'asos.com': 'ASOS',
  'pullandbear.com': 'Pull & Bear',
  'bershka.com': 'Bershka',
  'stradivarius.com': 'Stradivarius',
  'oysho.com': 'Oysho',
  'uterque.com': 'Uterque',
  'bimani.com': 'BIMANI',
  'miphai.com': 'Miphai',
  'mariquitatrasquila.com': 'Mariquita Trasquila',
  'matildecano.es': 'Matilde Cano'
};

// Get retailer configuration
export async function getRetailerConfig(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    
    // Find brand from domain
    let brand = null;
    for (const [domain, brandName] of Object.entries(BRAND_MAPPINGS)) {
      if (hostname.includes(domain)) {
        brand = brandName;
        break;
      }
    }
    
    // If no brand found, extract from domain
    if (!brand) {
      const domainParts = hostname.split('.');
      if (domainParts.length > 0) {
        brand = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
      }
    }
    
    // Return generic retailer config
    const config = {
      name: brand || 'Unknown Retailer',
      defaultCurrency: 'EUR',
      selectors: {
        name: [
          'h1',
          '.product-title',
          '.product-name',
          '.product-detail-info h1',
          '.pdp-title',
          '[data-testid*="title"]',
          'meta[property="og:title"]'
        ],
        price: [
          '.price',
          '.product-price',
          '.current-price',
          '.price-current',
          '.money-amount',
          '[data-testid*="price"]',
          'meta[property="product:price:amount"]'
        ],
        color: [
          '.color-name',
          '.selected-color',
          '.product-color',
          '[data-testid*="color"]'
        ],
        image: [
          'meta[property="og:image"]',
          '.product-image img',
          '.gallery-image img',
          '.pdp-image img',
          '.media-image img'
        ],
        brand: [
          '.brand-name',
          '.designer',
          '[data-testid*="brand"]',
          'meta[property="product:brand"]'
        ]
      },
      brand: {
        defaultValue: brand
      }
    };
    
    // Enhanced selectors for specific brands
    if (hostname.includes('bimani.com')) {
      config.selectors.price.unshift('.price-value', '.product-price .price');
      config.selectors.color.unshift('.color-selector .selected');
    }
    
    if (hostname.includes('miphai.com')) {
      config.selectors.color.unshift('.color-option.selected', '.variant-color');
    }
    
    if (hostname.includes('mariquitatrasquila.com')) {
      config.selectors.image.unshift('.product-image-main img', '.featured-image img');
      config.selectors.color.unshift('.color-variant.active');
    }
    
    if (hostname.includes('matildecano.es')) {
      config.selectors.image.unshift('.product-image img', '.main-image img');
      config.selectors.color.unshift('.color-selection .active');
    }
    
    logger.debug('Generated retailer config:', { hostname, brand, config });
    return config;
  } catch (error) {
    logger.error('Error generating retailer config:', error);
    
    // Return fallback config
    return {
      name: 'Generic Retailer',
      defaultCurrency: 'EUR',
      selectors: {
        name: ['h1', '.product-title', 'meta[property="og:title"]'],
        price: ['.price', 'meta[property="product:price:amount"]'],
        color: ['.color-name'],
        image: ['meta[property="og:image"]', '.product-image img'],
        brand: ['.brand-name', 'meta[property="product:brand"]']
      },
      brand: {
        defaultValue: 'Unknown'
      }
    };
  }
}