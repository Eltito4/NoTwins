import { findBestImage } from './imageProcessor.js';
import { selectors } from './selectors.js';
import { normalizeText, normalizeColor } from './normalizers.js';
import { detectArticleType } from './typeDetector.js';

export async function extractProductDetails($, url, retailerConfig) {
  try {
    // Get retailer-specific selectors
    const retailerSelectors = retailerConfig?.selectors || {};
    
    // Extract product name
    const name = extractName($, retailerSelectors.name || selectors.name);
    if (!name) {
      throw new Error('Could not find product name');
    }

    // Find best product image
    const imageUrl = await findBestImage($, url);
    if (!imageUrl) {
      throw new Error('Could not find valid product image');
    }

    // Extract other product details
    const price = extractPrice($, retailerSelectors.price || selectors.price);
    const color = extractColor($, retailerSelectors.color || selectors.color);
    
    // Handle brand with fallback to default value
    let brand = null;
    if (retailerConfig?.brand?.defaultValue) {
      brand = retailerConfig.brand.defaultValue;
    } else {
      const brandSelectors = retailerSelectors.brand || selectors.brand;
      brand = extractBrand($, brandSelectors);
    }

    // Detect article type
    const description = extractDescription($, retailerSelectors.description || selectors.description);
    const type = detectArticleType(name, description);

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
      }
    } catch (error) {
      console.error('Error with selector:', selector, error);
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

  // Try meta tags
  try {
    const metaTitle = $('meta[property="og:title"], meta[name="twitter:title"]').attr('content');
    if (metaTitle) return metaTitle;
  } catch (error) {
    console.error('Error getting meta title:', error);
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