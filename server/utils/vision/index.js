import { interpretVisionResults, interpretScrapedProduct } from './deepseek.js';
import { logger } from '../logger.js';
import axios from 'axios';

let visionClient = null;

async function initializeVisionClient() {
  try {
    // Try to import Google Cloud Vision dynamically
    let vision;
    try {
      vision = await import('@google-cloud/vision');
    } catch (importError) {
      logger.warn('Google Cloud Vision package not available:', importError.message);
      return null;
    }

    const requiredEnvVars = [
      'GOOGLE_CLOUD_PROJECT_ID',
      'GOOGLE_CLOUD_CLIENT_EMAIL',
      'GOOGLE_CLOUD_PRIVATE_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

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

    const client = new vision.default.ImageAnnotatorClient({
      credentials,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    });

    await testVisionClient(client);
    return client;
  } catch (error) {
    logger.error('Vision client initialization failed:', error);
    return null;
  }
}

async function testVisionClient(client) {
  try {
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    await client.labelDetection(testImage);
    logger.info('Vision API client test successful');
    return true;
  } catch (error) {
    logger.error('Vision API test failed:', error);
    throw error;
  }
}

export async function analyzeGarmentImage(imageUrl) {
  try {
    logger.info('Starting garment image analysis:', { imageUrl });

    if (!visionClient) {
      logger.debug('Initializing Vision client...');
      visionClient = await initializeVisionClient();
      if (!visionClient) {
        throw new Error('Failed to initialize Vision client');
      }
    }

    logger.debug('Downloading image...');
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 5000
    });
    logger.debug('Image downloaded successfully');

    logger.debug('Sending image to Vision API...');
    const [result] = await visionClient.annotateImage({
      image: { content: Buffer.from(response.data) },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 30 },
        { type: 'LOGO_DETECTION', maxResults: 10 },
        { type: 'WEB_DETECTION', maxResults: 30 }, 
        { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
        { type: 'IMAGE_PROPERTIES', maxResults: 10 }
      ]
    });

    if (!result) {
      throw new Error('No analysis results received from Vision API');
    }

    // Log Vision API results
    logger.debug('Vision API results:', {
      hasLabels: !!result.labelAnnotations?.length,
      hasObjects: !!result.localizedObjectAnnotations?.length,
      hasLogos: !!result.logoAnnotations?.length,
      hasColors: !!result.imagePropertiesAnnotation?.dominantColors?.colors?.length
    });

    // Use DeepSeek to interpret Vision API results
    const productInfo = await interpretVisionResults(result);

    logger.debug('DeepSeek Interpretation:', {
      interpretedData: productInfo
    });

    const analysis = {
      name: productInfo?.name || result.localizedObjectAnnotations?.[0]?.name || 'Unknown Item',
      brand: productInfo?.brand || null,
      color: productInfo?.color || null,
      type: productInfo?.type || null,
      description: productInfo?.description || '',
      confidence: {
        labels: result.labelAnnotations?.[0]?.score || 0,
        overall: result.labelAnnotations?.[0]?.score || 0
      }
    };

    logger.info('Analysis completed successfully:', {
      hasName: !!analysis.name,
      hasBrand: !!analysis.brand,
      hasColor: !!analysis.color,
      hasType: !!analysis.type,
      confidence: analysis.confidence.overall
    });

    return analysis;
  } catch (error) {
    logger.error('Vision analysis error:', {
      error: error.message,
      stack: error.stack,
      details: error.details || error
    });
    throw new Error('Vision analysis failed: ' + error.message);
  }
}

export async function checkVisionApiStatus() {
  try {
    if (!visionClient) {
      visionClient = await initializeVisionClient();
    }

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