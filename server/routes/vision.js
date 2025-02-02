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
      return res.status(400).json({ 
        error: 'Image URL is required' 
      });
    }

    logger.info('Starting image analysis for URL:', imageUrl);

    const analysis = await analyzeGarmentImage(imageUrl);
    
    logger.info('Analysis completed successfully:', analysis);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('Vision analysis error:', {
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
    logger.info('Testing Vision API credentials...');
    const testImageUrl = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f';
    const analysis = await analyzeGarmentImage(testImageUrl);
    res.json({
      success: true,
      message: 'Vision API credentials are working',
      testAnalysis: analysis
    });
  } catch (error) {
    logger.error('Vision credentials test failed:', error);
    res.status(500).json({
      error: 'Vision API credentials test failed',
      details: error.message
    });
  }
});

export default router;