import axios from 'axios';
import { logger } from '../logger.js';
import { AVAILABLE_COLORS } from '../colors/constants.js';
import { getAllCategories } from '../categorization/index.js';

let grokClient = null;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

function initializeGrok() {
  const API_KEY = process.env.GROK_API_KEY;
  
  if (!API_KEY) {
    logger.error('Missing GROK_API_KEY environment variable');
    return null;
  }

  try {
    grokClient = axios.create({
      baseURL: 'https://api.x.ai/v1',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      timeout: 60000
    });

    logger.info('Grok client initialized successfully');
    return grokClient;
  } catch (error) {
    logger.error('Failed to initialize Grok:', error);
    return null;
  }
}

async function interpretRetailerConfig(url) {
  try {
    if (!grokClient) {
      grokClient = initializeGrok();
      if (!grokClient) {
        throw new Error('Failed to initialize Grok client');
      }
    }

    const messages = [
      {
        role: "system",
        content: `You are a retail website expert. Create a configuration for scraping product details from this URL: ${url}`
      },
      {
        role: "user",
        content: `Return a JSON object with this exact structure:
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
        }`
      }
    ];

    const response = await grokClient.post('/chat/completions', {
      model: "grok-4-latest",
      messages,
      temperature: 0.3,
      stream: false,
      max_tokens: 1000
    });

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from Grok API');
    }

    const text = response.data.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const config = JSON.parse(jsonMatch[0]);
      logger.debug('Generated retailer config with Grok:', config);
      return config;
    }

    throw new Error('No valid JSON found in Grok response');
  } catch (error) {
    logger.error('Grok retailer config generation error:', error);
    throw error;
  }
}

async function interpretScrapedProduct({ html, basicInfo, url }) {
  try {
    if (!grokClient) {
      grokClient = initializeGrok();
      if (!grokClient) {
        throw new Error('Failed to initialize Grok client');
      }
    }

    const categories = getAllCategories();
    const colors = AVAILABLE_COLORS.map(c => c.name);

    const messages = [
      {
        role: "system",
        content: `You are a fashion product analyzer. Extract and enhance product details from HTML content.
        
        CRITICAL INSTRUCTIONS:
        1. Categories must be one of: clothes, accessories
        2. For clothes, subcategories must be: tops, bottoms, dresses, outerwear
        3. For accessories, subcategories must be: shoes, bags, jewelry, other
        4. DRESS DETECTION: If text contains "vestido", "dress", "robe", "vestito" = ALWAYS category "clothes", subcategory "dresses"
        5. SHOE DETECTION: If text contains "zapato", "shoe", "sandalia", "bota" = ALWAYS category "accessories", subcategory "shoes"  
        6. BAG DETECTION: If text contains "bolso", "bag", "cartera", "mochila" = ALWAYS category "accessories", subcategory "bags"
        7. Price must be properly formatted:
           - Convert prices like "45,95€" to 45.95 (NOT 4595)
           - Convert prices like "169,95€" to 169.95 (NOT 16995)
           - Convert prices like "1.234,56€" to 1234.56
           - Handle prices like "1,234.56$" to 1234.56
           - Remove currency symbols
           - Use period as decimal separator
           - CRITICAL: Never multiply by 100 or remove decimal places
           - Examples: "45,95€" → 45.95, "129,99€" → 129.99, "1.234,56€" → 1234.56
        8. Enhanced image detection:
           - Look for high-resolution product images
           - Check data-src, data-lazy, srcset attributes
           - Find images in product galleries and carousels
           - Return the best quality image URL available
           - For Massimo Dutti, look for images in .media-image, .product-detail-images
           - Check for images with "product" in the URL or alt text
           - Look for og:image meta tags as fallback
        
        Available categories: ${categories.map(c => c.name).join(', ')}
        Available colors: ${colors.join(', ')}`
      },
      {
        role: "user",
        content: `Analyze this product:

        URL: ${url}
        
        Basic Info:
        ${JSON.stringify(basicInfo, null, 2)}
        
        HTML Content:
        ${html.substring(0, 1500)}...
        
        SPECIAL INSTRUCTIONS FOR MASSIMO DUTTI:
        - Look for price in format like "169,95 EUR" or "169,95€"
        - Extract color from Spanish names (Negro=Black, Blanco=White, etc.)
        - Find high-quality product images from .media-image or .product-detail-images
        - Look for images in JSON-LD structured data
        
        CRITICAL CATEGORIZATION:
        - "vestido" = clothes/dresses (NOT outerwear)
        - "zapato" = accessories/shoes
        - "bolso" = accessories/bags
        - "camisa" = clothes/tops
        - "blusa" = clothes/tops
        
        Return a JSON object with:
        - name: Product name (prefer basic info if available)
        - imageUrl: Main product image URL (REQUIRED - find the best quality image)
        - color: Main color from available colors list
        - price: Price as number (properly formatted, e.g., 169.95 not 16995)
        - brand: Brand name if found
        - type: Object with category and subcategory from available categories
        - description: Product description`
      }
    ];

    const response = await grokClient.post('/chat/completions', {
      model: "grok-4-latest",
      messages,
      temperature: 0.3,
      max_tokens: 1000,
      stream: false
    });

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from Grok API');
    }

    const text = response.data.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      
      // Ensure price is properly formatted
      if (result.price) {
        let priceValue = result.price;
        
        if (typeof priceValue === 'string') {
          priceValue = priceValue.replace(/[€$£¥]/g, '').trim();
          
          if (priceValue.includes(',')) {
            if (priceValue.includes('.') && priceValue.includes(',')) {
              priceValue = priceValue.replace(/\./g, '').replace(',', '.');
            } else {
              priceValue = priceValue.replace(',', '.');
            }
          }
          
          result.price = parseFloat(priceValue);
        }
        
        if (result.price > 10000) {
          result.price = result.price / 100;
        }
      }

      // Enhanced image URL handling
      if (!result.imageUrl && basicInfo.imageUrl) {
        result.imageUrl = basicInfo.imageUrl;
      }
      
      if (!result.imageUrl) {
        result.imageUrl = `https://via.placeholder.com/400x400/CCCCCC/666666?text=${encodeURIComponent(result.name || 'Product')}`;
      }

      logger.debug('Grok parsed product details:', result);
      return result;
    }

    throw new Error('No valid JSON found in Grok response');
  } catch (error) {
    logger.error('Grok analysis error:', error);
    
    const fallback = {
      ...basicInfo,
      imageUrl: basicInfo.imageUrl || `https://via.placeholder.com/400x400/CCCCCC/666666?text=${encodeURIComponent(basicInfo.name || 'Product')}`,
      type: basicInfo.type || {
        category: 'clothes',
        subcategory: 'tops',
        name: 'Tops'
      }
    };
    
    return fallback;
  }
}

