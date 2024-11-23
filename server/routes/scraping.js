import express from 'express';
import axios from 'axios';
import { load } from 'cheerio';
import { logger } from '../utils/logger.js';
import { validateUrl } from '../utils/scraping/urlValidator.js';
import { extractProductDetails } from '../utils/scraping/productExtractor.js';
import { getRetailerConfig, getRetailerHeaders } from '../utils/scraping/retailers/index.js';

const router = express.Router();

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const TIMEOUT = 15000; // 15 seconds

async function fetchWithRetry(url, config, retries = 0) {
  try {
    const response = await axios({
      method: 'get',
      url,
      ...config,
      timeout: TIMEOUT,
      maxRedirects: 5,
      validateStatus: (status) => status === 200,
      headers: {
        ...config.headers,
        'Cookie': '_abck=; bm_sz=; ak_bmsc=;'
      }
    });
    return response;
  } catch (error) {
    logger.error('Fetch error:', {
      url,
      error: error.message,
      attempt: retries + 1,
      status: error.response?.status,
      timestamp: new Date().toISOString()
    });

    if (retries < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retries + 1)));
      return fetchWithRetry(url, config, retries + 1);
    }
    throw error;
  }
}

async function scrapeProductDetails(url) {
  try {
    // Validate and clean URL
    const validatedUrl = validateUrl(url);
    if (!validatedUrl) {
      throw new Error('Invalid URL format');
    }

    // Get retailer-specific configuration
    const retailerConfig = getRetailerConfig(validatedUrl);
    if (!retailerConfig) {
      throw new Error('This retailer is not supported. Please try a different store.');
    }

    // Transform URL if needed
    const transformedUrl = retailerConfig.transformUrl ? 
      retailerConfig.transformUrl(validatedUrl) : 
      validatedUrl;

    const headers = getRetailerHeaders(retailerConfig);

    // Fetch page content with retry mechanism
    const response = await fetchWithRetry(transformedUrl, { 
      headers,
      timeout: TIMEOUT
    });

    if (!response.data) {
      throw new Error('No data received from the server');
    }

    const $ = load(response.data);
    const details = await extractProductDetails($, transformedUrl, retailerConfig);
    
    if (!details.name) {
      throw new Error('Could not find product name');
    }

    if (!details.imageUrl) {
      throw new Error('Could not find product image');
    }

    return {
      name: details.name,
      imageUrl: details.imageUrl,
      price: details.price,
      color: details.color,
      brand: details.brand
    };
  } catch (error) {
    logger.error('Scraping error:', {
      url,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    if (error.code === 'ECONNREFUSED') {
      throw new Error('Connection refused. The website may be blocking automated access.');
    }
    if (error.code === 'ETIMEDOUT') {
      throw new Error('Request timed out. Please try again.');
    }
    if (error.response?.status === 403) {
      throw new Error('Access denied by the website. Please try again later.');
    }
    if (error.response?.status === 404) {
      throw new Error('Product not found. Please check the URL.');
    }

    throw error;
  }
}

router.post('/scrape', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ 
      error: 'URL is required',
      details: 'Please provide a valid product URL'
    });
  }

  try {
    const productDetails = await scrapeProductDetails(url);
    res.json(productDetails);
  } catch (error) {
    logger.error('Scraping endpoint error:', {
      url,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(400).json({
      error: error.message || 'Failed to scrape product details',
      details: error.message
    });
  }
});

export default router;