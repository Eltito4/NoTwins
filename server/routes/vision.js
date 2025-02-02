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

    const analysis = await analyzeGarmentImage(imageUrl);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('Vision analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze image',
      details: error.message 
    });
  }
});

export default router;