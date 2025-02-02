import vision from '@google-cloud/vision';
import { logger } from '../logger.js';
import { detectProductType } from '../categorization/detector.js';
import { findClosestNamedColor } from '../colors/utils.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const credentialsPath = path.resolve(__dirname, '../../config/google-credentials.json');

logger.info('Vision API credentials path:', credentialsPath);

// Initialize Google Cloud Vision client
let googleVisionClient;
try {
  googleVisionClient = new vision.ImageAnnotatorClient({
    keyFilename: credentialsPath
  });
  logger.info('Vision API client initialized successfully');
} catch (error) {
  logger.error('Failed to initialize Vision API client:', error);
  throw error;
}

export async function analyzeGarmentImage(imageUrl) {
  try {
    logger.info('Starting image analysis for URL:', imageUrl);

    // Analyze the image
    const [result] = await googleVisionClient.annotateImage({
      image: { source: { imageUri: imageUrl } },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 10 },
        { type: 'IMAGE_PROPERTIES' },
        { type: 'OBJECT_LOCALIZATION' },
        { type: 'LOGO_DETECTION' }
      ]
    });

    logger.info('Raw Vision API response:', JSON.stringify(result, null, 2));

    if (!result) {
      throw new Error('No analysis results received');
    }

    const processedResults = processVisionResponse(result);
    logger.info('Processed analysis results:', processedResults);

    return processedResults;
  } catch (error) {
    logger.error('Vision analysis error:', {
      error: error.message,
      stack: error.stack,
      imageUrl
    });
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

function processVisionResponse(result) {
  // Extract labels
  const labels = result.labelAnnotations || [];
  const garmentLabels = labels
    .filter(label => label.score > 0.7)
    .map(label => label.description);

  logger.info('Extracted labels:', garmentLabels);

  // Extract dominant color
  const colors = result.imagePropertiesAnnotation?.dominantColors?.colors || [];
  const dominantColor = colors
    .sort((a, b) => b.score - a.score)
    .map(color => {
      const rgb = color.color;
      return findClosestNamedColor(`rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`);
    })[0];

  logger.info('Extracted dominant color:', dominantColor);

  // Extract brand from logo detection
  const logos = result.logoAnnotations || [];
  const brand = logos.length > 0 ? logos[0].description : null;

  logger.info('Extracted brand:', brand);

  // Detect product type
  const type = detectProductType(garmentLabels.join(' '));

  logger.info('Detected product type:', type);

  return {
    labels: garmentLabels,
    color: dominantColor,
    brand,
    type,
    confidence: Math.max(...labels.map(l => l.score)) * 100
  };
}