async function interpretVisionResults(visionResults) {
  try {
    if (!grokClient) {
      grokClient = initializeGrok();
      if (!grokClient) {
        throw new Error('Failed to initialize Grok client');
      }
    }

    const categories = getAllCategories();
    const colors = AVAILABLE_COLORS.map(c => c.name);

    const spanishBrands = [
      'Bimani', 'Bruna', 'Coosy', 'Lady Pipa', 'Redondo Brand', 'Miphai',
      'Mariquita Trasquilá', 'Vogana', 'Matilde Cano', 'Violeta Vergara',
      'Cayro Woman', 'La Croixé', 'Aware Barcelona', 'Cardié Moda',
      'Güendolina', 'Mattui', 'THE-ARE', 'Mannit', 'Mimoki', 'Panambi',
      'Carolina Herrera', 'CH', 'Zara', 'Mango', 'Massimo Dutti'
    ];

    const messages = [
      {
        role: "system",
        content: `You are a Spanish fashion expert and image analyzer. Extract product details from Vision API results with focus on Spanish fashion brands and accurate product categorization.
        
        CRITICAL INSTRUCTIONS:
        1. PRODUCT TYPE DETECTION:
           - SHOES: Any footwear including boots, heels, sneakers, sandals, flats
           - DRESSES: Any one-piece garment including vestidos, robes
           - TOPS: Shirts, blouses, sweaters, t-shirts
           - BOTTOMS: Pants, skirts, shorts, trousers
           - BAGS: Handbags, purses, backpacks, clutches
           - JEWELRY: Necklaces, earrings, bracelets, rings
           - OTHER: Belts, scarves, hats, accessories
        
        2. BRAND DETECTION - Look for these Spanish brands:
           ${spanishBrands.join(', ')}
           Also check for: CH, Carolina Herrera logos, text on packaging
        
        3. COLOR DETECTION:
           - Analyze the ACTUAL color of the item, not packaging
           - Green items should be "Green"
           - Purple/Violet items should be "Purple" 
           - Pink items should be "Pink"
           - Look at the main color of the product itself
        
        Available categories: ${categories.map(c => c.name).join(', ')}
        Available colors: ${colors.join(', ')}`
      },
      {
        role: "user",
        content: `Analyze these Vision API results for a Spanish fashion item:

        Labels: ${JSON.stringify(visionResults.labelAnnotations)}
        Objects: ${JSON.stringify(visionResults.localizedObjectAnnotations)}
        Colors: ${JSON.stringify(visionResults.imageProperties?.dominantColors)}
        Web Entities: ${JSON.stringify(visionResults.webDetection?.webEntities)}
        Logos: ${JSON.stringify(visionResults.logoAnnotations)}
        
        CRITICAL ANALYSIS POINTS:
        1. Look for shoe-like shapes, heel structures, boot designs
        2. Check for Spanish brand names in text/logos
        3. Analyze the actual product color (not packaging)
        4. Identify product category based on shape and function
        5. For clothing, determine if it's a dress, top, bottom, or outerwear
        6. For green items, identify the specific shade
        
        Return a JSON object with accurate detection:
        - name: Product name based on detected objects and labels
        - color: Main color from available colors list (analyze actual product)
        - brand: Brand name if detected (check Spanish brands list)
        - type: Object with category and subcategory
        - description: Generated description of the item`
      }
    ];

    const response = await grokClient.post('/chat/completions', {
      model: "grok-4-latest",
      messages,
      temperature: 0.2,
      max_tokens: 800,
      stream: false
    });

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from Grok API');
    }

    const text = response.data.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      
      if (result.type && !result.type.category) {
        const name = (result.name || '').toLowerCase();
        if (name.includes('shoe') || name.includes('boot') || name.includes('heel')) {
          result.type = {
            category: 'accessories',
            subcategory: 'shoes',
            name: 'Shoes'
          };
        } else if (name.includes('dress') || name.includes('vestido')) {
          result.type = {
            category: 'clothes',
            subcategory: 'dresses',
            name: 'Dresses'
          };
        } else if (name.includes('top') || name.includes('blouse') || name.includes('shirt')) {
          result.type = {
            category: 'clothes',
            subcategory: 'tops',
            name: 'Tops'
          };
        }
      }
      
      if (!result.brand) {
        const allText = JSON.stringify(visionResults).toLowerCase();
        for (const brand of spanishBrands) {
          if (allText.includes(brand.toLowerCase()) || allText.includes('ch') || allText.includes('carolina herrera')) {
            result.brand = brand === 'CH' ? 'Carolina Herrera' : brand;
            break;
          }
        }
      }
      
      logger.debug('Grok parsed vision results:', result);
      return result;
    }

    throw new Error('No valid JSON found in Grok response');
  } catch (error) {
    logger.error('Grok vision analysis error:', error);
    
    const fallbackResult = {
      name: 'Fashion Item',
      color: null,
      brand: null,
      type: {
        category: 'clothes',
        subcategory: 'dresses',
        name: 'Dresses'
      },
      description: 'Fashion item detected from image'
    };
    
    if (visionResults.labelAnnotations) {
      const labels = visionResults.labelAnnotations.map(l => l.description.toLowerCase());
      if (labels.some(l => l.includes('shoe') || l.includes('boot') || l.includes('footwear') || l.includes('heel'))) {
        fallbackResult.type = {
          category: 'accessories',
          subcategory: 'shoes',
          name: 'Shoes'
        };
        fallbackResult.name = 'Fashion Shoes';
      } else if (labels.some(l => l.includes('dress') || l.includes('gown') || l.includes('vestido'))) {
        fallbackResult.type = {
          category: 'clothes',
          subcategory: 'dresses',
          name: 'Dresses'
        };
        fallbackResult.name = 'Fashion Dress';
      } else if (labels.some(l => l.includes('clothing') || l.includes('garment'))) {
        if (visionResults.imageProperties?.dominantColors?.colors) {
          const dominantColor = visionResults.imageProperties.dominantColors.colors[0];
          if (dominantColor) {
            const { red, green, blue } = dominantColor.color;
            if (green > red && green > blue) {
              fallbackResult.color = 'Green';
            } else if (red > green && red > blue) {
              fallbackResult.color = 'Red';
            } else if (blue > red && blue > green) {
              fallbackResult.color = 'Blue';
            }
          }
        }
      }
    }
    
    return fallbackResult;
  }
}

