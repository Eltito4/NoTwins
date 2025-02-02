import vision from '@google-cloud/vision';
import { logger } from '../logger.js';
import { detectProductType } from '../categorization/detector.js';
import { findClosestNamedColor } from '../colors/utils.js';

// Initialize Google Cloud Vision client
const googleVisionClient = new vision.ImageAnnotatorClient({
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    project_id: process.env.GOOGLE_CLOUD_PROJECT_ID
  }
});

export async function analyzeGarmentImage(imageUrl) {
  try {
    // First check if the image URL is accessible
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to access image URL');
    }

    // Analyze the image
    const [result] = await googleVisionClient.annotateImage({
      image: { source: { imageUri: imageUrl } },
      features: [
        { type: 'OBJECT_LOCALIZATION' },
        { type: 'LABEL_DETECTION' },
        { type: 'IMAGE_PROPERTIES' },
        { type: 'PRODUCT_SEARCH' }
      ]
    });

    if (!result) {
      throw new Error('No analysis results received');
    }

    logger.info('Vision API response:', result);
    return processVisionResponse(result);
  } catch (error) {
    logger.error('Vision analysis error:', error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

function processVisionResponse(result) {
  const labels = result.labelAnnotations || [];
  const objects = result.localizedObjectAnnotations || [];
  const colors = result.imagePropertiesAnnotation?.dominantColors?.colors || [];

  // Extract garment type
  const garmentLabels = labels
    .filter(label => label.score > 0.7)
    .map(label => label.description);
  const detectedType = detectProductType(garmentLabels.join(' '));

  // Extract dominant color
  const dominantColor = colors
    .sort((a, b) => b.score - a.score)
    .map(color => {
      const rgb = color.color;
      return findClosestNamedColor(`rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`);
    })[0];

  // Extract brand if available
  const brand = result.webDetection?.webEntities
    ?.find(entity => entity.score > 0.8 && isBrandName(entity.description))
    ?.description;

  return {
    type: detectedType,
    color: dominantColor,
    brand: brand,
    confidence: Math.max(...labels.map(l => l.score)) * 100,
    rawLabels: garmentLabels
  };
}