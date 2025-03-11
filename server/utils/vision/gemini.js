import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../logger.js';
import { AVAILABLE_COLORS } from '../colors/index.js';
import { CATEGORIES } from '../categorization/categories.js';
import { detectProductType } from '../categorization/detector.js';

let genAI = null;

const MODEL_NAME = 'gemini-pro';

function initializeGemini() {
  const API_KEY = process.env.GOOGLE_AI_API_KEY;
  if (!API_KEY) {
    logger.error('Missing GOOGLE_AI_API_KEY environment variable');
    return null;
  }

  try {
    logger.info('Initializing Gemini API with key:', { hasKey: !!API_KEY });
    genAI = new GoogleGenerativeAI(API_KEY);
    logger.info('Gemini API initialized successfully');
    return genAI;
  } catch (error) {
    logger.error('Failed to initialize Gemini:', error);
    return null;
  }
}

export async function interpretProductDetails(visionResults) {
  try {
    if (!visionResults) {
      logger.error('No vision results provided to interpret');
      return null;
    }

    // Extract basic information from Vision API results directly
    const labelAnnotations = visionResults.labelAnnotations || [];
    const webEntities = visionResults.webDetection?.webEntities || [];
    const objectAnnotations = visionResults.localizedObjectAnnotations || [];
    const productUrls = visionResults.productUrls || [];
    
    // Extract product type from labels and objects
    const typeLabels = labelAnnotations.map(label => label.description.toLowerCase());
    const objectLabels = objectAnnotations.map(obj => obj.name.toLowerCase());
    const allLabels = [...typeLabels, ...objectLabels].join(' ');
    
    // Try to use Gemini if available
    if (!genAI) {
      genAI = initializeGemini();
    }
    
    let geminiResult = null;
    if (genAI) {
      try {
        geminiResult = await tryGeminiAnalysis(visionResults);
        if (geminiResult) {
          logger.info('Successfully used Gemini for product analysis');
          
          // Add product URL as description if available
          if (productUrls.length > 0 && !geminiResult.description) {
            geminiResult.description = productUrls[0];
          }
          
          return geminiResult;
        }
      } catch (error) {
        logger.error('Gemini analysis failed, using direct extraction:', error);
      }
    }

    // Direct extraction as fallback
    logger.info('Using direct extraction for product details');
    
    // Determine product name
    let productName = "";
    if (objectAnnotations.length > 0) {
      // Use the highest confidence object
      const mainObject = objectAnnotations.sort((a, b) => b.score - a.score)[0];
      productName = mainObject.name;
      
      // Add color if available
      const colorLabel = labelAnnotations.find(label => 
        AVAILABLE_COLORS.some(color => 
          label.description.toLowerCase().includes(color.name.toLowerCase())
        )
      );
      
      if (colorLabel) {
        const colorName = extractColorName(colorLabel.description);
        if (colorName && !productName.toLowerCase().includes(colorName.toLowerCase())) {
          productName = `${colorName} ${productName}`;
        }
      }
    } else if (labelAnnotations.length > 0) {
      // Use the highest confidence label that's not a color or brand
      const relevantLabels = labelAnnotations.filter(label => 
        !AVAILABLE_COLORS.some(color => 
          label.description.toLowerCase().includes(color.name.toLowerCase())
        ) &&
        !webEntities.some(entity => 
          label.description.toLowerCase().includes(entity.description.toLowerCase())
        )
      );
      
      if (relevantLabels.length > 0) {
        productName = relevantLabels[0].description;
      } else {
        productName = labelAnnotations[0].description;
      }
    } else {
      productName = "Unknown Item";
    }
    
    // Extract brand
    let brand = null;
    const brandEntities = webEntities.filter(entity => 
      entity.description && 
      !entity.description.toLowerCase().includes('shoe') &&
      !entity.description.toLowerCase().includes('boot') &&
      !entity.description.toLowerCase().includes('sandal') &&
      !entity.description.toLowerCase().includes('fashion') &&
      entity.score > 0.3
    );
    
    if (brandEntities.length > 0) {
      brand = brandEntities[0].description;
    }
    
    // Extract color
    let color = null;
    const colorLabel = labelAnnotations.find(label => 
      AVAILABLE_COLORS.some(color => 
        label.description.toLowerCase().includes(color.name.toLowerCase())
      )
    );
    
    if (colorLabel) {
      color = extractColorName(colorLabel.description);
    }
    
    // Determine product type
    const type = detectProductType(allLabels);
    
    // Get product URL
    const description = productUrls.length > 0 ? productUrls[0] : null;
    
    return {
      name: productName,
      brand: brand,
      color: color,
      type: type,
      description: description
    };
  } catch (error) {
    logger.error('Product interpretation error:', error);
    return {
      name: "Unknown Item",
      type: {
        category: "clothes",
        subcategory: "other",
        name: "Other Clothes"
      }
    };
  }
}

