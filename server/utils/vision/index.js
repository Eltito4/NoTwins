import vision from '@google-cloud/vision';
import { logger } from '../logger.js';
import { detectProductType } from '../categorization/detector.js';
import { findClosestNamedColor } from '../colors/utils.js';
import axios from 'axios';

let visionClient;

export async function checkVisionApiStatus() {
  try {
    // Check if all required environment variables are present
    const credentials = {
      hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
      hasClientEmail: !!process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_CLOUD_PRIVATE_KEY
    };

    // If any credential is missing, return error status
    if (!credentials.hasProjectId || !credentials.hasClientEmail || !credentials.hasPrivateKey) {
      return {
        status: 'error',
        error: 'Missing required Google Cloud credentials',
        credentials
      };
    }

    // Try to initialize client
    if (!visionClient) {
      visionClient = new vision.ImageAnnotatorClient({
        credentials: {
          client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
          project_id: process.env.GOOGLE_CLOUD_PROJECT_ID
        }
      });
    }

    // Use a minimal 1x1 transparent PNG for testing
    const testImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

    // Try to make a simple API call
    try {
      await visionClient.labelDetection(testImage);
      return {
        status: 'ok',
        credentials,
        message: 'Successfully connected to Vision API'
      };
    } catch (apiError) {
      logger.error('Vision API test request failed:', apiError);
      return {
        status: 'error',
        error: 'API request failed: ' + apiError.message,
        credentials,
        details: apiError.details || apiError.message
      };
    }

  } catch (error) {
    logger.error('Vision API health check failed:', error);
    return {
      status: 'error',
      error: error.message,
      credentials: {
        hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
        hasClientEmail: !!process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.GOOGLE_CLOUD_PRIVATE_KEY
      }
    };
  }
}

async function downloadImage(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'image/*, application/octet-stream',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 5000 // 5 second timeout
    });
    return Buffer.from(response.data);
  } catch (error) {
    logger.error('Failed to download image:', error);
    throw new Error('Failed to download image: ' + (error.response?.status ? `HTTP ${error.response.status}` : error.message));
  }
}

export async function analyzeGarmentImage(imageUrl) {
  try {
    logger.debug('Starting image analysis for URL:', { imageUrl });

    if (!visionClient) {
      visionClient = new vision.ImageAnnotatorClient({
        credentials: {
          client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
          project_id: process.env.GOOGLE_CLOUD_PROJECT_ID
        }
      });
    }

    // Handle base64 images
    let imageBuffer;
    if (imageUrl.startsWith('data:image')) {
      const base64Data = imageUrl.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      imageBuffer = await downloadImage(imageUrl);
    }

    // Analyze the image with multiple feature types
    const [result] = await visionClient.annotateImage({
      image: { content: imageBuffer },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 15 },
        { type: 'IMAGE_PROPERTIES', maxResults: 5 },
        { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
        { type: 'WEB_DETECTION', maxResults: 5 }
      ]
    });

    if (!result) {
      throw new Error('No analysis results received');
    }

    // Extract labels and detect type
    const labels = result.labelAnnotations?.map(label => ({
      description: label.description,
      score: label.score
    })) || [];

    // Filter labels with high confidence
    const highConfidenceLabels = labels
      .filter(label => label.score > 0.7)
      .map(label => label.description);

    // Detect product type from labels
    const type = detectProductType(highConfidenceLabels.join(' '));

    // Extract dominant color
    const color = extractDominantColor(result.imagePropertiesAnnotation);

    // Extract brand from web entities
    const webDetection = result.webDetection || {};
    const webEntities = webDetection.webEntities?.map(entity => ({
      description: entity.description,
      score: entity.score
    })) || [];

    const brand = extractBrandFromEntities(webEntities);

    // Process results
    const processedResults = {
      labels: highConfidenceLabels,
      color,
      type,
      brand,
      confidence: {
        labels: labels[0]?.score || 0,
        color: result.imagePropertiesAnnotation?.dominantColors?.colors?.[0]?.score || 0,
        overall: labels[0]?.score || 0
      }
    };

    logger.debug('Analysis completed successfully:', processedResults);
    return processedResults;

  } catch (error) {
    logger.error('Vision analysis error:', {
      error: error.message,
      stack: error.stack,
      imageUrl
    });
    throw new Error('Vision analysis failed: ' + error.message);
  }
}

function extractDominantColor(properties) {
  if (!properties?.dominantColors?.colors?.length) {
    return null;
  }

  // Get top 3 colors by score
  const topColors = properties.dominantColors.colors
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(color => ({
      rgb: `rgb(${Math.round(color.color.red)}, ${Math.round(color.color.green)}, ${Math.round(color.color.blue)})`,
      score: color.score
    }));

  // Find closest named color for each
  const namedColors = topColors.map(color => ({
    name: findClosestNamedColor(color.rgb),
    score: color.score
  })).filter(color => color.name);

  // Return the highest scoring named color
  return namedColors[0]?.name || null;
}

function extractBrandFromEntities(entities) {
  const commonBrands = [
    'zara', 'h&m', 'mango', 'nike', 'adidas', 'gucci', 'prada', 
    'louis vuitton', 'chanel', 'hermes', 'uniqlo', 'cos', 
    'massimo dutti', 'calvin klein', 'ralph lauren', 'tommy hilfiger'
  ];

  // Find brand mentions in web entities with high confidence
  const brandEntity = entities
    .filter(entity => entity.score > 0.7)
    .find(entity => 
      commonBrands.some(brand => 
        entity.description?.toLowerCase().includes(brand)
      )
    );

  if (brandEntity) {
    const brand = commonBrands.find(b => 
      brandEntity.description.toLowerCase().includes(b)
    );
    return brand.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  return null;
}