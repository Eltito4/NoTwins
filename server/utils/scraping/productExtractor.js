import { findBestImage } from './imageProcessor.js';
import { selectors } from './selectors.js';
import { normalizeText, normalizeColor } from './normalizers.js';
import { detectArticleType } from './typeDetector.js';
import { detectPlatform, getGenericSelectors } from './platformDetector.js';

export async function extractProductDetails($, url, retailerConfig) {
  try {
    // Detect platform and get platform-specific selectors
    const platformInfo = detectPlatform($);
    const genericSelectors = getGenericSelectors();
    
    // Combine selectors in order of priority
    const combinedSelectors = {
      name: [
        ...(retailerConfig?.selectors?.name || []),
        ...(platformInfo?.selectors?.name || []),
        ...genericSelectors.name
      ],
      price: [
        ...(retailerConfig?.selectors?.price || []),
        ...(platformInfo?.selectors?.price || []),
        ...genericSelectors.price
      ],
      color: [
        ...(retailerConfig?.selectors?.color || []),
        ...(platformInfo?.selectors?.color || []),
        ...genericSelectors.color
      ],
      brand: [
        ...(retailerConfig?.selectors?.brand || []),
        ...(platformInfo?.selectors?.brand || []),
        ...genericSelectors.name
      ]
    };

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

    // Extract other product details
    const price = extractPrice($, combinedSelectors.price);
    const color = extractColor($, combinedSelectors.color);
    
    // Handle brand with fallback to retailer name
    let brand = null;
    if (retailerConfig?.brand?.defaultValue) {
      brand = retailerConfig.brand.defaultValue;
    } else {
      brand = extractBrand($, combinedSelectors.brand) || retailerConfig?.name;
    }

    // Extract description and detect article type
    const description = extractDescription($, retailerConfig?.selectors?.description || selectors.description);
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

function extractName($, nameSelectors) {
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
  // Try direct selectors
  for (const selector of priceSelectors) {
    try {
      const element = $(selector);
      if (element.length) {
        const text = element.text().trim();
        const price = parsePrice(text);
        if (price) return price;

        // Check content attribute for meta tags
        const content = element.attr('content');
        if (content) {
          const metaPrice = parsePrice(content);
          if (metaPrice) return metaPrice;
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

function extractColor($, colorSelectors) {
  // Try direct selectors
  for (const selector of colorSelectors) {
    try {
      const element = $(selector);
      if (element.length) {
        const text = element.text().trim();
        if (text) return text;

        // Check data attributes
        const dataColor = element.attr('data-color') || 
                         element.attr('data-selected-color') || 
                         element.attr('data-value');
        if (dataColor) return dataColor;
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
      if (data['@type'] === 'Product' && data.color) {
        return data.color;
      }
    }
  } catch (error) {
    console.error('Error parsing JSON-LD color:', error);
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

function parsePrice(text) {
  if (!text) return null;
  
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
  return isNaN(price) ? null : price;
}