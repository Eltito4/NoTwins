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
    
    // Combine selectors in order of priority:
    // 1. Retailer-specific selectors
    // 2. Platform-specific selectors
    // 3. Generic selectors
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
      image: [
        ...(retailerConfig?.selectors?.image || []),
        ...(platformInfo?.selectors?.image || []),
        ...genericSelectors.image
      ]
    };

    // Extract product details using combined selectors
    const name = extractName($, combinedSelectors.name);
    if (!name) {
      throw new Error('Could not find product name');
    }

    const imageUrl = await findBestImage($, url);
    if (!imageUrl) {
      throw new Error('Could not find valid product image');
    }

    const price = extractPrice($, combinedSelectors.price);
    const color = extractColor($, combinedSelectors.color);
    
    // Handle brand with fallback
    let brand = null;
    if (retailerConfig?.brand?.defaultValue) {
      brand = retailerConfig.brand.defaultValue;
    } else {
      const brandSelectors = retailerConfig?.selectors?.brand || selectors.brand;
      brand = extractBrand($, brandSelectors);
    }

    // Detect article type
    const description = extractDescription($, retailerConfig?.selectors?.description || selectors.description);
    const type = detectArticleType(name, description);

    return {
      name: normalizeText(name),
      imageUrl,
      price,
      color: normalizeColor(color),
      brand,
      type: type.type, // Use just the type, not the category
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
        if (content) return content;
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
        if (text) {
          // Remove currency symbols and normalize decimal separator
          const normalized = text.replace(/[^\d.,]/g, '')
                               .replace(/[.,](\d{2})$/, '.$1')
                               .replace(/[.,]/g, '');
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

function extractColor($, colorSelectors) {
  // Try direct selectors
  for (const selector of colorSelectors) {
    try {
      const element = $(selector);
      if (element.length) {
        // Try text content
        const text = element.text().trim();
        if (text) return text;

        // Try data attributes
        const dataColor = element.attr('data-color') || 
                         element.attr('data-selected-color') || 
                         element.attr('data-value');
        if (dataColor) return dataColor;

        // Try title attribute
        const title = element.attr('title');
        if (title) return title;
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
      if (data['@type'] === 'Product') {
        if (data.color) return data.color;
        if (data.offers?.itemOffered?.color) return data.offers.itemOffered.color;
      }
    }
  } catch (error) {
    console.error('Error parsing JSON-LD color:', error);
  }

  return null;
}

function extractBrand($, brandSelectors) {
  // Try direct selectors
  for (const selector of brandSelectors) {
    try {
      const element = $(selector);
      if (element.length) {
        const text = element.text().trim();
        if (text) return text;

        // Check content attribute for meta tags
        const content = element.attr('content');
        if (content) return content;
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
  // Try direct selectors
  for (const selector of descriptionSelectors) {
    try {
      const element = $(selector);
      if (element.length) {
        const text = element.text().trim();
        if (text) return text;

        // Check content attribute for meta tags
        const content = element.attr('content');
        if (content) return content;
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
      if (data['@type'] === 'Product' && data.description) {
        return data.description;
      }
    }
  } catch (error) {
    console.error('Error parsing JSON-LD description:', error);
  }

  return null;
}