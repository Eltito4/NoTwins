import { RetailerConfig } from './types';
import * as configs from './configs';

const retailers: Record<string, RetailerConfig> = {
  'cos.com': configs.cosConfig,
  'chcarolinaherrera.com': configs.carolinaHerreraConfig,
  'carolinaherrera.com': configs.carolinaHerreraConfig,
  'shop.mango.com': configs.mangoConfig,
  'mango.com': configs.mangoConfig,
  'hm.com': configs.hmConfig,
  'www2.hm.com': configs.hmConfig,
  'elcorteingles.es': configs.elCorteInglesConfig,
  'rosaclara.es': configs.rosaClaraConfig,
  'louisvuitton.com': configs.louisVuittonConfig
};

export function getRetailerConfig(url: string): RetailerConfig {
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

export function getRetailerHeaders(retailerConfig: RetailerConfig) {
  const defaultHeaders = {
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
    'Sec-Fetch-User': '?1'
  };

  return {
    ...defaultHeaders,
    ...retailerConfig?.headers,
    'Referer': 'https://www.google.com'
  };
}