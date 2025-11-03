import { interpretVisionResults, interpretScrapedProduct } from './deepseek.js';
import { checkDeepSeekStatus } from './deepseek.js';
import { getVisionClient } from '../../config/vision.js';
import axios from 'axios';
import { logger } from '../logger.js';


export async function analyzeGarmentImage(imageUrl) {
  try {
    logger.info('Starting Google Vision image analysis:', { imageUrl });

    // Enhanced image URL validation
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }
    
    // Handle base64 images
    if (imageUrl.startsWith('data:image/')) {
      logger.debug('Processing base64 image');
      const base64Data = imageUrl.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid base64 image data');
      }
      
      // For base64 images, we'll use Google Vision API directly
      try {
        const visionClient = getVisionClient();
        if (!visionClient) {
          logger.debug('Initializing Vision client for base64 image...');
          const { initializeVisionClient } = await import('../../config/vision.js');
          await initializeVisionClient();
        }
        
        const client = getVisionClient();
        if (client) {
          logger.debug('Analyzing base64 image with Vision API...');
          const imageBuffer = Buffer.from(base64Data, 'base64');
          const [result] = await client.annotateImage({
            image: { content: imageBuffer },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 30 },
              { type: 'LOGO_DETECTION', maxResults: 10 },
              { type: 'WEB_DETECTION', maxResults: 30 }, 
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
              { type: 'IMAGE_PROPERTIES', maxResults: 10 }
            ]
          });
          
          if (result) {
            const productInfo = await interpretVisionResults(result);
            
            return {
              name: productInfo?.name || 'Fashion Item',
              brand: productInfo?.brand || null,
              color: productInfo?.color || null,
              type: productInfo?.type || {
                category: 'clothes',
                subcategory: 'dresses',
                name: 'Dresses'
              },
              description: productInfo?.description || 'Fashion item from uploaded image',
              confidence: {
                labels: result.labelAnnotations?.[0]?.score || 0.8,
                overall: result.labelAnnotations?.[0]?.score || 0.8
              }
            };
          }
        }
        
        // Fallback for base64 images when Vision API is not available
        const fallbackResult = await interpretVisionResults({
          labelAnnotations: [{ description: 'clothing', score: 0.9 }],
          localizedObjectAnnotations: [{ name: 'garment' }],
          imageProperties: { dominantColors: { colors: [] } }
        });
        
        return {
          name: fallbackResult?.name || 'Fashion Item',
          brand: fallbackResult?.brand || null,
          color: fallbackResult?.color || null,
          type: fallbackResult?.type || {
            category: 'clothes',
            subcategory: 'dresses',
            name: 'Dresses'
          },
          description: fallbackResult?.description || 'Fashion item from uploaded image',
          confidence: {
            labels: 0.7,
            overall: 0.7
          }
        };
      } catch (visionError) {
        logger.warn('Vision analysis of base64 image failed:', visionError);
        // Return basic fallback for base64 images
        return {
          name: 'Fashion Item',
          brand: null,
          color: null,
          type: {
            category: 'clothes',
            subcategory: 'dresses',
            name: 'Dresses'
          },
          description: 'Fashion item from uploaded image',
          confidence: {
            labels: 0.6,
            overall: 0.6
          }
        };
      }
    }

    const visionClient = getVisionClient();
    if (!visionClient) {
      logger.debug('Initializing Vision client...');
      const { initializeVisionClient } = await import('../../config/vision.js');
      await initializeVisionClient();
      
      const client = getVisionClient();
      if (!client) {
        logger.warn('Vision client not available, using fallback analysis');
        
        // If Vision API is not available, throw error to trigger fallback
        throw new Error('Vision API not available for regular URLs');
      }
    }

    logger.debug('Downloading image...');
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
      }
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

    // Use AI to interpret Vision API results
    const productInfo = await interpretVisionResults(result);

    logger.debug('AI Interpretation:', {
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
    const visionClient = getVisionClient();
    if (!visionClient) {
      const { initializeVisionClient } = await import('../../config/vision.js');
      await initializeVisionClient();
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
      deepseek: await checkDeepSeekStatus(),
      credentials: {
        hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
        hasClientEmail: !!process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.GOOGLE_CLOUD_PRIVATE_KEY,
        hasDeepSeekKey: !!process.env.DEEPSEEK_API_KEY
      }
    };
  }
}