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
    const productDetails = await scrapeProduct(url);
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