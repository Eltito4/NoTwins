import { findBestImage } from './imageProcessor.js';
import { selectors } from './selectors.js';
import { normalizeText, extractPrice, normalizeColor } from './normalizers.js';
import axios from 'axios';

export async function extractProductDetails($, url, retailerConfig) {
  try {
    // Check if retailer has a custom API handler
    if (retailerConfig?.transformUrl) {
      const transformedUrl = retailerConfig.transformUrl(url);
      
      // If URL was transformed to an API endpoint
      if (transformedUrl !== url && transformedUrl.includes('/api/')) {
        const response = await axios.get(transformedUrl, {
          headers: {
            ...retailerConfig.headers,
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          timeout: 15000,
          maxRedirects: 5
        });

        // Use custom response handler if available
        if (retailerConfig.responseHandler) {
          return await retailerConfig.responseHandler(response);
        }

        // Default API response handling
        const data = response.data;
        return {
          name: normalizeText(data.name || data.title),
          imageUrl: data.images?.[0]?.url || data.image,
          price: extractPrice(data.price?.value || data.price),
          color: normalizeColor(data.color?.name || data.colorName),
          brand: data.brand?.name || retailerConfig.defaultBrand
        };
      }
    }

    // Regular HTML scraping if no API or transformation needed
    const retailerSelectors = retailerConfig?.selectors || {};
    const combinedSelectors = {
      name: [...(retailerSelectors.name || []), ...selectors.name],
      price: [...(retailerSelectors.price || []), ...selectors.price],
      color: [...(retailerSelectors.color || []), ...selectors.color],
      brand: retailerConfig?.brand?.defaultValue ? 
        [{ defaultValue: retailerConfig.brand.defaultValue }] : 
        [...(retailerSelectors.brand || []), ...selectors.brand]
    };

    // Extract product name
    const name = extractName($, combinedSelectors.name);
    if (!name) {
      throw new Error('Could not find product name');
    }

    // Find best product image
    const imageUrl = await findBestImage($, url, retailerConfig);
    if (!imageUrl) {
      throw new Error('Could not find valid product image');
    }

    // Extract other product details
    const price = extractProductPrice($, combinedSelectors.price);
    const color = extractColor($, combinedSelectors.color);
    const brand = extractBrand($, combinedSelectors.brand) || retailerConfig?.brand?.defaultValue;

    return {
      name: normalizeText(name),
      imageUrl,
      price,
      color: normalizeColor(color),
      brand
    };
  } catch (error) {
    console.error('Error extracting product details:', error);
    throw new Error('Failed to extract product details. Please check the URL and try again.');
  }
}

function extractName($, selectors) {
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      const text = element.text().trim();
      if (text) return text;
    }
  }

  // Try JSON-LD
  const jsonLd = $('script[type="application/ld+json"]');
  for (let i = 0; i < jsonLd.length; i++) {
    try {
      const data = JSON.parse($(jsonLd[i]).html());
      if (data['@type'] === 'Product' && data.name) {
        return data.name;
      }
    } catch (e) {
      continue;
    }
  }

  // Try meta tags
  const metaTitle = $('meta[property="og:title"], meta[name="twitter:title"]').attr('content');
  if (metaTitle) return metaTitle;

  return null;
}

function extractProductPrice($, selectors) {
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      const text = element.text().trim();
      const price = extractPrice(text);
      if (price) return price;
    }
  }

  // Try JSON-LD
  const jsonLd = $('script[type="application/ld+json"]');
  for (let i = 0; i < jsonLd.length; i++) {
    try {
      const data = JSON.parse($(jsonLd[i]).html());
      if (data['@type'] === 'Product' && data.offers?.price) {
        return parseFloat(data.offers.price);
      }
    } catch (e) {
      continue;
    }
  }

  return null;
}

function extractColor($, selectors) {
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      const text = element.text().trim();
      if (text) return text;

      // Check for color in data attributes
      const dataColor = element.attr('data-color') || 
                       element.attr('data-selected-color') || 
                       element.attr('data-value');
      if (dataColor) return dataColor;
    }
  }

  // Try JSON-LD
  const jsonLd = $('script[type="application/ld+json"]');
  for (let i = 0; i < jsonLd.length; i++) {
    try {
      const data = JSON.parse($(jsonLd[i]).html());
      if (data['@type'] === 'Product' && data.color) {
        return data.color;
      }
    } catch (e) {
      continue;
    }
  }

  return null;
}

function extractBrand($, selectors) {
  // Check for default brand value first
  const defaultBrand = selectors.find(s => s.defaultValue)?.defaultValue;
  if (defaultBrand) return defaultBrand;

  // Try selectors
  for (const selector of selectors) {
    if (typeof selector === 'string') {
      const element = $(selector).first();
      if (element.length) {
        const text = element.text().trim();
        if (text) return text;
      }
    }
  }

  // Try JSON-LD
  const jsonLd = $('script[type="application/ld+json"]');
  for (let i = 0; i < jsonLd.length; i++) {
    try {
      const data = JSON.parse($(jsonLd[i]).html());
      if (data['@type'] === 'Product' && data.brand?.name) {
        return data.brand.name;
      }
    } catch (e) {
      continue;
    }
  }

  return null;
}