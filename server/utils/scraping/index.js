import { load } from 'cheerio';
import { logger } from '../logger.js';
import { validateUrl } from './urlValidator.js';
import { getRetailerConfig, getRetailerHeaders } from '../retailers/index.js';
import { extractProductDetails } from './productExtractor.js';
import axios from 'axios';

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
    
    // Special handling for API URLs
    if (transformedUrl.includes('/api/')) {
      try {
        const response = await axios.get(transformedUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36',
            ...retailerConfig.headers
          }
        });

        if (!response.data) {
          throw new Error('No data returned from API');
        }

        // Extract product details from API response
        const productData = response.data;
        
        return {
          name: productData.name || productData.title || productData.displayName,
          imageUrl: productData.images?.[0]?.url || productData.image?.url || productData.imageUrl,
          color: productData.color?.name || productData.colorName,
          price: productData.price?.value || productData.price,
          brand: retailerConfig.brand?.defaultValue || productData.brand,
          type: {
            category: 'clothes',
            subcategory: 'dresses',
            name: 'Dresses'
          },
          description: validatedUrl
        };
      } catch (error) {
        logger.error('API request failed:', error);
        throw new Error(`Failed to fetch product data: ${error.message}`);
      }
    }

    // Regular HTML page scraping
    const response = await fetch(transformedUrl, {
      headers: getRetailerHeaders(retailerConfig)
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