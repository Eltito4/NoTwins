import express from 'express';
import { analyzeGarmentImage } from '../utils/vision/index.js';
import { logger } from '../utils/logger.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/analyze', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      logger.warn('Missing image URL in request');
      return res.status(400).json({ 
        error: 'Image URL is required' 
      });
    }

    logger.debug('Vision analysis request received:', { imageUrl });

    const analysis = await analyzeGarmentImage(imageUrl);
    
    logger.success('Vision analysis completed successfully:', analysis);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('Vision analysis endpoint error:', {
      error: error.message,
      stack: error.stack,
      imageUrl: req.body.imageUrl
    });

    res.status(500).json({ 
      error: 'Failed to analyze image',
      details: error.message 
    });
  }
});

// Add a test endpoint to verify credentials
router.get('/test-credentials', async (req, res) => {
  try {
    logger.debug('Testing Vision API credentials...');
    const testImageUrl = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f';
    const analysis = await analyzeGarmentImage(testImageUrl);
    
    logger.success('Vision API credentials test passed:', analysis);
    
    res.json({
      success: true,
      message: 'Vision API credentials are working',
      testAnalysis: analysis
    });
  } catch (error) {
    logger.error('Vision credentials test failed:', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      error: 'Vision API credentials test failed',
      details: error.message
    });
  }
});

export default router;