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

    // Create a more detailed prompt with available colors and categories
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
      const interpretation = JSON.parse(response.text());
      logger.debug('Gemini interpretation successful:', interpretation);

      // Validate color against available colors
      if (interpretation.color) {
        const validColor = AVAILABLE_COLORS.find(c => 
          c.name.toLowerCase() === interpretation.color.toLowerCase()
        );
        if (!validColor) {
          interpretation.color = findClosestColor(interpretation.color);
        }
      }

      // Validate and structure type information
      if (interpretation.type) {
        const category = CATEGORIES.find(c => c.id === interpretation.type.category);
        const subcategory = category?.subcategories.find(s => s.id === interpretation.type.subcategory);
        
        if (!category || !subcategory) {
          // Default to first matching category/subcategory based on name
          const matchedCategory = CATEGORIES.find(c => 
            c.subcategories.some(s => 
              interpretation.type.name.toLowerCase().includes(s.name.toLowerCase())
            )
          );
          
          if (matchedCategory) {
            const matchedSubcategory = matchedCategory.subcategories.find(s =>
              interpretation.type.name.toLowerCase().includes(s.name.toLowerCase())
            );
            
            interpretation.type = {
              category: matchedCategory.id,
              subcategory: matchedSubcategory?.id || 'other',
              name: matchedSubcategory?.name || interpretation.type.name
            };
          }
        }
      }

      return interpretation;
    } catch (parseError) {
      logger.error('Failed to parse Gemini response:', {
        error: parseError.message,
        response: response.text()
      });
      return null;
    }
  } catch (error) {
    logger.error('Gemini interpretation error:', {
      error: error.message,
      stack: error.stack
    });
    return null;
  }
}

function findClosestColor(color) {
  if (!color) return null;
  
  const normalizedInput = color.toLowerCase();
  
  // Check for patterns first
  const patterns = ['leopard', 'zebra', 'snake', 'animal', 'floral'];
  for (const pattern of patterns) {
    if (normalizedInput.includes(pattern)) {
      return `${pattern.charAt(0).toUpperCase() + pattern.slice(1)} Print`;
    }
  }
  
  // Find exact match
  const exactMatch = AVAILABLE_COLORS.find(c => 
    c.name.toLowerCase() === normalizedInput
  );
  if (exactMatch) return exactMatch.name;
  
  // Find partial match
  const partialMatch = AVAILABLE_COLORS.find(c => 
    normalizedInput.includes(c.name.toLowerCase())
  );
  if (partialMatch) return partialMatch.name;
  
  // Default to most similar color
  return 'Black'; // Default fallback
}

export function checkGeminiStatus() {
  return {
    initialized: !!genAI,
    hasApiKey: !!process.env.GOOGLE_AI_API_KEY
  };
}