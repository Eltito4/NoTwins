import vision from '@google-cloud/vision';
import { logger } from '../logger.js';
import { detectProductType } from '../categorization/detector.js';
import { findClosestNamedColor } from '../colors/utils.js';
import axios from 'axios';

let visionClient = null;

async function initializeVisionClient() {
  try {
    // Check for required credentials
    const requiredEnvVars = [
      'GOOGLE_CLOUD_PROJECT_ID',
      'GOOGLE_CLOUD_CLIENT_EMAIL',
      'GOOGLE_CLOUD_PRIVATE_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Log credential info (without sensitive data)
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

    // Create the client with enhanced features
    const client = new vision.ImageAnnotatorClient({
      credentials,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    });

    // Test the client immediately
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
    if (!visionClient) {
      visionClient = await initializeVisionClient();
      if (!visionClient) {
        throw new Error('Failed to initialize Vision client');
      }
    }

    // Download image
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 5000
    });
    const imageBuffer = Buffer.from(response.data);

    // Analyze image with multiple features including Google Lens capabilities
    const [result] = await visionClient.annotateImage({
      image: { content: imageBuffer },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 20 },
        { type: 'LOGO_DETECTION', maxResults: 5 },
        { type: 'WEB_DETECTION', maxResults: 10 },
        { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
        { type: 'IMAGE_PROPERTIES', maxResults: 5 },
        { type: 'PRODUCT_SEARCH', maxResults: 5 },
        { type: 'TEXT_DETECTION' }, // For reading any text/labels on clothing
        { type: 'SAFE_SEARCH_DETECTION' } // Ensure image appropriateness
      ]
    });

    if (!result) {
      throw new Error('No analysis results received');
    }

    // Extract brand from logo detection, web entities, and product search
    let brand = null;
    let productUrl = null;
    let productDetails = null;

    // Check logo detection first
    if (result.logoAnnotations?.length > 0) {
      brand = result.logoAnnotations[0].description;
    }

    // Check web detection for brand and product URL
    if (result.webDetection) {
      // Known fashion brands
      const fashionBrands = [
        'Zara', 'H&M', 'Mango', 'Nike', 'Adidas', 'Gucci', 'Prada', 
        'Louis Vuitton', 'Balenciaga', 'Dior', 'Chanel', 'Hermès',
        'Saint Laurent', 'Fendi', 'Valentino', 'Versace', 'Burberry'
      ];

      // Look for brand in web entities if not found in logo
      if (!brand && result.webDetection.webEntities) {
        const brandEntity = result.webDetection.webEntities.find(entity => 
          fashionBrands.some(brand => 
            entity.description.toLowerCase().includes(brand.toLowerCase())
          )
        );
        if (brandEntity) {
          brand = brandEntity.description;
        }
      }

      // Look for product URL and details in matching pages
      if (result.webDetection.pagesWithMatchingImages) {
        const shoppingDomains = [
          'zara.com', 'hm.com', 'mango.com', 'asos.com', 'net-a-porter.com',
          'farfetch.com', 'matchesfashion.com', 'mytheresa.com', 'shopbop.com',
          'nordstrom.com', 'ssense.com', 'revolve.com'
        ];

        const shoppingPage = result.webDetection.pagesWithMatchingImages.find(page => 
          shoppingDomains.some(domain => page.url.includes(domain))
        );
        if (shoppingPage) {
          productUrl = shoppingPage.url;
          productDetails = {
            url: shoppingPage.url,
            title: shoppingPage.pageTitle,
            partialMatchingImages: result.webDetection.partialMatchingImages?.length || 0,
            visuallySimilarImages: result.webDetection.visuallySimilarImages?.length || 0
          };
        }
      }
    }

    // Extract product search information if available
    if (result.productSearchResults?.results) {
      const productResults = result.productSearchResults.results;
      if (productResults.length > 0) {
        const bestMatch = productResults[0];
        productDetails = {
          ...productDetails,
          productCategory: bestMatch.product.productCategory,
          productLabels: bestMatch.product.productLabels,
          score: bestMatch.score
        };
      }
    }

    // Extract labels and detect type
    const labels = result.labelAnnotations?.map(label => ({
      description: label.description,
      score: label.score
    })) || [];

    // Filter high confidence labels
    const highConfidenceLabels = labels
      .filter(label => label.score > 0.7)
      .map(label => label.description);

    // Check for patterns and prints
    const patterns = [
      'leopard', 'animal print', 'tiger', 'zebra', 'snake', 'cheetah',
      'giraffe', 'cow print', 'crocodile', 'alligator', 'floral',
      'striped', 'checked', 'plaid', 'polka dot', 'geometric'
    ];

    const detectedPatterns = highConfidenceLabels
      .filter(label => patterns.some(pattern => 
        label.toLowerCase().includes(pattern.toLowerCase())
      ));

    // Extract dominant color
    const color = result.imagePropertiesAnnotation?.dominantColors?.colors?.[0];
    let dominantColor = null;

    if (detectedPatterns.length > 0) {
      dominantColor = `${detectedPatterns[0]} pattern`;
    } else if (color) {
      dominantColor = findClosestNamedColor(
        `rgb(${Math.round(color.color.red)}, ${Math.round(color.color.green)}, ${Math.round(color.color.blue)})`
      );
    }

    // Extract any text found on the garment
    const textAnnotations = result.textAnnotations?.[0]?.description || '';

    // Detect product type
    const type = detectProductType(highConfidenceLabels.join(' '));

    return {
      labels: highConfidenceLabels,
      color: dominantColor,
      type,
      brand,
      productUrl,
      productDetails,
      patterns: detectedPatterns,
      textFound: textAnnotations,
      confidence: {
        labels: labels[0]?.score || 0,
        color: color?.score || 0,
        overall: labels[0]?.score || 0
      }
    };
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