async function tryGeminiAnalysis(visionResults) {
  try {
    if (!genAI) {
      genAI = initializeGemini();
      if (!genAI) {
        throw new Error('Gemini not initialized');
      }
    }
    
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    const labelAnnotations = visionResults.labelAnnotations || [];
    const webEntities = visionResults.webDetection?.webEntities || [];
    const objectAnnotations = visionResults.localizedObjectAnnotations || [];
    
    const prompt = `
      You are a fashion product analyzer. Based on the following Vision API results, extract ONLY the following information:

      1. NAME: A concise product name (e.g., "Burgundy Tweed Ankle Boots")
      2. BRAND: The brand name (e.g., "Carolina Herrera")
      3. COLOR: The main color (choose from: ${AVAILABLE_COLORS.map(c => c.name).join(', ')})
      4. TYPE: The product type category and subcategory

      Vision API detected the following:
      - Labels: ${labelAnnotations.map(l => l.description).join(', ')}
      - Objects: ${objectAnnotations.map(o => o.name).join(', ')}
      - Web Entities: ${webEntities.map(e => e.description).join(', ')}
      - Product URLs: ${visionResults.productUrls?.join(', ')}

      Return ONLY a JSON object with these exact fields:
      {
        "name": "product name",
        "brand": "brand name",
        "color": "color name",
        "type": {
          "category": "category ID",
          "subcategory": "subcategory ID",
          "name": "full type name"
        }
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    const text = response.text();
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || text.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      const parsedResult = JSON.parse(jsonMatch[1]);
      
      if (!parsedResult.brand && webEntities.length > 0) {
        parsedResult.brand = webEntities[0].description;
      }
      
      if (visionResults.productUrls && visionResults.productUrls.length > 0) {
        parsedResult.description = visionResults.productUrls[0];
      }
      
      return parsedResult;
    }
    throw new Error('No valid JSON found in response');
  } catch (error) {
    logger.error('Gemini analysis error:', error);
    throw error;
  }
}

function extractColorName(text) {
  if (!text) return null;
  
  const normalizedText = text.toLowerCase();
  
  for (const color of AVAILABLE_COLORS) {
    if (normalizedText === color.name.toLowerCase()) {
      return color.name;
    }
  }
  
  for (const color of AVAILABLE_COLORS) {
    if (normalizedText.includes(color.name.toLowerCase())) {
      return color.name;
    }
  }
  
  return null;
}

export async function interpretRetailerConfig(url) {
  try {
    if (!genAI) {
      genAI = initializeGemini();
    }

    const defaultConfig = {
      name: extractDomainName(url),
      defaultCurrency: "EUR",
      selectors: {
        name: [
          'h1',
          '.product-name',
          '.product-title',
          'meta[property="og:title"]',
          '[data-testid="product-name"]',
          '[itemprop="name"]'
        ],
        price: [
          '.price',
          '.product-price',
          'meta[property="product:price:amount"]',
          '[data-testid="product-price"]',
          '[itemprop="price"]'
        ],
        color: [
          '.color-selector .selected',
          '.selected-color',
          '[data-testid="selected-color"]',
          '[itemprop="color"]'
        ],
        image: [
          'meta[property="og:image"]',
          '.product-image img',
          '.gallery-image img',
          '[data-testid="product-image"]',
          '[itemprop="image"]'
        ],
        brand: [
          'meta[property="product:brand"]',
          '.product-brand',
          '[itemprop="brand"]'
        ]
      },
      brand: {
        defaultValue: extractDomainName(url)
      }
    };

    if (!genAI) {
      logger.info('Gemini not available, using default retailer config');
      return defaultConfig;
    }

    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });

      const prompt = `
        You are a retail website expert. Given this URL: ${url}
        
        Create a configuration for scraping product details from this retailer's website.
        Follow these rules:
        
        1. Analyze the domain to determine the retailer name
        2. Consider common e-commerce website structures
        3. Include multiple selector options for each field
        4. Focus on reliable selectors that are less likely to change
        5. Include meta tags as fallback options
        
        Return ONLY a JSON object with this exact structure (no markdown, no code block):
        {
          "name": "Retailer Name",
          "defaultCurrency": "EUR",
          "selectors": {
            "name": ["array of CSS selectors for product name"],
            "price": ["array of CSS selectors for price"],
            "color": ["array of CSS selectors for color"],
            "image": ["array of CSS selectors for main product image"],
            "brand": ["array of CSS selectors for brand name"]
          },
          "brand": {
            "defaultValue": "Default Brand Name"
          }
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      const text = response.text();
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || text.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        const config = JSON.parse(jsonMatch[1]);
        logger.debug('Generated retailer config:', config);
        return config;
      }
    } catch (error) {
      logger.error('Gemini retailer config generation failed:', error);
    }
    
    logger.info('Using default retailer config for:', url);
    return defaultConfig;
  } catch (error) {
    logger.error('Retailer config error:', error);
    throw error;
  }
}

function extractDomainName(url) {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split('.');
    
    if (parts[0] === 'www') {
      parts.shift();
    }
    
    const domainName = parts[parts.length - 2];
    return domainName.charAt(0).toUpperCase() + domainName.slice(1);
  } catch (error) {
    return "Unknown Retailer";
  }
}

export function checkGeminiStatus() {
  return {
    initialized: !!genAI,
    hasApiKey: !!process.env.GOOGLE_AI_API_KEY
  };
}