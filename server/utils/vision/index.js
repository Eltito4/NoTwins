import vision from '@google-cloud/vision';
import { logger } from '../logger.js';
import { detectProductType } from '../categorization/detector.js';
import { findClosestNamedColor } from '../colors/utils.js';

// Initialize Google Cloud Vision client with credentials from environment variables
let googleVisionClient;
try {
  logger.debug('Initializing Vision API client...');
  
  const credentials = {
    type: 'service_account',
    project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_CLOUD_CLIENT_EMAIL)}`
  };

  googleVisionClient = new vision.ImageAnnotatorClient({
    credentials,
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
  });
  
  logger.success('Vision API client initialized successfully');
} catch (error) {
  logger.error('Failed to initialize Vision API client:', {
    error: error.message,
    stack: error.stack
  });
  throw error;
}

export async function analyzeGarmentImage(imageUrl) {
  try {
    logger.debug('Starting image analysis for URL:', imageUrl);

    // Analyze the image
    logger.debug('Making Vision API request...');
    const [result] = await googleVisionClient.annotateImage({
      image: { source: { imageUri: imageUrl } },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 10 },
        { type: 'IMAGE_PROPERTIES' },
        { type: 'OBJECT_LOCALIZATION' },
        { type: 'LOGO_DETECTION' }
      ]
    });

    logger.debug('Raw Vision API response:', JSON.stringify(result, null, 2));

    if (!result) {
      throw new Error('No analysis results received');
    }

    const processedResults = processVisionResponse(result);
    logger.success('Analysis completed successfully:', processedResults);

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
  logger.debug('Processing Vision API response...');

  // Extract labels
  const labels = result.labelAnnotations || [];
  const garmentLabels = labels
    .filter(label => label.score > 0.7)
    .map(label => label.description);

  logger.debug('Extracted labels:', garmentLabels);

  // Extract dominant color
  const colors = result.imagePropertiesAnnotation?.dominantColors?.colors || [];
  const dominantColor = colors
    .sort((a, b) => b.score - a.score)
    .map(color => {
      const rgb = color.color;
      return findClosestNamedColor(`rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`);
    })[0];

  logger.debug('Extracted dominant color:', dominantColor);

  // Extract brand from logo detection
  const logos = result.logoAnnotations || [];
  const brand = logos.length > 0 ? logos[0].description : null;

  logger.debug('Extracted brand:', brand);

  // Detect product type
  const type = detectProductType(garmentLabels.join(' '));

  logger.debug('Detected product type:', type);

  return {
    labels: garmentLabels,
    color: dominantColor,
    brand,
    type,
    confidence: Math.max(...labels.map(l => l.score)) * 100
  };
}