import express from 'express';
import { analyzeGarmentImage, checkVisionApiStatus } from '../utils/vision/index.js';
import { logger } from '../utils/logger.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    const status = await checkVisionApiStatus();
    res.json(status);
  } catch (error) {
    logger.error('Vision API health check failed:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message,
      details: error.details || error.stack
    });
  }
});

router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ 
        error: 'Image URL is required' 
      });
    }

    const analysis = await analyzeGarmentImage(imageUrl);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('Vision analysis endpoint error:', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({ 
      error: 'Failed to analyze image',
      details: error.message 
    });
  }
});

export default router;