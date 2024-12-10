import { findBestImage } from './imageProcessor.js';
import { normalizeColor } from './normalizers.js';
import { detectProductType } from './typeDetector.js';
import { getRetailerExtractor } from './retailers/extractors/index.js';
import { getRetailerConfig } from './retailers/index.js';

export async function extractProductDetails($, url, retailerConfig) {
  try {
    // Try retailer-specific extractor first
    const retailerExtractor = getRetailerExtractor(url);
    if (retailerExtractor) {
      const data = await retailerExtractor($, url);
      return {
        ...data,
        type: detectProductType(data.name + ' ' + (data.description || ''))
      };
    }

    // Fallback to generic extraction
    const name = extractText($, retailerConfig?.selectors?.name || []);
    if (!name) {
      throw new Error('Could not find product name');
    }

    const imageUrl = await findBestImage($, url);
    if (!imageUrl) {
      throw new Error('Could not find valid product image');
    }

    const price = extractPrice($, retailerConfig?.selectors?.price || []);
    const color = extractColor($, retailerConfig?.selectors?.color || []);
    const brand = retailerConfig?.brand?.defaultValue || extractBrand($, retailerConfig?.selectors?.brand || []);
    const description = extractDescription($, retailerConfig?.selectors?.description || []);
    const type = detectProductType(name + ' ' + (description || ''));

    return {
      name,
      imageUrl,
      price,
      color: normalizeColor(color),
      brand,
      type,
      description
    };
  } catch (error) {
    console.error('Error extracting product details:', error);
    throw error;
  }
}

function extractText($, selectors) {
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
  return null;
}

function extractPrice($, selectors) {
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
        }
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}

function extractColor($, selectors) {
  for (const selector of selectors) {
    try {
      const element = $(selector);
      if (element.length) {
        return element.text().trim() || 
               element.attr('data-color') || 
               element.attr('data-selected-color');
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}

function extractBrand($, selectors) {
  for (const selector of selectors) {
    try {
      const element = $(selector);
      if (element.length) {
        return element.text().trim() || element.attr('content');
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}

function extractDescription($, selectors) {
  for (const selector of selectors) {
    try {
      const element = $(selector);
      if (element.length) {
        return element.text().trim() || element.attr('content');
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}