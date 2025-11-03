import express from 'express';
import { scrapeProduct } from '../utils/scraping/index.js';
import { logger } from '../utils/logger.js';
import { scrapeWithScraperApi } from '../utils/scraping/scraperApi.js';

const router = express.Router();

// Diagnostic endpoint to test ScraperAPI
router.post('/test-scraper', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    logger.info('Testing ScraperAPI with URL:', url);
    const result = await scrapeWithScraperApi(url);
    
    // Return diagnostic info
    res.json({
      success: true,
      htmlLength: result.html.length,
      hasTitle: result.html.includes('<title'),
      hasImages: result.html.includes('<img'),
      hasProduct: result.html.toLowerCase().includes('product'),
      hasZaraContent: result.html.includes('zara'),
      titleContent: result.html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || 'No title found',
      firstImageSrc: result.html.match(/<img[^>]+src="([^"]+)"/i)?.[1] || 'No image found',
      htmlPreview: result.html.substring(0, 500) + '...'
    });
  } catch (error) {
    logger.error('ScraperAPI test failed:', error);
    res.status(500).json({
      error: error.message,
      details: error.details || 'No additional details'
    });
  }
});

router.post('/scrape', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ 
      error: 'URL is required',
      details: 'Please provide a valid product URL'
    });
  }

  try {
    logger.info('Starting product scraping:', { url });
    const productDetails = await scrapeProduct(url);
    
    if (!productDetails) {
      throw new Error('Failed to extract product details');
    }

    res.json(productDetails);
  } catch (error) {
    logger.error('Scraping endpoint error:', {
      url,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Send appropriate error response
    const status = error.status || 400;
    res.status(status).json({
      error: error.message || 'Failed to scrape product details',
      details: error.details || error.message
    });
  }
});

export default router;