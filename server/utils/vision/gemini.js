import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../logger.js';
import { AVAILABLE_COLORS } from '../colors/constants.js';
import { CATEGORIES } from '../categorization/categories.js';

let genAI = null;

function initializeGemini() {
  const API_KEY = process.env.GOOGLE_AI_API_KEY;
  if (!API_KEY) {
    logger.error('Missing GOOGLE_AI_API_KEY environment variable');
    return null;
  }

  try {
    return new GoogleGenerativeAI(API_KEY);
  } catch (error) {
    logger.error('Failed to initialize Gemini:', error);
    return null;
  }
}

// Function for interpreting Vision API results without relying on Gemini
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
    
    // Extract product type from labels and objects
    const typeLabels = labelAnnotations.map(label => label.description.toLowerCase());
    const objectLabels = objectAnnotations.map(obj => obj.name.toLowerCase());
    const allLabels = [...typeLabels, ...objectLabels].join(' ');
    
    // Extract brand information
    const brandEntities = webEntities.filter(entity => 
      entity.description && 
      !entity.description.toLowerCase().includes('shoe') &&
      !entity.description.toLowerCase().includes('boot') &&
      !entity.description.toLowerCase().includes('sandal') &&
      !entity.description.toLowerCase().includes('fashion') &&
      entity.score > 0.3
    );
    
    // Extract color information from labels
    const colorLabels = labelAnnotations.filter(label => 
      AVAILABLE_COLORS.some(color => 
        label.description.toLowerCase().includes(color.name.toLowerCase())
      )
    );

    // Try to use Gemini if available
    let geminiResult = null;
    if (genAI) {
      try {
        geminiResult = await tryGeminiAnalysis(visionResults, labelAnnotations, objectAnnotations, webEntities);
      } catch (error) {
        logger.error('Gemini analysis failed, using direct extraction:', error);
      }
    }

    // If Gemini succeeded, use its results
    if (geminiResult) {
      return geminiResult;
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
      if (colorLabels.length > 0) {
        const colorName = extractColorName(colorLabels[0].description);
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
        !brandEntities.some(brand => 
          label.description.toLowerCase().includes(brand.description.toLowerCase())
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
    if (brandEntities.length > 0) {
      brand = brandEntities[0].description;
    }
    
    // Extract color
    let color = null;
    if (colorLabels.length > 0) {
      color = extractColorName(colorLabels[0].description);
    }
    
    // Determine product type
    const type = determineProductType(allLabels, objectAnnotations);
    
    // Get product URL
    const description = visionResults.productUrls && visionResults.productUrls.length > 0 
      ? visionResults.productUrls[0] 
      : null;
    
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

// Helper function to try Gemini analysis
async function tryGeminiAnalysis(visionResults, labelAnnotations, objectAnnotations, webEntities) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });
    
    // Prepare a focused prompt for Gemini
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
    // Extract JSON from potential markdown code block
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || text.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      const parsedResult = JSON.parse(jsonMatch[1]);
      
      // Fallback values from direct Vision API results if Gemini fails to provide them
      if (!parsedResult.brand && webEntities.length > 0) {
        parsedResult.brand = webEntities[0].description;
      }
      
      // Add product URL as description
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

// Helper function to extract color name
function extractColorName(text) {
  if (!text) return null;
  
  const normalizedText = text.toLowerCase();
  
  // Direct match
  for (const color of AVAILABLE_COLORS) {
    if (normalizedText === color.name.toLowerCase()) {
      return color.name;
    }
  }
  
  // Partial match
  for (const color of AVAILABLE_COLORS) {
    if (normalizedText.includes(color.name.toLowerCase())) {
      return color.name;
    }
  }
  
  return null;
}

// Helper function to determine product type
function determineProductType(allLabels, objectAnnotations) {
  // Try to detect from object annotations first
  if (objectAnnotations.length > 0) {
    const mainObject = objectAnnotations[0].name.toLowerCase();
    
    // Check for shoes/boots
    if (mainObject.includes('shoe') || mainObject.includes('boot') || mainObject.includes('sandal')) {
      return {
        category: 'accessories',
        subcategory: 'shoes',
        name: 'Shoes'
      };
    }
    
    // Check for bags
    if (mainObject.includes('bag') || mainObject.includes('purse') || mainObject.includes('handbag')) {
      return {
        category: 'accessories',
        subcategory: 'bags',
        name: 'Bags'
      };
    }
    
    // Check for dresses
    if (mainObject.includes('dress') || mainObject.includes('gown')) {
      return {
        category: 'clothes',
        subcategory: 'dresses',
        name: 'Dresses'
      };
    }
    
    // Check for tops
    if (mainObject.includes('shirt') || mainObject.includes('blouse') || mainObject.includes('top')) {
      return {
        category: 'clothes',
        subcategory: 'tops',
        name: 'Tops'
      };
    }
    
    // Check for bottoms
    if (mainObject.includes('pants') || mainObject.includes('jeans') || mainObject.includes('skirt')) {
      return {
        category: 'clothes',
        subcategory: 'bottoms',
        name: 'Bottoms'
      };
    }
  }
  
  // Use the categorization detector as fallback
  return {
    category: 'clothes',
    subcategory: 'other',
    name: 'Other Clothes'
  };
}

// New function for generating retailer configs
export async function interpretRetailerConfig(url) {
  try {
    if (!genAI) {
      genAI = initializeGemini();
      if (!genAI) {
        throw new Error('Gemini initialization failed');
      }
    }

    // Create a default configuration based on common selectors
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

    try {
      // Try to use Gemini for a more tailored config
      const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });

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
      // Extract JSON from potential markdown code block
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || text.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        const config = JSON.parse(jsonMatch[1]);
        logger.debug('Generated retailer config:', config);
        return config;
      }
    } catch (error) {
      logger.error('Gemini retailer config generation failed:', error);
    }
    
    // Return default config if Gemini fails
    logger.info('Using default retailer config for:', url);
    return defaultConfig;
  } catch (error) {
    logger.error('Retailer config error:', error);
    throw error;
  }
}

// Helper function to extract domain name
function extractDomainName(url) {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split('.');
    
    // Handle www prefix
    if (parts[0] === 'www') {
      parts.shift();
    }
    
    // Get the main domain name (usually the second-to-last part)
    const domainName = parts[parts.length - 2];
    
    // Capitalize first letter
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