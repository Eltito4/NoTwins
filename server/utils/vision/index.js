import vision from '@google-cloud/vision';
import { logger } from '../logger.js';
import { detectProductType } from '../categorization/detector.js';
import { findClosestNamedColor } from '../colors/utils.js';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

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

async function interpretWithGemini(visionResults) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      Analyze these Vision API results and extract structured product information:
      ${JSON.stringify(visionResults, null, 2)}

      Please provide:
      1. A natural product name
      2. Brand name (if detected)
      3. Product type/category
      4. Color(s)
      5. Any patterns or distinctive features
      6. Price (if detected)
      7. Confidence score for the analysis

      Format as JSON with these fields: name, brand, type, color, pattern, price, confidence
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const interpretation = JSON.parse(response.text());

    logger.debug('Gemini interpretation:', interpretation);

    return interpretation;
  } catch (error) {
    logger.error('Gemini interpretation error:', error);
    return null;
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

    // Download image
    logger.debug('Downloading image...');
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 5000
    });
    logger.debug('Image downloaded successfully');

    // Analyze image with multiple features
    logger.debug('Sending image to Vision API...');
    const [result] = await visionClient.annotateImage({
      image: { content: Buffer.from(response.data) },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 20 },
        { type: 'LOGO_DETECTION', maxResults: 5 },
        { type: 'WEB_DETECTION', maxResults: 10 },
        { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
        { type: 'IMAGE_PROPERTIES', maxResults: 5 },
        { type: 'PRODUCT_SEARCH', maxResults: 5 },
        { type: 'TEXT_DETECTION' },
        { type: 'SAFE_SEARCH_DETECTION' }
      ]
    });

    // Log raw Vision API response without image data
    logger.debug('Raw Vision API response:', {
      hasImageProperties: !!result.imagePropertiesAnnotation,
      hasLabelAnnotations: !!result.labelAnnotations,
      hasLogoAnnotations: !!result.logoAnnotations,
      hasObjectAnnotations: !!result.localizedObjectAnnotations,
      hasProductSearch: !!result.productSearchResults,
      hasWebSearch: !!result.webDetection,
      hasTextDetection: !!result.textAnnotations
    });

    // Log detailed analysis results
    if (result.webDetection?.pagesWithMatchingImages) {
      logger.debug('Product details found:', {
        productDetails: result.webDetection.pagesWithMatchingImages.map(page => ({
          title: page.pageTitle,
          url: page.url
        }))
      });
    }

    if (result.labelAnnotations) {
      logger.debug('Detected labels:', {
        highConfidence: result.labelAnnotations
          .filter(label => label.score > 0.8)
          .map(label => label.description)
      });
    }

    if (result.localizedObjectAnnotations) {
      logger.debug('Detected objects:', {
        objects: result.localizedObjectAnnotations.map(obj => ({
          name: obj.name,
          confidence: obj.score
        }))
      });
    }

    if (result.imagePropertiesAnnotation?.dominantColors) {
      logger.debug('Color analysis:', {
        dominantColor: result.imagePropertiesAnnotation.dominantColors.colors[0]
      });
    }

    // Construct product name
    let productName = '';
    let brandName = '';
    let itemType = '';
    let pattern = '';

    // Extract brand from web detection or logo
    if (result.webDetection?.pagesWithMatchingImages?.[0]?.pageTitle) {
      const pageTitle = result.webDetection.pagesWithMatchingImages[0].pageTitle;
      // Extract brand name from title
      const brandMatch = pageTitle.match(/^(.*?)\s+(?:[-|]|leopard-print|animal-print)/i);
      if (brandMatch) {
        brandName = brandMatch[1].trim();
      }
    }

    // Detect item type from object annotations
    if (result.localizedObjectAnnotations) {
      const footwearTypes = ['Shoe', 'Boot', 'Sandal', 'Sneaker', 'Heels', 'Footwear'];
      const clothingTypes = ['Dress', 'Shirt', 'Pants', 'Skirt', 'Jacket'];
      
      for (const obj of result.localizedObjectAnnotations) {
        if (footwearTypes.includes(obj.name)) {
          itemType = obj.name.toLowerCase();
          break;
        } else if (clothingTypes.includes(obj.name)) {
          itemType = obj.name.toLowerCase();
          break;
        }
      }
    }

    // Detect patterns
    const patterns = [
      'leopard print', 'animal print', 'tiger print', 'zebra print', 
      'snake print', 'floral print', 'polka dot', 'striped', 'plaid'
    ];

    if (result.labelAnnotations) {
      for (const label of result.labelAnnotations) {
        for (const p of patterns) {
          if (label.description.toLowerCase().includes(p)) {
            pattern = p;
            break;
          }
        }
        if (pattern) break;
      }
    }

    // Construct full name
    productName = [
      brandName,
      pattern,
      itemType
    ].filter(Boolean).join(' ');

    // If we couldn't construct a good name, use the page title
    if (!productName && result.webDetection?.pagesWithMatchingImages?.[0]?.pageTitle) {
      productName = result.webDetection.pagesWithMatchingImages[0].pageTitle
        .split('|')[0]
        .trim();
    }

    // Extract product URL
    let productUrl = null;
    if (result.webDetection?.pagesWithMatchingImages) {
      const shoppingPage = result.webDetection.pagesWithMatchingImages[0];
      if (shoppingPage) {
        productUrl = shoppingPage.url;
      }
    }

    // Extract color
    const color = result.imagePropertiesAnnotation?.dominantColors?.colors?.[0];
    let dominantColor = pattern ? pattern : null;
    
    if (!dominantColor && color) {
      dominantColor = findClosestNamedColor(
        `rgb(${Math.round(color.color.red)}, ${Math.round(color.color.green)}, ${Math.round(color.color.blue)})`
      );
    }

    // Detect type for categorization
    const type = detectProductType([itemType, ...result.labelAnnotations.map(l => l.description)].join(' '));

    // Extract price if available in text
    let price = null;
    if (result.textAnnotations) {
      const priceMatch = result.textAnnotations[0]?.description.match(/[\$€£](\d+(?:\.\d{2})?)/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1]);
      }
    }

    // Get Gemini's interpretation
    const geminiResults = await interpretWithGemini({
      webDetection: result.webDetection,
      labelAnnotations: result.labelAnnotations,
      localizedObjectAnnotations: result.localizedObjectAnnotations,
      imageProperties: result.imagePropertiesAnnotation
    });

    // Combine Vision API and Gemini results
    const analysis = {
      name: geminiResults?.name || productName,
      brand: geminiResults?.brand || brandName,
      color: geminiResults?.color || dominantColor,
      type: geminiResults?.type ? {
        category: 'clothes',
        subcategory: geminiResults.type.toLowerCase(),
        name: geminiResults.type
      } : type,
      price: geminiResults?.price || price,
      productUrl,
      confidence: {
        labels: result.labelAnnotations?.[0]?.score || 0,
        color: color?.score || 0,
        overall: geminiResults?.confidence || result.labelAnnotations?.[0]?.score || 0
      }
    };

    logger.info('Analysis completed with Gemini enhancement:', {
      hasGeminiResults: !!geminiResults,
      hasBrand: !!analysis.brand,
      hasColor: !!analysis.color,
      hasType: !!analysis.type,
      confidence: analysis.confidence.overall
    });

    return analysis;
  } catch (error) {
    logger.error('Vision analysis error:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
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