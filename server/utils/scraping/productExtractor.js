import { findBestImage } from './imageProcessor.js';
import { findProductColor } from './colorDetector.js';
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

    // Extract color
    const color = findProductColor($, url, retailerConfig);

    // Extract other optional details
    const price = extractPrice($, retailerConfig.selectors.price);
    const brand = retailerConfig.brand?.defaultValue || extractBrand($, retailerConfig.selectors.brand);
    const description = extractDescription($, retailerConfig.selectors.description);

    // Detect product type
    const type = detectProductType(name + ' ' + (description || ''));

    return {
      name,
      imageUrl,
      color,
      price,
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
  if (!selectors) return null;

  for (const selector of selectors) {
    const element = $(selector);
    if (element.length) {
      const text = element.text().trim();
      if (text) return text;

      const content = element.attr('content');
      if (content) return content.trim();
    }
  }

  return null;
}

function extractPrice($, selectors) {
  const priceText = extractText($, selectors);
  if (!priceText) return null;

  // Remove currency symbols and normalize decimal separator
  const normalized = priceText
    .replace(/[^\d.,]/g, '')
    .replace(/[.,](\d{2})$/, '.$1')
    .replace(/[.,]/g, '');

  const price = parseFloat(normalized);
  return isNaN(price) ? null : price;
}

function extractBrand($, selectors) {
  return extractText($, selectors);
}

function extractDescription($, selectors) {
  return extractText($, selectors);
}