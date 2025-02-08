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

    // Log credential info (without sensitive data)
    logger.debug('Initializing Vision client with:', {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      clientEmail: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_CLOUD_PRIVATE_KEY
    });

    const credentials = {
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
      project_id: process.env.GOOGLE_CLOUD_PROJECT_ID
    };

    // Create the client
    visionClient = new ImageAnnotatorClient({
      credentials,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    });

    // Test the client immediately
    return testVisionClient(visionClient);
  } catch (error) {
    logger.error('Failed to initialize Vision client:', {
      error: error.message,
      stack: error.stack,
      details: error.details || error
    });
    return null;
  }
}

async function testVisionClient(client) {
  try {
    // Create a 1x1 black pixel image for testing
    const testImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    
    await client.labelDetection(testImage);
    logger.info('Vision API client test successful');
    return client;
  } catch (error) {
    logger.error('Vision API test failed:', {
      error: error.message,
      details: error.details || error,
      stack: error.stack
    });
    throw error;
  }
}

export function getVisionClient() {
  if (!visionClient) {
    visionClient = initializeVisionClient();
  }
  return visionClient;
}

export async function checkVisionApiStatus() {
  try {
    const client = getVisionClient();
    if (!client) {
      throw new Error('Failed to initialize Vision client');
    }

    await testVisionClient(client);
    
    return {
      status: 'ok',
      credentials: {
        hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
        hasClientEmail: !!process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.GOOGLE_CLOUD_PRIVATE_KEY
      }
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      details: error.details || error.stack,
      credentials: {
        hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
        hasClientEmail: !!process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.GOOGLE_CLOUD_PRIVATE_KEY
      }
    };
  }
}