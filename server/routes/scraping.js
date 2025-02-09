import express from 'express';
import { scrapeProduct } from '../utils/scraping/index.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

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