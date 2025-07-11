import axios from 'axios';
import { logger } from '../logger.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getRetailerHeaders } from '../retailers/index.js';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
const SCRAPER_API_URL = 'https://api.scraperapi.com/';

if (!SCRAPER_API_KEY) {
  logger.error('SCRAPER_API_KEY is not set in environment variables');
}

export async function scrapeWithScraperApi(url) {
  try {
    logger.debug('Starting ScraperAPI request:', { url });

    if (!SCRAPER_API_KEY) {
      throw new Error('ScraperAPI key is not configured');
    }

    // Log API key presence (without revealing the key)
    logger.debug('ScraperAPI configuration:', {
      hasKey: !!SCRAPER_API_KEY,
      keyLength: SCRAPER_API_KEY.length
    });

    // Try direct request first for known retailers
    if (shouldTryDirectRequest(url)) {
      try {
        const directResult = await makeDirectRequest(url);
        if (directResult) {
          return directResult;
        }
      } catch (error) {
        logger.warn('Direct request failed, falling back to ScraperAPI:', error);
      }
    }

    // Build the request parameters
    const params = {
      api_key: SCRAPER_API_KEY,
      url: url,
      render_js: 'true',
      country_code: 'es',
      device: 'desktop',
      premium: 'true',
      keep_headers: 'true'
    };

    // Add specific parameters for certain retailers
    if (url.includes('massimodutti.com')) {
      params.session_number = Math.floor(Math.random() * 1000);
      params.residential = 'true';
    }

    // Make the request with retry logic
    const maxRetries = 3;
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await axios({
          method: 'GET',
          url: SCRAPER_API_URL,
          params: params,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          validateStatus: null,
          timeout: 30000 * (i + 1) // Increase timeout with each retry
        });

        // Log response details
        logger.debug('ScraperAPI response received:', {
          status: response.status,
          statusText: response.statusText,
          hasData: !!response.data,
          contentType: response.headers['content-type'],
          contentLength: response.headers['content-length'],
          timestamp: new Date().toISOString()
        });

        // Handle different response types
        if (response.status === 401) {
          throw new Error('Invalid ScraperAPI key');
        }

        if (response.status === 403) {
          throw new Error('Access forbidden - check your ScraperAPI plan limits');
        }

        if (response.status === 429) {
          throw new Error('Too many requests - rate limit exceeded');
        }

        if (response.status === 500) {
          // Try direct request as fallback for 500 errors
          try {
            const directResult = await makeDirectRequest(url);
            if (directResult) {
              return directResult;
            }
          } catch (directError) {
            logger.warn('Direct request fallback failed:', directError);
          }
          throw new Error(`ScraperAPI request failed with status ${response.status}`);
        }

        if (response.status !== 200) {
          throw new Error(`ScraperAPI request failed with status ${response.status}`);
        }

        // Parse response data
        const html = response.data;

        // Validate HTML content
        if (!html || (typeof html === 'string' && html.length < 100)) {
          throw new Error('Invalid or empty HTML content received');
        }

        // Return successful response
        return {
          html,
          url,
          statusCode: response.status
        };
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          logger.warn(`Retry ${i + 1} failed, waiting before next attempt:`, error);
          await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        }
      }
    }

    throw lastError;
  } catch (error) {
    logger.error('ScraperAPI request failed:', {
      error: error.message,
      url,
      timestamp: new Date().toISOString()
    });

    throw new Error(`ScraperAPI request failed: ${error.message}`);
  }
}

async function makeDirectRequest(url) {
  try {
    const headers = {
      ...getRetailerHeaders(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    // Add specific headers for certain retailers
    if (url.includes('massimodutti.com')) {
      headers['x-requested-with'] = 'XMLHttpRequest';
      headers['x-newrelic-id'] = 'VgMGVldRGwIJVVBR';
    }

    const response = await axios({
      method: 'GET',
      url: url,
      headers: headers,
      maxRedirects: 5,
      timeout: 10000,
      validateStatus: null
    });

    if (response.status === 200 && response.data) {
      return {
        html: response.data,
        url: url,
        statusCode: response.status
      };
    }

    return null;
  } catch (error) {
    logger.warn('Direct request failed:', error);
    return null;
  }
}

function shouldTryDirectRequest(url) {
  // List of retailers that usually work with direct requests
  const directRequestDomains = [
    'massimodutti.com',
    'zara.com',
    'pullandbear.com',
    'bershka.com',
    'stradivarius.com',
    'oysho.com',
    'uterque.com'
  ];

  return directRequestDomains.some(domain => url.includes(domain));
}