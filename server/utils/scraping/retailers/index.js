import { spanishRetailers } from './spanish.js';
import { luxuryRetailers } from './luxury.js';
import { internationalRetailers } from './international.js';

const retailers = {
  ...spanishRetailers,
  ...luxuryRetailers,
  ...internationalRetailers
};

export function getRetailerConfig(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    
    // Handle special cases first
    if (hostname === 'chcarolinaherrera.com' || hostname === 'carolinaherrera.com') {
      return retailers['carolinaherrera.com'];
    }

    // Handle domain variations
    const retailer = retailers[hostname] || 
                    Object.entries(retailers).find(([key]) => hostname.includes(key))?.[1];
    
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
    ...retailerConfig?.headers,
    'Referer': 'https://www.google.com'
  };
}