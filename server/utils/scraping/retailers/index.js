import { luxuryRetailers } from './luxury.js';
import { spanishRetailers } from './spanish.js';
import { internationalRetailers } from './international.js';

// Combine all retailer configurations
export const retailers = {
  ...luxuryRetailers,
  ...spanishRetailers,
  ...internationalRetailers
};

// Get retailer configuration based on URL
export function getRetailerConfig(url) {
  try {
    const hostname = new URL(url).hostname;
    const retailerEntry = Object.entries(retailers).find(([domain]) => 
      hostname.includes(domain)
    );
    
    return retailerEntry ? retailerEntry[1] : null;
  } catch {
    return null;
  }
}

// Transform image URL based on retailer rules
export function transformImageUrl(url, retailerConfig) {
  if (!url || !retailerConfig?.transformUrl) return url;
  return retailerConfig.transformUrl(url);
}

// Get headers for retailer
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
    ...(retailerConfig?.headers || {})
  };
}