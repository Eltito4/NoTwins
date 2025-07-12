import axios from 'axios';
import { logger } from '../logger.js';
import { AVAILABLE_COLORS } from '../colors/constants.js';
import { getAllCategories } from '../categorization/index.js';

let deepseekClient = null;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

function initializeDeepSeek() {
  const API_KEY = process.env.DEEPSEEK_API_KEY;
  
  if (!API_KEY) {
    logger.error('Missing DEEPSEEK_API_KEY environment variable');
    return null;
  }

  try {
    deepseekClient = axios.create({
      baseURL: 'https://api.deepseek.com/v1',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    return deepseekClient;
  } catch (error) {
    logger.error('Failed to initialize DeepSeek:', error);
    return null;
  }
}

async function interpretRetailerConfig(url) {
  try {
    if (!deepseekClient) {
      deepseekClient = initializeDeepSeek();
      if (!deepseekClient) {
        throw new Error('Failed to initialize DeepSeek client');
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

    const response = await deepseekClient.post('/chat/completions', {
      model: "deepseek-chat",
      messages,
      temperature: 0.3,
      max_tokens: 500
    });

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from DeepSeek API');
    }

    const text = response.data.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const config = JSON.parse(jsonMatch[0]);
      logger.debug('Generated retailer config:', config);
      return config;
    }

    throw new Error('No valid JSON found in DeepSeek response');
  } catch (error) {
    logger.error('Retailer config generation error:', error);
    throw error;
  }
}

async function interpretScrapedProduct({ html, basicInfo, url }) {
  try {
    if (!deepseekClient) {
      deepseekClient = initializeDeepSeek();
      if (!deepseekClient) {
        throw new Error('Failed to initialize DeepSeek client');
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
        4. DRESS DETECTION: If text contains "vestido", "dress", "robe", "vestito" = ALWAYS category "dresses"
        5. SHOE DETECTION: If text contains "zapato", "shoe", "sandalia", "bota" = ALWAYS category "shoes"  
        6. BAG DETECTION: If text contains "bolso", "bag", "cartera", "mochila" = ALWAYS category "bags"
        7. Price must be properly formatted:
           - Convert prices like "45,95€" to 45.95 (NOT 4595)
           - Convert prices like "169,95€" to 169.95 (NOT 16995)
           - Convert prices like "1.234,56€" to 1234.56
           - Handle prices like "1,234.56$" to 1234.56
           - Remove currency symbols
           - Use period as decimal separator
           - CRITICAL: Never multiply by 100 or remove decimal places
           - Examples: "45,95€" → 45.95, "129,99€" → 129.99, "1.234,56€" → 1234.56
           - Look for prices in JSON-LD structured data
           - Check data-price attributes and price-related classes
        8. For Zara products, extract color information from Spanish color names:
           - "Negro" = "Black", "Blanco" = "White", "Azul" = "Blue", etc.
        9. Enhanced image detection:
           - Look for high-resolution product images
           - Check data-src, data-lazy, srcset attributes
           - Find images in product galleries and carousels
           - Return the best quality image URL available
        
        EXAMPLES:
        - "Vestido largo de punto" → category: "clothes", subcategory: "dresses"
        - "Zapatos de tacón" → category: "accessories", subcategory: "shoes"
        - "Bolso de mano" → category: "accessories", subcategory: "bags"
        
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
        ${html.substring(0, 1000)}...
        
        SPECIAL INSTRUCTIONS FOR ZARA:
        - Look for price in format like "45,95 EUR" or "45,95€"
        - Extract color from Spanish names (Negro=Black, Blanco=White, etc.)
        - Find high-quality product images from media-image or product-detail-images
        
        CRITICAL CATEGORIZATION:
        - "vestido" = dresses (NOT outerwear)
        - "zapato" = shoes
        - "bolso" = bags
        
        Return a JSON object with:
        - name: Product name (prefer basic info if available)
        - imageUrl: Main product image URL
        - color: Main color from available colors list
        - price: Price as number (properly formatted, e.g., 169.95 not 16995)
        - brand: Brand name if found
        - type: Object with category and subcategory from available categories
        - description: Product description`
      }
    ];

    const response = await deepseekClient.post('/chat/completions', {
      model: "deepseek-chat",
      messages,
      temperature: 0.3,
      max_tokens: 500
    });

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from DeepSeek API');
    }

    const text = response.data.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      
      // Ensure price is properly formatted
      if (result.price) {
        let priceValue = result.price;
        
        // Handle string prices that might have formatting issues
        if (typeof priceValue === 'string') {
          // Remove currency symbols and normalize
          priceValue = priceValue.replace(/[€$£¥]/g, '').trim();
          
          // Handle European format (comma as decimal separator)
          if (priceValue.includes(',')) {
            // If there's both comma and dot, assume dot is thousands separator
            if (priceValue.includes('.') && priceValue.includes(',')) {
              priceValue = priceValue.replace(/\./g, '').replace(',', '.');
            } else {
              // Just comma, assume it's decimal separator
              priceValue = priceValue.replace(',', '.');
            }
          }
          
          result.price = parseFloat(priceValue);
        }
        
        // Ensure the price is reasonable (not multiplied by 100)
        if (result.price > 10000) {
          result.price = result.price / 100;
        }
      }

      logger.debug('Parsed product details:', result);
      return result;
    }

    throw new Error('No valid JSON found in DeepSeek response');
  } catch (error) {
    logger.error('DeepSeek analysis error:', error);
    return basicInfo; // Fallback to basic info on error
  }
}

async function interpretVisionResults(visionResults) {
  try {
    if (!deepseekClient) {
      deepseekClient = initializeDeepSeek();
      if (!deepseekClient) {
        throw new Error('Failed to initialize DeepSeek client');
      }
    }

    const categories = getAllCategories();
    const colors = AVAILABLE_COLORS.map(c => c.name);

    const messages = [
      {
        role: "system",
        content: `You are a fashion image analyzer. Extract product details from Vision API results.
        
        CRITICAL INSTRUCTIONS:
        1. Categories must be one of: clothes, accessories
        2. For clothes, subcategories must be: tops, bottoms, dresses, outerwear
        3. For accessories, subcategories must be: shoes, bags, jewelry, other
        
        Available categories: ${categories.map(c => c.name).join(', ')}
        Available colors: ${colors.join(', ')}`
      },
      {
        role: "user",
        content: `Analyze these Vision API results:

        Labels: ${JSON.stringify(visionResults.labelAnnotations)}
        Objects: ${JSON.stringify(visionResults.localizedObjectAnnotations)}
        Colors: ${JSON.stringify(visionResults.imageProperties?.dominantColors)}
        Web Entities: ${JSON.stringify(visionResults.webDetection?.webEntities)}
        
        Return a JSON object with:
        - name: Product name based on detected objects and labels
        - color: Main color from available colors list
        - brand: Brand name if detected
        - type: Object with category and subcategory from available categories
        - description: Generated description of the item`
      }
    ];

    const response = await deepseekClient.post('/chat/completions', {
      model: "deepseek-chat",
      messages,
      temperature: 0.3,
      max_tokens: 500
    });

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from DeepSeek API');
    }

    const text = response.data.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      logger.debug('Parsed vision results:', result);
      return result;
    }

    throw new Error('No valid JSON found in DeepSeek response');
  } catch (error) {
    logger.error('DeepSeek vision analysis error:', error);
    return null;
  }
}

async function checkDeepSeekStatus() {
  try {
    const now = Date.now();
    if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL && deepseekClient) {
      return {
        initialized: true,
        hasApiKey: true,
        status: 'connected'
      };
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return {
        initialized: false,
        hasApiKey: false,
        error: 'Missing API key'
      };
    }

    if (!deepseekClient) {
      deepseekClient = initializeDeepSeek();
    }

    if (!deepseekClient) {
      return {
        initialized: false,
        hasApiKey: true,
        error: 'Failed to initialize client'
      };
    }

    // Simple test request with timeout
    try {
      const response = await Promise.race([
        deepseekClient.post('/chat/completions', {
          model: "deepseek-chat",
          messages: [
            { role: "user", content: "Test" }
          ],
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
      logger.warn('DeepSeek test request failed:', testError.message);
      
      // Still consider it working if we have the client and API key
      return {
        initialized: true,
        hasApiKey: true,
        status: 'limited',
        error: 'Test failed but client available'
      };
    }
  } catch (error) {
    logger.error('DeepSeek status check failed:', error);
    return {
      initialized: false,
      hasApiKey: !!process.env.DEEPSEEK_API_KEY,
      error: error.message
    };
  }
}

export {
  initializeDeepSeek,
  interpretVisionResults,
  interpretScrapedProduct,
  interpretRetailerConfig,
  checkDeepSeekStatus
};