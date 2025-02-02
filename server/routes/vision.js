import express from 'express';
import { analyzeGarmentImage } from '../utils/vision/index.js';
import { logger } from '../utils/logger.js';
import { authMiddleware } from '../middleware/auth.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const router = express.Router();

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Health check endpoint to verify Vision API credentials
router.get('/health', async (req, res) => {
  try {
    logger.debug('Vision API health check');
    
    // Check if credentials file exists and is readable
    const credentialsPath = join(__dirname, '../config/google-credentials.json');
    const hasCredentialsFile = fs.existsSync(credentialsPath);
    
    if (hasCredentialsFile) {
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      res.json({
        status: 'ok',
        credentials: {
          hasClientEmail: !!credentials.client_email,
          hasPrivateKey: !!credentials.private_key
        }
      });
    } else {
      res.json({
        status: 'error',
        message: 'Credentials file not found'
      });
    }
  } catch (error) {
    logger.error('Vision API health check failed:', error);
    res.status(500).json({ error: 'Vision API configuration error' });
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

export default router;