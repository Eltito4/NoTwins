import { ImageAnnotatorClient } from '@google-cloud/vision';
import { logger } from '../utils/logger.js';

let visionClient = null;

export function initializeVisionClient() {
  try {
    // Check for required credentials
    const requiredEnvVars = [
      'GOOGLE_CLOUD_PROJECT_ID',
      'GOOGLE_CLOUD_CLIENT_EMAIL',
      'GOOGLE_CLOUD_PRIVATE_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Create the client
    visionClient = new ImageAnnotatorClient({
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
        project_id: process.env.GOOGLE_CLOUD_PROJECT_ID
      }
    });

    logger.info('Vision API client initialized successfully');
    return visionClient;
  } catch (error) {
    logger.error('Failed to initialize Vision client:', error);
    return null;
  }
}

export function getVisionClient() {
  if (!visionClient) {
    visionClient = initializeVisionClient();
  }
  return visionClient;
}