import { interpretProductDetails } from './gemini.js';
import { logger } from '../logger.js';
import vision from '@google-cloud/vision';
import { detectProductType } from '../categorization/detector.js';
import { findClosestNamedColor } from '../colors/index.js';
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

    logger.debug('Raw Vision API response:', {
      hasImageProperties: !!result.imagePropertiesAnnotation,
      hasLabelAnnotations: !!result.labelAnnotations,
      hasLogoAnnotations: !!result.logoAnnotations,
      hasObjectAnnotations: !!result.localizedObjectAnnotations,
      hasWebSearch: !!result.webDetection,
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

    const productUrls = result.webDetection?.pagesWithMatchingImages
      ?.map(page => page.url)
      .filter(url => {
        try {
          const urlObj = new URL(url);
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

    const visionResults = {
      webDetection: result.webDetection || {},
      labelAnnotations: result.labelAnnotations || [],
      localizedObjectAnnotations: result.localizedObjectAnnotations || [],
      imageProperties: result.imagePropertiesAnnotation || {},
      logoAnnotations: result.logoAnnotations || [],
      productUrls
    };

    // Extract brand with improved logic
    let brand = null;

    // First try logo detection
    if (result.logoAnnotations?.length > 0) {
      brand = result.logoAnnotations[0].description;
    }

    // Then try extracting from product URLs
    if (!brand && productUrls.length > 0) {
      try {
        const url = new URL(productUrls[0]);
        const domain = url.hostname.toLowerCase();
        const brandMatch = domain.match(/^(?:www\.)?([^.]+)\./);
        if (brandMatch) {
          const potentialBrand = brandMatch[1];
          // Convert to title case and handle special cases
          brand = potentialBrand
            .split(/[.-]/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
        }
      } catch (e) {
        logger.debug('Failed to extract brand from URL:', e);
      }
    }

    // Finally try web entities with high confidence
    if (!brand && result.webDetection?.webEntities) {
      const brandEntity = result.webDetection.webEntities.find(entity => 
        entity.score > 0.7 && 
        !entity.description.toLowerCase().includes('dress') &&
        !entity.description.toLowerCase().includes('clothing') &&
        !entity.description.toLowerCase().includes('fashion')
      );
      if (brandEntity) {
        brand = brandEntity.description;
      }
    }

    const directType = result.localizedObjectAnnotations?.[0]?.name || 
                      result.labelAnnotations?.[0]?.description;
    
    const dominantColors = result.imagePropertiesAnnotation?.dominantColors?.colors || [];
    dominantColors.sort((a, b) => b.score - a.score);
    const dominantColor = dominantColors[0];
    
    let colorName = null;
    if (dominantColor) {
      const rgb = `rgb(${Math.round(dominantColor.color.red)}, ${Math.round(dominantColor.color.green)}, ${Math.round(dominantColor.color.blue)})`;
      colorName = findClosestNamedColor(rgb);
      
      if (!colorName) {
        const colorLabel = result.labelAnnotations?.find(label => 
          label.description.toLowerCase().includes('red') ||
          label.description.toLowerCase().includes('blue') ||
          label.description.toLowerCase().includes('green') ||
          label.description.toLowerCase().includes('black') ||
          label.description.toLowerCase().includes('white') ||
          label.description.toLowerCase().includes('yellow') ||
          label.description.toLowerCase().includes('purple') ||
          label.description.toLowerCase().includes('pink') ||
          label.description.toLowerCase().includes('orange') ||
          label.description.toLowerCase().includes('brown') ||
          label.description.toLowerCase().includes('gray') ||
          label.description.toLowerCase().includes('grey')
        );
        
        if (colorLabel) {
          colorName = findClosestNamedColor(colorLabel.description);
        }
      }
    }

    const productInfo = await interpretProductDetails(visionResults);

    const analysis = {
      name: productInfo?.name || directType || 'Unknown Item',
      brand: productInfo?.brand || brand || null,
      color: productInfo?.color || colorName || null,
      type: productInfo?.type || detectProductType(result.labelAnnotations?.map(l => l.description).join(' ')),
      price: productInfo?.price || null,
      description: productInfo?.description || productUrls[0] || '',
      confidence: {
        labels: result.labelAnnotations?.[0]?.score || 0,
        color: dominantColor?.score || 0,
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
      productUrls: productUrls.slice(0, 3)
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

    const geminiStatus = await import('./gemini.js').then(m => m.checkGeminiStatus());

    return {
      status: 'ok',
      credentials: {
        hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
        hasClientEmail: !!process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.GOOGLE_CLOUD_PRIVATE_KEY
      },
      gemini: geminiStatus
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
      },
      gemini: await import('./gemini.js').then(m => m.checkGeminiStatus())
    };
  }
}