import { commonSelectors } from './selectors.js';
import { logger } from '../logger.js';
import { interpretRetailerConfig } from '../vision/deepseek.js';

// In-memory cache for retailer configurations
const retailerConfigCache = new Map();

export async function getRetailerConfig(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    
    // Check cache first
    if (retailerConfigCache.has(hostname)) {
      logger.debug('Using cached retailer config:', { retailer: hostname });
      return retailerConfigCache.get(hostname);
    }

    // Try to get AI-generated config
    try {
      const config = await interpretRetailerConfig(url);
      if (config) {
        retailerConfigCache.set(hostname, config);
        return config;
      }
    } catch (error) {
      logger.warn('Failed to generate retailer config:', error);
    }

    // Fallback to enhanced common selectors
    const defaultConfig = {
      name: getRetailerName(hostname),
      defaultCurrency: 'EUR',
      selectors: {
        ...commonSelectors,
        ...getRetailerSpecificSelectors(hostname)
      },
      brand: {
        defaultValue: getRetailerName(hostname)
      }
    };

    retailerConfigCache.set(hostname, defaultConfig);
    return defaultConfig;
  } catch (error) {
    logger.error('Error getting retailer config:', error);
    throw error;
  }
}

function getRetailerName(hostname) {
  const retailers = {
    'zara.com': 'Zara',
    'massimodutti.com': 'Massimo Dutti',
    'hm.com': 'H&M',
    'mango.com': 'Mango',
    'cos.com': 'COS',
    'asos.com': 'ASOS',
    'pullandbear.com': 'Pull & Bear',
    'bershka.com': 'Bershka',
    'stradivarius.com': 'Stradivarius'
  };
  
  for (const [domain, name] of Object.entries(retailers)) {
    if (hostname.includes(domain)) return name;
  }
  
  return 'Unknown Retailer';
function getRetailerSpecificSelectors(hostname) {
  if (hostname.includes('zara.com')) {
    return {
      name: [
        '.product-detail-info__header-name',
        '.product-detail-info h1',
        '.product-name',
        'h1[data-qa-anchor="product-name"]'
      ],
      price: [
        '.price__amount',
        '.product-detail-info__price',
        '[data-qa-anchor="product-price"]'
      ],
      color: [
        '.product-detail-color-selector__selected',
        '.product-detail-selected-color'
      ]
    };
  }
  
  if (hostname.includes('massimodutti.com')) {
    return {
      name: [
        '.product-info__name',
        '.product-detail-name'
      ],
      price: [
        '.product-price span',
        '.current-price'
      ],
      color: [
        '.product-colors__selected',
        '.selected-color'
      ]
    };
  }
  
  return {};
}
}
export function getRetailerHeaders() {
  return {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };
}