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

// Original function for interpreting Vision API results
export async function interpretProductDetails(visionResults) {
  try {
    if (!genAI) {
      genAI = initializeGemini();
      if (!genAI) {
        logger.error('Gemini initialization failed');
        return null;
      }
    }

    if (!visionResults) {
      logger.error('No vision results provided to interpret');
      return null;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      You are a fashion product data interpreter. Given these Vision API results, extract and structure the information following these STRICT rules:

      1. NAME:
         - Take the title from productDetails
         - Remove any brand names from the beginning
         - Remove unnecessary text like "- Brand Name" or "| Brand Name"
         - Keep only the essential product description

      2. BRAND:
         - Extract brand name that appears at the start of titles
         - Look for known fashion brand names
         - If multiple brand mentions, use the most consistent one

      3. DESCRIPTION:
         - Use the product URL from the results
         - Select the most official URL (prefer .com domains)
         - Prefer URLs from the brand's official website
         - Avoid marketplace URLs (like Amazon, eBay)

      4. COLOR:
         - Choose from these exact color names: ${AVAILABLE_COLORS.map(c => c.name).join(', ')}
         - For patterns, use format: "[Pattern] [Base Color]" (e.g., "Leopard Print Brown")
         - Consider both visual color and any color mentioned in text
         - If multiple colors, choose the most dominant one

      5. TYPE:
         - Choose from these categories and types:
         ${CATEGORIES.map(cat => `
           ${cat.name}:
           ${cat.subcategories.map(sub => `- ${sub.name}`).join('\n           ')}
         `).join('\n')}
         - Be as specific as possible
         - Consider both the visual appearance and any text descriptions

      Input Vision API Results:
      ${JSON.stringify(visionResults, null, 2)}

      Return ONLY a JSON object with these exact fields:
      {
        "name": "cleaned product name without brand",
        "brand": "extracted brand name",
        "description": "selected product URL",
        "color": "exact color name from provided list",
        "type": {
          "category": "category ID",
          "subcategory": "subcategory ID",
          "name": "full type name"
        }
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    try {
      const text = response.text();
      // Extract JSON from potential markdown code block
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || text.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      throw new Error('No valid JSON found in response');
    } catch (parseError) {
      logger.error('Failed to parse Gemini response:', {
        error: parseError.message,
        response: response.text()
      });
      return null;
    }
  } catch (error) {
    logger.error('Gemini interpretation error:', error);
    return null;
  }
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

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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

      Include these common selectors for each field:
      - Meta tags (og:title, og:image, etc.)
      - Standard product page elements
      - Common class names and IDs
      - Schema.org markup selectors
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    try {
      const text = response.text();
      // Extract JSON from potential markdown code block
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || text.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        const config = JSON.parse(jsonMatch[1]);
        logger.debug('Generated retailer config:', config);
        return config;
      }
      throw new Error('No valid JSON found in response');
    } catch (parseError) {
      logger.error('Failed to parse Gemini response:', {
        error: parseError.message,
        response: response.text()
      });
      throw new Error('Failed to generate retailer configuration');
    }
  } catch (error) {
    logger.error('Gemini interpretation error:', error);
    throw error;
  }
}

export function checkGeminiStatus() {
  return {
    initialized: !!genAI,
    hasApiKey: !!process.env.GOOGLE_AI_API_KEY
  };
}