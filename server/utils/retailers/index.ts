import { RetailerConfig } from './types';
import { interpretRetailerConfig } from '../vision/gemini.js';
import { logger } from '../logger.js';

// In-memory cache for retailer configs
const retailerConfigCache = new Map<string, RetailerConfig>();

export async function getRetailerConfig(url: string): Promise<RetailerConfig> {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    
    // Check cache first
    if (retailerConfigCache.has(hostname)) {
      return retailerConfigCache.get(hostname)!;
    }

    // Use Gemini to interpret the retailer
    logger.info('Generating retailer config for:', hostname);
    const config = await interpretRetailerConfig(url);
    
    // Cache the config
    retailerConfigCache.set(hostname, config);
    
    return config;
  } catch (error) {
    logger.error('Error getting retailer config:', error);
    throw error;
  }
}

export function getRetailerHeaders(retailerConfig: RetailerConfig) {
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