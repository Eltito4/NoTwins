import { load } from 'cheerio';
import { logger } from '../logger.js';
import { validateUrl } from './urlValidator.js';
import { getRetailerConfig } from '../retailers/index.js';
import { adaptiveExtract } from './adaptiveExtractor.js';

export async function scrapeProduct(url) {
  try {
    // Validate URL
    if (!url) {
      throw new Error('URL is required');
    }

    const validatedUrl = validateUrl(url);
    if (!validatedUrl) {
      throw new Error('Invalid URL format');
    }

    // Get retailer config
    const retailerConfig = await getRetailerConfig(validatedUrl);
    if (!retailerConfig) {
      throw new Error('This retailer is not supported. Please try a different store.');
    }

    logger.debug('Fetching page:', validatedUrl);
    
    // Use adaptive extraction with ScraperAPI priority
    const productDetails = await adaptiveExtract(validatedUrl, retailerConfig);

    if (!productDetails.name || !productDetails.imageUrl) {
      throw new Error('Could not extract required product details');
    }

    logger.info('Successfully extracted product data:', {
      hasName: !!productDetails.name,
      hasImage: !!productDetails.imageUrl,
      hasPrice: !!productDetails.price,
      hasColor: !!productDetails.color
    });

    return productDetails;
  } catch (error) {
    logger.error('Scraping error:', {
      url,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}