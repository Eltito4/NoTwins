import express from 'express';
import { analyzeGarmentImage } from '../utils/vision/index.js';
import { logger } from '../utils/logger.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    logger.debug('Vision API health check');
    
    const hasCredentials = !!(
      process.env.GOOGLE_CLOUD_PROJECT_ID &&
      process.env.GOOGLE_CLOUD_CLIENT_EMAIL &&
      process.env.GOOGLE_CLOUD_PRIVATE_KEY
    );

    res.json({
      status: hasCredentials ? 'ok' : 'missing_credentials',
      credentials: {
        hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
        hasClientEmail: !!process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.GOOGLE_CLOUD_PRIVATE_KEY
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Vision API health check failed:', error);
    res.status(500).json({ 
      error: 'Vision API configuration error',
      details: error.message
    });
  }
});

router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      logger.warn('Missing image URL in request');
      return res.status(400).json({ 
        error: 'Image URL is required' 
      });
    }

    logger.debug('Vision analysis request received');

    const analysis = await analyzeGarmentImage(imageUrl);
    
    logger.debug('Vision analysis completed successfully:', analysis);
    
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