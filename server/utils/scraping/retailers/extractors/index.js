import { extractCosProduct } from './cos.js';
import { extractCarolinaHerreraProduct } from './carolina-herrera.js';
import { extractMangoProduct } from './mango.js';
import { extractHMProduct } from './hm.js';
import { extractElCorteInglesProduct } from './el-corte-ingles.js';
import { extractRosaClaraProduct } from './rosa-clara.js';
import { extractLouisVuittonProduct } from './louis-vuitton.js';

// Map domains to their extractors
const retailerExtractors = {
  'cos.com': extractCosProduct,
  'chcarolinaherrera.com': extractCarolinaHerreraProduct,
  'carolinaherrera.com': extractCarolinaHerreraProduct,
  'shop.mango.com': extractMangoProduct,
  'mango.com': extractMangoProduct,
  'hm.com': extractHMProduct,
  'www2.hm.com': extractHMProduct,
  'elcorteingles.es': extractElCorteInglesProduct,
  'rosaclara.es': extractRosaClaraProduct,
  'louisvuitton.com': extractLouisVuittonProduct
};

export function getRetailerExtractor(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    
    // Handle special cases first
    if (hostname === 'chcarolinaherrera.com' || hostname === 'carolinaherrera.com') {
      return retailerExtractors['carolinaherrera.com'];
    }

    // Find matching extractor
    const extractor = retailerExtractors[hostname] || 
                     Object.entries(retailerExtractors)
                       .find(([key]) => hostname.includes(key))?.[1];
    
    if (!extractor) {
      return null; // Return null instead of throwing error to allow fallback
    }
    
    return extractor;
  } catch (error) {
    return null; // Return null on invalid URLs to allow fallback
  }
}

export {
  extractCosProduct,
  extractCarolinaHerreraProduct,
  extractMangoProduct,
  extractHMProduct,
  extractElCorteInglesProduct,
  extractRosaClaraProduct,
  extractLouisVuittonProduct
};