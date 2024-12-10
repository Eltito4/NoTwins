import { luxuryRetailers } from './luxury.js';

const retailers = {
  ...luxuryRetailers
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