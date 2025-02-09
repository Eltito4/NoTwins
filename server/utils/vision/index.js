import { interpretProductDetails } from './gemini.js';
import { logger } from '../logger.js';
import vision from '@google-cloud/vision';
import { detectProductType } from '../categorization/detector.js';
import { findClosestNamedColor } from '../colors/utils.js';
import axios from 'axios';

let visionClient = null;

async function initializeVisionClient() {
  try {
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

    const client = new vision.ImageAnnotatorClient({
      credentials,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    });

    await testVisionClient(client);
    return client;
  } catch (error) {
    logger.error('Vision client initialization failed:', {
      error: error.message,
      stack: error.stack
    });
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

    // Download image
    logger.debug('Downloading image...');
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 5000
    });
    logger.debug('Image downloaded successfully');

    // Analyze image with multiple features
    logger.debug('Sending image to Vision API...');
    const [result] = await visionClient.annotateImage({
      image: { content: Buffer.from(response.data) },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 20 },
        { type: 'LOGO_DETECTION', maxResults: 5 },
        { type: 'WEB_DETECTION', maxResults: 20 }, // Increased for better URL coverage
        { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
        { type: 'IMAGE_PROPERTIES', maxResults: 5 }
      ]
    });

    if (!result) {
      throw new Error('No analysis results received from Vision API');
    }

    // Log detailed Vision API response
    logger.debug('Raw Vision API response:', {
      hasImageProperties: true,
      hasLabelAnnotations: true,
      hasLogoAnnotations: true,
      hasObjectAnnotations: true,
      hasWebSearch: true,
      response: {
        labelAnnotations: result.labelAnnotations?.map(label => ({
          description: label.description,
          score: label.score
        })),
        logoAnnotations: result.logoAnnotations?.map(logo => ({
          description: logo.description,
          score: logo.score
        })),
        webDetection: {
          webEntities: result.webDetection?.webEntities?.map(entity => ({
            description: entity.description,
            score: entity.score
          })),
          fullMatchingImages: result.webDetection?.fullMatchingImages?.length,
          pagesWithMatchingImages: result.webDetection?.pagesWithMatchingImages?.map(page => ({
            url: page.url,
            score: page.score
          }))
        },
        objects: result.localizedObjectAnnotations?.map(obj => ({
          name: obj.name,
          confidence: obj.score
        }))
      }
    });

    // Extract product URLs from web detection
    const productUrls = result.webDetection?.pagesWithMatchingImages
      ?.map(page => page.url)
      .filter(url => {
        try {
          const urlObj = new URL(url);
          // Filter for e-commerce and brand domains
          return (
            !urlObj.hostname.includes('pinterest') &&
            !urlObj.hostname.includes('instagram') &&
            !urlObj.hostname.includes('facebook') &&
            !urlObj.hostname.includes('twitter') &&
            !urlObj.hostname.includes('youtube') &&
            !urlObj.hostname.includes('google') &&
            !urlObj.hostname.includes('bing') &&
            (urlObj.hostname.includes('shop') ||
             urlObj.hostname.includes('store') ||
             /\.(com|net|org)$/.test(urlObj.hostname))
          );
        } catch {
          return false;
        }
      }) || [];

    // Extract basic information
    const visionResults = {
      webDetection: result.webDetection || {},
      labelAnnotations: result.labelAnnotations || [],
      localizedObjectAnnotations: result.localizedObjectAnnotations || [],
      imageProperties: result.imagePropertiesAnnotation || {},
      productUrls
    };

    // After getting Vision API results, interpret with Gemini
    const productInfo = await interpretProductDetails(visionResults);

    if (!productInfo) {
      logger.warn('No product information returned from Gemini');
    }

    // Extract color information
    const color = result.imagePropertiesAnnotation?.dominantColors?.colors?.[0];
    let dominantColor = null;
    
    if (color) {
      dominantColor = findClosestNamedColor(
        `rgb(${Math.round(color.color.red)}, ${Math.round(color.color.green)}, ${Math.round(color.color.blue)})`
      );
    }

    // Detect type from label annotations
    const labels = result.labelAnnotations?.map(label => label.description) || [];
    const type = detectProductType(labels.join(' '));

    // Combine Vision API and Gemini results
    const analysis = {
      name: productInfo?.name || '',
      brand: productInfo?.brand || '',
      color: productInfo?.color || dominantColor,
      type: productInfo?.type || type,
      price: productInfo?.price || null,
      description: productInfo?.description || productUrls[0] || '',
      confidence: {
        labels: result.labelAnnotations?.[0]?.score || 0,
        color: color?.score || 0,
        overall: result.labelAnnotations?.[0]?.score || 0
      }
    };

    logger.info('Analysis completed successfully:', {
      hasName: !!analysis.name,
      hasBrand: !!analysis.brand,
      hasColor: !!analysis.color,
      hasType: !!analysis.type,
      hasUrl: !!analysis.description,
      confidence: analysis.confidence.overall,
      productUrls: productUrls.slice(0, 3) // Log top 3 URLs
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