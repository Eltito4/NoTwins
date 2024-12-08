export * from './cos.js';
export * from './carolina-herrera.js';
export * from './mango.js';
export * from './hm.js';
export * from './el-corte-ingles.js';
export * from './rosa-clara.js';
export * from './louis-vuitton.js';

// Map domains to their extractors
export const retailerExtractors = {
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
      throw new Error('This retailer is not supported. Please try a different store.');
    }
    
    return extractor;
  } catch (error) {
    throw new Error(error.message || 'Invalid URL format');
  }
}