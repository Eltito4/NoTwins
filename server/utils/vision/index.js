import vision from '@google-cloud/vision';
import { logger } from '../logger.js';
import { detectProductType } from '../categorization/detector.js';
import { findClosestNamedColor } from '../colors/utils.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Google Cloud Vision client with credentials
const googleVisionClient = new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, '../../config/google-credentials.json')
});

export async function analyzeGarmentImage(imageUrl) {
  try {
    const [result] = await googleVisionClient.annotateImage({
      image: { source: { imageUri: imageUrl } },
      features: [
        { type: 'OBJECT_LOCALIZATION' },
        { type: 'LABEL_DETECTION' },
        { type: 'IMAGE_PROPERTIES' },
        { type: 'PRODUCT_SEARCH' }
      ]
    });

    return processVisionResponse(result);
  } catch (error) {
    logger.error('Vision analysis error:', error);
    throw new Error('Failed to analyze image');
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

function isBrandName(text) {
  const commonBrands = [
    'zara', 'hm', 'mango', 'nike', 'adidas', 'gucci', 'prada', 'louis vuitton',
    'chanel', 'hermes', 'uniqlo', 'cos', 'massimo dutti', 'calvin klein',
    'ralph lauren', 'tommy hilfiger', 'lacoste', 'levi\'s', 'gap'
  ];
  return commonBrands.some(brand => 
    text.toLowerCase().includes(brand) || 
    brand.includes(text.toLowerCase())
  );
}