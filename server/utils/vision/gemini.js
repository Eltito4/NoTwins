import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../logger.js';

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

    const prompt = `
      You are a product data interpreter. Given these Vision API results, extract and structure the information following these STRICT rules:

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
         - If multiple URLs exist for the same domain, choose the one with fewer path segments

      4. COLOR and TYPE:
         - Extract from the product name and detected labels
         - For color, also use the dominantColor data if available

      Input Vision API Results:
      ${JSON.stringify(visionResults, null, 2)}

      Return ONLY a JSON object with these exact fields:
      {
        "name": "cleaned product name without brand",
        "brand": "extracted brand name",
        "description": "selected product URL",
        "color": "color or pattern",
        "type": "specific product type"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    try {
      const interpretation = JSON.parse(response.text());
      logger.debug('Gemini interpretation successful:', interpretation);
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

export function checkGeminiStatus() {
  return {
    initialized: !!genAI,
    hasApiKey: !!process.env.GOOGLE_AI_API_KEY
  };
}