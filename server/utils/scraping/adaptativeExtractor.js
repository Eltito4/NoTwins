import { load } from 'cheerio';
import { logger } from '../logger.js';
import axios from 'axios';
import { detectProductType } from '../categorization/detector.js';
import { findClosestNamedColor } from '../colors/index.js';

/**
 * Adaptively extracts product details from a webpage or API response
 * @param {string} url - The product URL
 * @param {object} retailerConfig - The retailer configuration
 * @returns {Promise<object>} - The extracted product details
 */
export async function adaptiveExtract(url, retailerConfig) {
  try {
    // Special handling for Carolina Herrera API URLs
    if (url.includes('carolinaherrera.com') && url.includes('/p-ready-to-wear/') && url.includes('sku=')) {
      return await extractCarolinaHerreraDetails(url);
    }
    
    // Check if this is an API URL
    if (url.includes('/api/')) {
      return await extractFromApi(url, retailerConfig);
    }
    
    // Otherwise, extract from HTML
    return await extractFromHtml(url, retailerConfig);
  } catch (error) {
    logger.error('Adaptive extraction error:', error);
    throw new Error(`Failed to extract product details: ${error.message}`);
  }
}

/**
 * Extract product details from Carolina Herrera API
 * @param {string} url - The product URL
 * @returns {Promise<object>} - The extracted product details
 */
async function extractCarolinaHerreraDetails(url) {
  try {
    logger.info('Using Carolina Herrera API extraction method');
    
    // Extract SKU from URL
    const skuMatch = url.match(/sku=(\d+)/);
    if (!skuMatch) {
      throw new Error('Could not extract SKU from URL');
    }
    
    const sku = skuMatch[1];
    const apiUrl = `https://www.carolinaherrera.com/api/products/${sku}`;
    
    logger.debug('Fetching Carolina Herrera API data:', { apiUrl });
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.data) {
      throw new Error('No data returned from Carolina Herrera API');
    }
    
    const productData = response.data;
    
    // Extract product details from API response
    const name = productData.name || productData.title || productData.displayName;
    if (!name) {
      throw new Error('Could not find product name in API response');
    }
    
    // Extract image URL
    let imageUrl = null;
    if (productData.images && productData.images.length > 0) {
      imageUrl = productData.images[0].url || productData.images[0].src;
    } else if (productData.image) {
      imageUrl = productData.image.url || productData.image.src;
    }
    
    if (!imageUrl) {
      throw new Error('Could not find product image in API response');
    }
    
    // Make image URL absolute if needed
    if (!imageUrl.startsWith('http')) {
      imageUrl = `https://www.carolinaherrera.com${imageUrl}`;
    }
    
    // Extract other details
    const price = productData.price?.value || productData.price;
    const color = productData.color?.name || productData.colorName;
    const brand = "Carolina Herrera";
    const description = productData.description || productData.shortDescription;
    
    // Detect product type
    const type = detectProductType(name + ' ' + (description || ''));
    
    return {
      name,
      imageUrl,
      color,
      price,
      brand,
      type,
      description: url // Use original URL as description
    };
  } catch (error) {
    logger.error('Error extracting Carolina Herrera details:', error);
    throw new Error(`Failed to extract Carolina Herrera product details: ${error.message}`);
  }
}

/**
 * Extract product details from an API endpoint
 * @param {string} url - The API URL
 * @param {object} retailerConfig - The retailer configuration
 * @returns {Promise<object>} - The extracted product details
 */
async function extractFromApi(url, retailerConfig) {
  try {
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36',
        ...retailerConfig.headers
      }
    });

    if (!response.data) {
      throw new Error('No data returned from API');
    }

    const data = response.data;
    
    // Extract product details from API response
    const name = data.name || data.title || data.displayName;
    if (!name) {
      throw new Error('Could not find product name in API response');
    }
    
    // Extract image URL
    let imageUrl = null;
    if (data.images && data.images.length > 0) {
      imageUrl = data.images[0].url || data.images[0].src;
    } else if (data.image) {
      imageUrl = data.image.url || data.image.src;
    }
    
    if (!imageUrl) {
      throw new Error('Could not find product image in API response');
    }
    
    // Make image URL absolute if needed
    if (!imageUrl.startsWith('http')) {
      const baseUrl = new URL(url).origin;
      imageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }
    
    // Extract other details
    const price = data.price?.value || data.price;
    const color = data.color?.name || data.colorName;
    const brand = retailerConfig.brand?.defaultValue || data.brand;
    const description = data.description || data.shortDescription;
    
    // Detect product type
    const type = detectProductType(name + ' ' + (description || ''));
    
    return {
      name,
      imageUrl,
      color,
      price,
      brand,
      type,
      description: url // Use original URL as description
    };
  } catch (error) {
    logger.error('API extraction error:', error);
    throw error;
  }
}

/**
 * Extract product details from HTML
 * @param {string} url - The product URL
 * @param {object} retailerConfig - The retailer configuration
 * @returns {Promise<object>} - The extracted product details
 */
async function extractFromHtml(url, retailerConfig) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        ...retailerConfig.headers
      }
    });

    if (!response.data) {
      throw new Error('No HTML content returned');
    }

    const $ = load(response.data);
    
    // Extract product name
    const name = extractText($, retailerConfig.selectors.name);
    if (!name) {
      throw new Error('Could not find product name');
    }
    
    // Extract image URL
    let imageUrl = null;
    for (const selector of retailerConfig.selectors.image) {
      const element = $(selector);
      if (element.length) {
        imageUrl = element.attr('content') || element.attr('src') || element.attr('data-src');
        if (imageUrl) break;
      }
    }
    
    // Try meta tags if no image found
    if (!imageUrl) {
      const metaImage = $('meta[property="og:image"], meta[property="product:image"]').attr('content');
      if (metaImage) {
        imageUrl = metaImage;
      }
    }
    
    if (!imageUrl) {
      throw new Error('Could not find product image');
    }
    
    // Make image URL absolute
    if (!imageUrl.startsWith('http')) {
      const baseUrl = new URL(url).origin;
      imageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }
    
    // Extract other details
    const price = extractPrice($, retailerConfig.selectors.price);
    const color = extractColor($, retailerConfig.selectors.color);
    const brand = retailerConfig.brand?.defaultValue || extractText($, retailerConfig.selectors.brand);
    const description = extractText($, retailerConfig.selectors.description);
    
    // Detect product type
    const type = detectProductType(name + ' ' + (description || ''));
    
    return {
      name,
      imageUrl,
      color,
      price,
      brand,
      type,
      description: description || url
    };
  } catch (error) {
    logger.error('HTML extraction error:', error);
    throw error;
  }
}

/**
 * Extract text from HTML using selectors
 * @param {object} $ - Cheerio instance
 * @param {string[]} selectors - Array of CSS selectors
 * @returns {string|null} - Extracted text or null
 */
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

/**
 * Extract price from HTML
 * @param {object} $ - Cheerio instance
 * @param {string[]} selectors - Array of CSS selectors
 * @returns {number|null} - Extracted price or null
 */
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

/**
 * Extract color from HTML
 * @param {object} $ - Cheerio instance
 * @param {string[]} selectors - Array of CSS selectors
 * @returns {string|null} - Extracted color or null
 */
function extractColor($, selectors) {
  const colorText = extractText($, selectors);
  if (!colorText) return null;
  
  return findClosestNamedColor(colorText);
}