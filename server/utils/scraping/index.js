import { load } from 'cheerio';
import { logger } from '../logger.js';
import { validateUrl } from './urlValidator.js';
import { getRetailerConfig } from '../retailers/index.js';
import { extractProductDetails } from './productExtractor.js';

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

    // Transform URL if needed
    const transformedUrl = retailerConfig.transformUrl ? 
      retailerConfig.transformUrl(validatedUrl) : 
      validatedUrl;

    // Fetch page content
    logger.debug('Fetching page:', transformedUrl);
    const response = await fetch(transformedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        ...retailerConfig.headers
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = load(html);

    // Extract product details
    const details = await extractProductDetails($, transformedUrl, retailerConfig);

    if (!details.name || !details.imageUrl) {
      throw new Error('Could not extract required product details');
    }

    return details;
  } catch (error) {
    logger.error('Scraping error:', {
      url,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}