import { findBestImage } from './imageProcessor.js';
import { selectors } from './selectors.js';
import { normalizeText, normalizeColor } from './normalizers.js';
import { detectArticleType } from './typeDetector.js';
import { detectPlatform, getGenericSelectors } from './platformDetector.js';
import { getRetailerExtractor } from './retailers/extractors/index.js';

export async function extractProductDetails($, url, retailerConfig) {
  try {
    // Try retailer-specific extractor first
    const retailerExtractor = getRetailerExtractor(url);
    if (retailerExtractor) {
      return await retailerExtractor($, url);
    }

    // Fallback to generic extraction
    const platformInfo = detectPlatform($);
    const genericSelectors = getGenericSelectors();
    
    const combinedSelectors = {
      name: [...(genericSelectors.name || [])],
      price: [...(genericSelectors.price || [])],
      color: [...(genericSelectors.color || [])],
      brand: [...(genericSelectors.brand || [])]
    };

    if (platformInfo?.selectors) {
      Object.keys(combinedSelectors).forEach(key => {
        if (Array.isArray(platformInfo.selectors[key])) {
          combinedSelectors[key].unshift(...platformInfo.selectors[key]);
        }
      });
    }

    if (retailerConfig?.selectors) {
      Object.keys(combinedSelectors).forEach(key => {
        if (Array.isArray(retailerConfig.selectors[key])) {
          combinedSelectors[key].unshift(...retailerConfig.selectors[key]);
        }
      });
    }

    const name = extractText($, combinedSelectors.name);
    if (!name) {
      throw new Error('Could not find product name');
    }

    const imageUrl = await findBestImage($, url);
    if (!imageUrl) {
      throw new Error('Could not find valid product image');
    }

    const price = extractPrice($, combinedSelectors.price);
    const color = extractColor($, combinedSelectors.color);
    
    let brand = null;
    if (retailerConfig?.brand?.defaultValue) {
      brand = retailerConfig.brand.defaultValue;
    } else {
      brand = extractBrand($, combinedSelectors.brand) || retailerConfig?.name;
    }

    const descriptionSelectors = retailerConfig?.selectors?.description || selectors.description || [];
    const description = extractDescription($, Array.isArray(descriptionSelectors) ? descriptionSelectors : []);
    const { type } = detectArticleType(name, description);

    return {
      name: normalizeText(name),
      imageUrl,
      price,
      color: normalizeColor(color),
      brand,
      type,
      description: normalizeText(description)
    };
  } catch (error) {
    console.error('Error extracting product details:', error);
    throw error;
  }
}

function extractText($, selectors) {
  if (!Array.isArray(selectors)) return null;

  for (const selector of selectors) {
    try {
      const element = $(selector);
      if (element.length) {
        const text = element.text().trim();
        if (text) return text;
        
        const content = element.attr('content');
        if (content) return content.trim();
      }
    } catch (error) {
      continue;
    }
  }

  try {
    const jsonLd = $('script[type="application/ld+json"]');
    for (let i = 0; i < jsonLd.length; i++) {
      const data = JSON.parse($(jsonLd[i]).html());
      if (data['@type'] === 'Product' && data.name) {
        return data.name;
      }
    }
  } catch (error) {
    console.error('Error parsing JSON-LD:', error);
  }

  return null;
}

function extractPrice($, selectors) {
  if (!Array.isArray(selectors)) return null;

  for (const selector of selectors) {
    try {
      const element = $(selector);
      if (element.length) {
        const text = element.text().trim();
        if (text) {
          const match = text.match(/(\d+)[,.](\d{2})/);
          if (match) {
            const euros = parseInt(match[1], 10);
            const cents = parseInt(match[2], 10);
            return euros + (cents / 100);
          }
          
          const normalized = text.replace(/[^\d.,]/g, '')
                               .replace(',', '.');
          const price = parseFloat(normalized);
          if (!isNaN(price)) return price;
        }

        const content = element.attr('content');
        if (content) {
          const price = parseFloat(content);
          if (!isNaN(price)) return price;
        }
      }
    } catch (error) {
      continue;
    }
  }

  try {
    const jsonLd = $('script[type="application/ld+json"]');
    for (let i = 0; i < jsonLd.length; i++) {
      const data = JSON.parse($(jsonLd[i]).html());
      if (data['@type'] === 'Product' && data.offers?.price) {
        return parseFloat(data.offers.price);
      }
    }
  } catch (error) {
    console.error('Error parsing JSON-LD price:', error);
  }

  return null;
}

function extractColor($, selectors) {
  if (!Array.isArray(selectors)) return null;

  for (const selector of selectors) {
    try {
      const element = $(selector);
      if (element.length) {
        const text = element.text().trim();
        if (text) return text;

        const dataColor = element.attr('data-color') || 
                         element.attr('data-selected-color') || 
                         element.attr('data-value');
        if (dataColor) return dataColor;
      }
    } catch (error) {
      continue;
    }
  }

  try {
    const jsonLd = $('script[type="application/ld+json"]');
    for (let i = 0; i < jsonLd.length; i++) {
      const data = JSON.parse($(jsonLd[i]).html());
      if (data['@type'] === 'Product' && data.color) {
        return data.color;
      }
    }
  } catch (error) {
    console.error('Error parsing JSON-LD color:', error);
  }

  return null;
}

function extractBrand($, selectors) {
  if (!Array.isArray(selectors)) return null;

  for (const selector of selectors) {
    try {
      const element = $(selector);
      if (element.length) {
        const text = element.text().trim();
        if (text) return text;

        const content = element.attr('content');
        if (content) return content.trim();
      }
    } catch (error) {
      continue;
    }
  }

  try {
    const jsonLd = $('script[type="application/ld+json"]');
    for (let i = 0; i < jsonLd.length; i++) {
      const data = JSON.parse($(jsonLd[i]).html());
      if (data['@type'] === 'Product' && data.brand?.name) {
        return data.brand.name;
      }
    }
  } catch (error) {
    console.error('Error parsing JSON-LD brand:', error);
  }

  return null;
}

function extractDescription($, selectors) {
  if (!Array.isArray(selectors)) return null;

  for (const selector of selectors) {
    try {
      const element = $(selector);
      if (element.length) {
        const text = element.text().trim();
        if (text) return text;

        const content = element.attr('content');
        if (content) return content.trim();
      }
    } catch (error) {
      continue;
    }
  }

  try {
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc) return metaDesc;
  } catch (error) {
    console.error('Error getting meta description:', error);
  }

  return null;
}