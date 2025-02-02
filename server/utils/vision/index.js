import vision from '@google-cloud/vision';
import { logger } from '../logger.js';
import { detectProductType } from '../categorization/detector.js';
import { findClosestNamedColor } from '../colors/utils.js';

// Initialize Google Cloud Vision client
const googleVisionClient = new vision.ImageAnnotatorClient({
  keyFilename: './config/google-credentials.json'
});

export async function analyzeGarmentImage(imageUrl) {
  try {
    logger.debug('Starting image analysis');

    let image;
    if (imageUrl.startsWith('data:image')) {
      // Handle base64 image
      image = {
        content: imageUrl.split(',')[1]
      };
    } else {
      // Handle regular URL
      image = {
        source: { imageUri: imageUrl }
      };
    }

    // Analyze the image
    const [result] = await googleVisionClient.annotateImage({
      image,
      features: [
        { type: 'LABEL_DETECTION', maxResults: 10 },
        { type: 'IMAGE_PROPERTIES' },
        { type: 'OBJECT_LOCALIZATION' }
      ]
    });

    if (!result) {
      throw new Error('No analysis results received');
    }

    // Process results
    const processedResults = {
      labels: result.labelAnnotations?.map(label => label.description) || [],
      color: extractDominantColor(result.imagePropertiesAnnotation),
      type: detectProductType(result.labelAnnotations?.map(label => label.description).join(' ') || '')
    };

    logger.debug('Analysis completed successfully:', processedResults);
    return processedResults;

  } catch (error) {
    logger.error('Vision analysis error:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

function extractDominantColor(properties) {
  if (!properties?.dominantColors?.colors?.length) {
    return null;
  }

  const dominantColor = properties.dominantColors.colors
    .sort((a, b) => b.score - a.score)[0].color;

  const rgb = `rgb(${dominantColor.red}, ${dominantColor.green}, ${dominantColor.blue})`;
  return findClosestNamedColor(rgb);
}