async function checkGrokStatus() {
  try {
    const now = Date.now();
    if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL && grokClient) {
      return {
        initialized: true,
        hasApiKey: true,
        status: 'connected'
      };
    }

    if (!process.env.GROK_API_KEY) {
      return {
        initialized: false,
        hasApiKey: false,
        error: 'Missing API key'
      };
    }

    if (!grokClient) {
      grokClient = initializeGrok();
    }

    if (!grokClient) {
      return {
        initialized: false,
        hasApiKey: true,
        error: 'Failed to initialize client'
      };
    }

    try {
      const response = await Promise.race([
        grokClient.post('/chat/completions', {
          model: "grok-4-latest",
          messages: [
            { role: "user", content: "Test" }
          ],
          stream: false,
          temperature: 0,
          max_tokens: 1
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);
      
      lastHealthCheck = now;
      return {
        initialized: true,
        hasApiKey: true,
        status: 'connected'
      };
    } catch (testError) {
      logger.warn('Grok test request failed:', testError.message);
      
      return {
        initialized: true,
        hasApiKey: true,
        status: 'limited',
        error: 'Test failed but client available'
      };
    }
  } catch (error) {
    logger.error('Grok status check failed:', error);
    return {
      initialized: false,
      hasApiKey: !!process.env.GROK_API_KEY,
      error: error.message
    };
  }
}

export {
  initializeGrok,
  interpretVisionResults,
  interpretScrapedProduct,
  interpretRetailerConfig,
  checkGrokStatus
};