import { findBestImage } from './imageProcessor.js';
import { findProductColor } from './colorDetector.js';
import { detectProductType } from '../categorization/detector.js';
import axios from 'axios';
import { logger } from '../logger.js';

export async function extractProductDetails($, url, retailerConfig) {
  try {
    // Special handling for Carolina Herrera API URLs
    if (url.includes('carolinaherrera.com') && url.includes('/p-ready-to-wear/') && url.includes('sku=')) {
      return await extractCarolinaHerreraDetails(url);
    }

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
    logger.error('Error extracting product details:', error);
    throw error;
  }
}

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