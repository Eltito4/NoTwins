import express from 'express';
import { analyzeGarmentImage } from '../utils/vision/index.js';
import { checkDeepSeekStatus } from '../utils/vision/deepseek.js';
import { logger } from '../utils/logger.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    // Check both Vision API and Grok/DeepSeek status
    const grokStatus = await checkDeepSeekStatus();
    
    const visionStatus = {
      status: 'ok',
      credentials: {
        hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
        hasClientEmail: !!process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.GOOGLE_CLOUD_PRIVATE_KEY
      },
      grok: grokStatus
    };

    res.json({
      ...visionStatus,
      status: visionStatus.status || 'error',
      grok: grokStatus
    });
  } catch (error) {
    logger.error('Vision API health check failed:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message,
      details: error.details || error.stack,
      grok: {
        initialized: false,
        hasApiKey: !!process.env.DEEPSEEK_API_KEY,
        error: 'Health check failed'
      }
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