import { findBestImage } from './imageProcessor.js';
import { normalizeColor } from './normalizers.js';
import { detectProductType } from './typeDetector.js';

export async function extractProductDetails($, url, retailerConfig) {
  try {
    // Extract basic product info
    const name = extractText($, retailerConfig.selectors.name);
    if (!name) {
      throw new Error('Could not find product name');
    }

    const imageUrl = await findBestImage($, url);
    if (!imageUrl) {
      throw new Error('Could not find valid product image');
    }

    // Extract optional details
    const price = extractPrice($, retailerConfig.selectors.price);
    const color = extractColor($, retailerConfig.selectors.color);
    const brand = retailerConfig.brand?.defaultValue || extractBrand($, retailerConfig.selectors.brand);
    const description = extractDescription($, retailerConfig.selectors.description);

    // Detect product type
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
  if (!Array.isArray(selectors)) return null;

  for (const selector of selectors) {
    try {
      const element = $(selector);
      if (element.length) {
        // Try text content first
        const text = element.text().trim();
        if (text) return text;
        
        // Try content attribute (for meta tags)
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
  if (!Array.isArray(selectors)) return null;

  for (const selector of selectors) {
    try {
      const element = $(selector);
      if (element.length) {
        const text = element.text().trim() || element.attr('content');
        if (text) {
          // Try to find price with decimal
          const match = text.match(/(\d+)[,.](\d{2})/);
          if (match) {
            const euros = parseInt(match[1], 10);
            const cents = parseInt(match[2], 10);
            return euros + (cents / 100);
          }
          
          // Try to find just numbers
          const numericMatch = text.match(/\d+/);
          if (numericMatch) {
            return parseInt(numericMatch[0], 10);
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
  if (!Array.isArray(selectors)) return null;

  for (const selector of selectors) {
    try {
      const element = $(selector);
      if (element.length) {
        // Try various ways to get color info
        return element.text().trim() || 
               element.attr('data-color') || 
               element.attr('data-selected-color') ||
               element.attr('content');
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}

function extractBrand($, selectors) {
  if (!Array.isArray(selectors)) return null;

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
  if (!Array.isArray(selectors)) return null;

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