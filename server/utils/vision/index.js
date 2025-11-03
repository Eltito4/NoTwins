// MIGRATED TO CLAUDE - This file now uses Claude AI instead of Google Vision + DeepSeek
import { analyzeGarmentImage as claudeAnalyzeImage, checkClaudeStatus } from '../claude/index.js';
import { logger } from '../logger.js';

export async function analyzeGarmentImage(imageUrl) {
  try {
    logger.info('Starting Claude image analysis (migrated from Google Vision):', { imageUrl });

    // Use Claude for image analysis instead of Google Vision + DeepSeek
    return await claudeAnalyzeImage(imageUrl);
  } catch (error) {
    logger.error('Claude image analysis error:', {
      error: error.message,
      stack: error.stack
    });
    throw new Error('Image analysis failed: ' + error.message);
  }
}

export async function checkVisionApiStatus() {
  try {
    // Now uses Claude instead of Google Vision
    return await checkClaudeStatus();
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      details: error.details || error.stack,
      credentials: {
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY
      }
    };
  }
}