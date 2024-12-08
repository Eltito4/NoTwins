import express from 'express';
import axios from 'axios';
import { load } from 'cheerio';
import { logger } from '../utils/logger.js';
import { validateUrl } from '../utils/scraping/urlValidator.js';
import { extractProductDetails } from '../utils/scraping/productExtractor.js';
import { getRetailerConfig, getRetailerHeaders } from '../utils/scraping/retailers/index.js';
import puppeteer from 'puppeteer';

const router = express.Router();
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const TIMEOUT = 15000;

async function fetchWithPuppeteer(url, headers) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(headers['User-Agent']);
    await page.setExtraHTTPHeaders(headers);
    
    // Set default timeout
    page.setDefaultTimeout(TIMEOUT);

    // Enable stealth mode
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      Object.defineProperty(navigator, 'plugins', { get: () => [] });
    });

    await page.goto(url, { waitUntil: 'networkidle0' });
    const content = await page.content();
    
    return { data: content };
  } finally {
    await browser.close();
  }
}

async function fetchWithRetry(url, config, retries = 0) {
  try {
    const response = await axios({
      method: 'get',
      url,
      ...config,
      timeout: TIMEOUT,
      maxRedirects: 5,
      validateStatus: (status) => status === 200
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

    // If we get a 403 or it's the last retry, try with Puppeteer
    if ((error.response?.status === 403 || retries >= MAX_RETRIES - 1) && !url.includes('/api/')) {
      logger.info('Attempting fetch with Puppeteer');
      return fetchWithPuppeteer(url, config.headers);
    }

    if (retries < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retries + 1)));
      return fetchWithRetry(url, config, retries + 1);
    }

    throw error;
  }
}

async function scrapeProductDetails(url) {
  try {
    const validatedUrl = validateUrl(url);
    if (!validatedUrl) {
      throw new Error('Invalid URL format');
    }

    const retailerConfig = getRetailerConfig(validatedUrl);
    if (!retailerConfig) {
      throw new Error('This retailer is not supported. Please try a different store.');
    }

    const transformedUrl = retailerConfig.transformUrl ? 
      retailerConfig.transformUrl(validatedUrl) : 
      validatedUrl;

    const headers = getRetailerHeaders(retailerConfig);
    
    const response = await fetchWithRetry(transformedUrl, { headers });

    if (!response.data) {
      throw new Error('No data received from the server');
    }

    const $ = load(response.data);
    const details = await extractProductDetails($, transformedUrl, retailerConfig);

    if (!details.name || !details.imageUrl) {
      throw new Error('Could not extract required product details');
    }

    return details;
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