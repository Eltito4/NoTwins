import { findBestImage } from './imageProcessor.js';
import { selectors } from './selectors.js';
import { normalizeText, normalizeColor } from './normalizers.js';
import { detectArticleType } from './typeDetector.js';
import { detectPlatform, getGenericSelectors } from './platformDetector.js';
import { COLOR_MAPPINGS } from './constants.js';

export async function extractProductDetails($, url, retailerConfig) {
  try {
    // Detect platform and get platform-specific selectors
    const platformInfo = detectPlatform($);
    const genericSelectors = getGenericSelectors();
    
    // Initialize combined selectors with generic selectors
    const combinedSelectors = {
      name: Array.isArray(genericSelectors.name) ? [...genericSelectors.name] : [],
      price: Array.isArray(genericSelectors.price) ? [...genericSelectors.price] : [],
      color: Array.isArray(genericSelectors.color) ? [...genericSelectors.color] : [],
      brand: Array.isArray(genericSelectors.brand) ? [...genericSelectors.brand] : []
    };

    // Add platform-specific selectors if available
    if (platformInfo?.selectors) {
      if (Array.isArray(platformInfo.selectors.name)) {
        combinedSelectors.name.unshift(...platformInfo.selectors.name);
      }
      if (Array.isArray(platformInfo.selectors.price)) {
        combinedSelectors.price.unshift(...platformInfo.selectors.price);
      }
      if (Array.isArray(platformInfo.selectors.color)) {
        combinedSelectors.color.unshift(...platformInfo.selectors.color);
      }
      if (Array.isArray(platformInfo.selectors.brand)) {
        combinedSelectors.brand.unshift(...platformInfo.selectors.brand);
      }
    }

    // Add retailer-specific selectors if available
    if (retailerConfig?.selectors) {
      if (Array.isArray(retailerConfig.selectors.name)) {
        combinedSelectors.name.unshift(...retailerConfig.selectors.name);
      }
      if (Array.isArray(retailerConfig.selectors.price)) {
        combinedSelectors.price.unshift(...retailerConfig.selectors.price);
      }
      if (Array.isArray(retailerConfig.selectors.color)) {
        combinedSelectors.color.unshift(...retailerConfig.selectors.color);
      }
      if (Array.isArray(retailerConfig.selectors.brand)) {
        combinedSelectors.brand.unshift(...retailerConfig.selectors.brand);
      }
    }

    // Extract product name
    const name = extractName($, combinedSelectors.name);
    if (!name) {
      throw new Error('Could not find product name');
    }

    // Find best product image
    const imageUrl = await findBestImage($, url);
    if (!imageUrl) {
      throw new Error('Could not find valid product image');
    }

    // Extract price
    const price = extractPrice($, combinedSelectors.price);
    
    // Extract and normalize color
    let color = null;
    for (const selector of combinedSelectors.color) {
      const element = $(selector);
      if (element.length) {
        const rawColor = element.text().trim() || 
                        element.attr('data-color') || 
                        element.attr('data-selected-color') || 
                        element.attr('data-value');
        
        if (rawColor) {
          const normalizedColor = normalizeColor(rawColor);
          if (normalizedColor) {
            color = normalizedColor;
            break;
          }
        }
      }
    }
    
    // Handle brand with fallback to retailer name
    let brand = null;
    if (retailerConfig?.brand?.defaultValue) {
      brand = retailerConfig.brand.defaultValue;
    } else {
      brand = extractBrand($, combinedSelectors.brand) || retailerConfig?.name;
    }

    // Extract description and detect article type
    const descriptionSelectors = retailerConfig?.selectors?.description || selectors.description || [];
    const description = extractDescription($, Array.isArray(descriptionSelectors) ? descriptionSelectors : []);
    const { type } = detectArticleType(name, description);

    return {
      name: normalizeText(name),
      imageUrl,
      price,
      color,
      brand,
      type,
      description: normalizeText(description)
    };
  } catch (error) {
    console.error('Error extracting product details:', error);
    throw error;
  }
}

function extractName($, nameSelectors) {
  if (!Array.isArray(nameSelectors)) {
    return null;
  }

  // Try direct selectors
  for (const selector of nameSelectors) {
    try {
      const element = $(selector);
      if (element.length) {
        const text = element.text().trim();
        if (text) return text;

        // Check content attribute for meta tags
        const content = element.attr('content');
        if (content) return content.trim();
      }
    } catch (error) {
      continue;
    }
  }

  // Try JSON-LD
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

function extractPrice($, priceSelectors) {
  if (!Array.isArray(priceSelectors)) {
    return null;
  }

  // Try direct selectors
  for (const selector of priceSelectors) {
    try {
      const element = $(selector);
      if (element.length) {
        const text = element.text().trim();
        if (text) {
          // Handle European price format (e.g., "149,00 €" or "149.00 EUR")
          const match = text.match(/(\d+)[,.](\d{2})/);
          if (match) {
            const euros = parseInt(match[1], 10);
            const cents = parseInt(match[2], 10);
            return euros + (cents / 100);
          }
          
          // Fallback to basic number extraction
          const normalized = text.replace(/[^\d.,]/g, '')
                               .replace(',', '.');
          const price = parseFloat(normalized);
          if (!isNaN(price)) return price;
        }

        // Check content attribute for meta tags
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

  // Try JSON-LD
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

function extractBrand($, brandSelectors) {
  if (!Array.isArray(brandSelectors)) {
    return null;
  }

  // Try direct selectors
  for (const selector of brandSelectors) {
    try {
      const element = $(selector);
      if (element.length) {
        const text = element.text().trim();
        if (text) return text;

        // Check content attribute for meta tags
        const content = element.attr('content');
        if (content) return content.trim();
      }
    } catch (error) {
      continue;
    }
  }

  // Try JSON-LD
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

function extractDescription($, descriptionSelectors) {
  if (!Array.isArray(descriptionSelectors)) {
    return null;
  }

  // Try direct selectors
  for (const selector of descriptionSelectors) {
    try {
      const element = $(selector);
      if (element.length) {
        const text = element.text().trim();
        if (text) return text;

        // Check content attribute for meta tags
        const content = element.attr('content');
        if (content) return content.trim();
      }
    } catch (error) {
      continue;
    }
  }

  // Try meta description
  try {
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc) return metaDesc;
  } catch (error) {
    console.error('Error getting meta description:', error);
  }

  return null;
}