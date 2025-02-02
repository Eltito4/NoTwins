import vision from '@google-cloud/vision';
import { logger } from '../logger.js';
import { detectProductType } from '../categorization/detector.js';
import { findClosestNamedColor } from '../colors/utils.js';
import axios from 'axios';

// Initialize Google Cloud Vision client with credentials from env vars
const googleVisionClient = new vision.ImageAnnotatorClient({
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    project_id: process.env.GOOGLE_CLOUD_PROJECT_ID
  }
});

async function downloadImage(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'image/*, application/octet-stream',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    return Buffer.from(response.data);
  } catch (error) {
    logger.error('Failed to download image:', error);
    throw new Error('Failed to download image');
  }
}

export async function analyzeGarmentImage(imageUrl) {
  try {
    logger.debug('Starting image analysis for URL:', { imageUrl });

    // Handle base64 images
    let imageBuffer;
    if (imageUrl.startsWith('data:image')) {
      const base64Data = imageUrl.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      imageBuffer = await downloadImage(imageUrl);
    }

    // Analyze the image with multiple feature types
    const [result] = await googleVisionClient.annotateImage({
      image: { content: imageBuffer },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 10 },
        { type: 'IMAGE_PROPERTIES' },
        { type: 'OBJECT_LOCALIZATION' },
        { type: 'WEB_DETECTION', maxResults: 10 }
      ]
    });

    if (!result) {
      throw new Error('No analysis results received');
    }

    // Extract web entities and similar products
    const webDetection = result.webDetection || {};
    const similarProducts = webDetection.visuallySimilarImages?.map(image => ({
      url: image.url,
      score: image.score
    })) || [];

    const webEntities = webDetection.webEntities?.map(entity => ({
      description: entity.description,
      score: entity.score
    })) || [];

    // Extract labels and detect type
    const labels = result.labelAnnotations?.map(label => label.description) || [];
    const type = detectProductType(labels.join(' '));

    // Extract dominant color
    const color = extractDominantColor(result.imagePropertiesAnnotation);

    // Extract brand from web entities
    const brand = extractBrandFromEntities(webEntities);

    // Process results
    const processedResults = {
      labels,
      color,
      type,
      similarProducts: similarProducts.filter(p => p.score > 0.6),
      webEntities: webEntities.filter(e => e.score > 0.5),
      brand
    };

    logger.debug('Analysis completed successfully:', processedResults);
    return processedResults;

  } catch (error) {
    logger.error('Vision analysis error:', {
      error: error.message,
      stack: error.stack,
      imageUrl
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

function extractBrandFromEntities(entities) {
  const commonBrands = [
    'zara', 'h&m', 'mango', 'nike', 'adidas', 'gucci', 'prada', 
    'louis vuitton', 'chanel', 'hermes', 'uniqlo', 'cos', 
    'massimo dutti', 'calvin klein', 'ralph lauren', 'tommy hilfiger'
  ];

  // Find brand mentions in web entities
  const brandEntity = entities.find(entity => 
    commonBrands.some(brand => 
      entity.description?.toLowerCase().includes(brand)
    )
  );

  if (brandEntity) {
    const brand = commonBrands.find(b => 
      brandEntity.description.toLowerCase().includes(b)
    );
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  }

  return null;
}