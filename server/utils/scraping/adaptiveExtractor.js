import { load } from 'cheerio';
import { logger } from '../logger.js';
import axios from 'axios';
import { detectProductType } from '../categorization/detector.js';
import { findClosestNamedColor } from '../colors/index.js';
import https from 'https';
import { getRetailerHeaders } from '../retailers/index.js';

// Create a custom axios instance with proper SSL configuration
const client = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  }),
  timeout: 10000,
  maxRedirects: 5
});

export async function adaptiveExtract(url, retailerConfig) {
  try {
    // Special handling for Carolina Herrera API URLs
    if (url.includes('carolinaherrera.com') && url.includes('/p-ready-to-wear/')) {
      return await extractCarolinaHerreraDetails(url);
    }
    
    // Check if this is an API URL
    if (url.includes('/api/')) {
      return await extractFromApi(url, retailerConfig);
    }
    
    // Otherwise, extract from HTML
    return await extractFromHtml(url, retailerConfig);
  } catch (error) {
    const errorDetails = {
      message: error.message,
      url,
      code: error.code,
      status: error.response?.status
    };
    logger.error('Adaptive extraction error:', errorDetails);
    throw new Error(`Failed to extract product details: ${error.message}`);
  }
}

async function extractCarolinaHerreraDetails(url) {
  try {
    logger.info('Using Carolina Herrera extraction method');
    
    const response = await client.get(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = load(response.data);
    
    // Extract product name
    const name = $('h1.product-name').text().trim() || 
                $('meta[property="og:title"]').attr('content') ||
                $('h1').first().text().trim();
                
    if (!name) {
      throw new Error('Could not find product name');
    }

    // Extract image URL
    const imageUrl = $('meta[property="og:image"]').attr('content') ||
                    $('.product-image img').attr('src') ||
                    $('.gallery-image img').first().attr('src');
                    
    if (!imageUrl) {
      throw new Error('Could not find product image');
    }

    // Extract price
    const priceText = $('.product-price').text().trim() ||
                     $('meta[property="product:price:amount"]').attr('content');
    const price = priceText ? parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) : null;

    // Extract color
    const colorText = $('.selected-color').text().trim() ||
                     $('.color-selector .active').text().trim();
    const color = colorText ? findClosestNamedColor(colorText) : null;

    // Extract description
    const description = $('.product-description').text().trim() ||
                       $('meta[property="og:description"]').attr('content') ||
                       url;

    // Detect product type
    const type = detectProductType(name + ' ' + description);

    return {
      name,
      imageUrl,
      color,
      price,
      brand: 'Carolina Herrera',
      type,
      description
    };
  } catch (error) {
    const errorDetails = {
      message: error.message,
      url,
      code: error.code,
      status: error.response?.status
    };
    logger.error('Carolina Herrera extraction error:', errorDetails);
    throw new Error(`Failed to extract Carolina Herrera details: ${error.message}`);
  }
}

async function extractFromApi(url, retailerConfig) {
  try {
    const response = await client.get(url, {
      headers: getRetailerHeaders(retailerConfig)
    });

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
    const description = data.description || data.shortDescription || url;
    
    // Detect product type
    const type = detectProductType(name + ' ' + description);
    
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
    const errorDetails = {
      message: error.message,
      url,
      code: error.code,
      status: error.response?.status
    };
    logger.error('API extraction error:', errorDetails);
    throw error;
  }
}

async function extractFromHtml(url, retailerConfig) {
  try {
    logger.debug('Extracting from HTML with config:', {
      retailer: retailerConfig.name,
      selectors: retailerConfig.selectors
    });

    const response = await client.get(url, {
      headers: getRetailerHeaders(retailerConfig)
    });

    const $ = load(response.data);
    
    // Extract product name
    const name = extractText($, retailerConfig.selectors.name);
    if (!name) {
      // Log HTML content for debugging
      logger.debug('HTML content:', $.html());
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
    const description = extractText($, retailerConfig.selectors.description) || url;
    
    // Detect product type
    const type = detectProductType(name + ' ' + description);
    
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
    const errorDetails = {
      message: error.message,
      url,
      code: error.code,
      status: error.response?.status
    };
    logger.error('HTML extraction error:', errorDetails);
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

function extractColor($, selectors) {
  const colorText = extractText($, selectors);
  if (!colorText) return null;
  
  return findClosestNamedColor(colorText);
}