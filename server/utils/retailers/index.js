import { logger } from '../logger.js';
import { interpretRetailerConfig } from '../vision/gemini.js';

// In-memory cache for retailer configs
const retailerConfigCache = new Map();

export async function getRetailerConfig(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    
    // Check cache first
    if (retailerConfigCache.has(hostname)) {
      return retailerConfigCache.get(hostname);
    }

    // Use Gemini to interpret the retailer
    try {
      logger.info('Generating retailer config for:', hostname);
      const config = await interpretRetailerConfig(url);
      
      // Cache the config
      retailerConfigCache.set(hostname, config);
      
      return config;
    } catch (error) {
      logger.error('Error generating retailer config:', error);
      
      // Create a default configuration
      const defaultConfig = {
        name: extractDomainName(hostname),
        defaultCurrency: "EUR",
        selectors: {
          name: [
            'h1',
            '.product-name',
            '.product-title',
            'meta[property="og:title"]',
            '[data-testid="product-name"]',
            '[itemprop="name"]'
          ],
          price: [
            '.price',
            '.product-price',
            'meta[property="product:price:amount"]',
            '[data-testid="product-price"]',
            '[itemprop="price"]'
          ],
          color: [
            '.color-selector .selected',
            '.selected-color',
            '[data-testid="selected-color"]',
            '[itemprop="color"]'
          ],
          image: [
            'meta[property="og:image"]',
            '.product-image img',
            '.gallery-image img',
            '[data-testid="product-image"]',
            '[itemprop="image"]'
          ],
          brand: [
            'meta[property="product:brand"]',
            '.product-brand',
            '[itemprop="brand"]'
          ]
        },
        brand: {
          defaultValue: extractDomainName(hostname)
        }
      };
      
      logger.info('Using default retailer config for:', hostname);
      retailerConfigCache.set(hostname, defaultConfig);
      return defaultConfig;
    }
  } catch (error) {
    logger.error('Error getting retailer config:', error);
    throw error;
  }
}

function extractDomainName(hostname) {
  try {
    const parts = hostname.split('.');
    
    // Handle www prefix
    if (parts[0] === 'www') {
      parts.shift();
    }
    
    // Get the main domain name (usually the second-to-last part)
    const domainName = parts[parts.length - 2];
    
    // Capitalize first letter
    return domainName.charAt(0).toUpperCase() + domainName.slice(1);
  } catch (error) {
    return "Unknown Retailer";
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

// Get list of cached retailers
export function getCachedRetailers() {
  return Array.from(retailerConfigCache.keys());
}