import vision from '@google-cloud/vision';
import { logger } from '../logger.js';
import { detectProductType } from '../categorization/detector.js';
import { findClosestNamedColor } from '../colors/utils.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const credentialsPath = path.resolve(__dirname, '../../config/google-credentials.json');

// Initialize Google Cloud Vision client
const googleVisionClient = new vision.ImageAnnotatorClient({
  keyFilename: credentialsPath
});

export async function analyzeGarmentImage(imageUrl) {
  try {
    logger.info('Analyzing image:', imageUrl);

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

    logger.info('Vision API response:', JSON.stringify(result, null, 2));

    if (!result) {
      throw new Error('No analysis results received');
    }

    return processVisionResponse(result);
  } catch (error) {
    logger.error('Vision analysis error:', error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

function processVisionResponse(result) {
  // Extract labels
  const labels = result.labelAnnotations || [];
  const garmentLabels = labels
    .filter(label => label.score > 0.7)
    .map(label => label.description);

  // Extract dominant color
  const colors = result.imagePropertiesAnnotation?.dominantColors?.colors || [];
  const dominantColor = colors
    .sort((a, b) => b.score - a.score)
    .map(color => {
      const rgb = color.color;
      return findClosestNamedColor(`rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`);
    })[0];

  // Extract brand from logo detection
  const logos = result.logoAnnotations || [];
  const brand = logos.length > 0 ? logos[0].description : null;

  // Detect product type
  const type = detectProductType(garmentLabels.join(' '));

  return {
    labels: garmentLabels,
    color: dominantColor,
    brand,
    type,
    confidence: Math.max(...labels.map(l => l.score)) * 100
  };
}