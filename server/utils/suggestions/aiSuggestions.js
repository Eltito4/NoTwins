import axios from 'axios';
import { logger } from '../logger.js';
import { AVAILABLE_COLORS } from '../colors/constants.js';
import { getAllCategories } from '../categorization/index.js';
import { findRealProducts } from './productSearch.js';

let deepseekClient = null;

function initializeDeepSeek() {
  const API_KEY = process.env.DEEPSEEK_API_KEY;
  
  if (!API_KEY) {
    logger.error('Missing DEEPSEEK_API_KEY environment variable for suggestions');
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
    logger.error('Failed to initialize DeepSeek for suggestions:', error);
    return null;
  }
}

export async function generateDuplicateSuggestions(duplicateItem, userOtherItems = [], eventContext = {}) {
  try {
    if (!deepseekClient) {
      deepseekClient = initializeDeepSeek();
      if (!deepseekClient) {
        logger.warn('DeepSeek not available for suggestions');
        return [];
      }
    }

    const categories = getAllCategories();
    const colors = AVAILABLE_COLORS.map(c => c.name);

    const messages = [
      {
        role: "system",
        content: `You are a fashion stylist AI that helps users avoid outfit conflicts by suggesting alternative items.

        CRITICAL INSTRUCTIONS:
        1. Analyze the duplicate item and suggest 3-5 alternatives
        2. Consider the user's other items to ensure coordination
        3. Suggest items that complement their existing wardrobe
        4. Provide specific, actionable suggestions with reasoning
        5. Include color alternatives and style variations
        6. Consider the event context (formal, casual, etc.)
        
        SUGGESTION TYPES:
        1. COLOR ALTERNATIVES - Same item, different colors
        2. STYLE VARIATIONS - Similar items, different styles  
        3. COMPLEMENTARY ITEMS - Items that work well together
        4. WARDROBE COORDINATION - Based on user's other items
        
        Available categories: ${categories.map(c => c.name).join(', ')}
        Available colors: ${colors.join(', ')}
        
        RESPONSE FORMAT:
        Return a JSON array of suggestions with this structure:
        [
          {
            "type": "color_alternative|style_variation|complementary|coordination",
            "title": "Suggestion title",
            "description": "Why this works",
            "item": {
              "name": "Suggested item name",
              "category": "category",
              "subcategory": "subcategory", 
              "color": "suggested color",
              "style": "style description"
            },
            "reasoning": "Detailed explanation",
            "searchTerms": ["term1", "term2", "term3"],
            "priority": 1-5
          }
        ]`
      },
      {
        role: "user",
        content: `DUPLICATE CONFLICT DETECTED:

        DUPLICATE ITEM:
        - Name: "${duplicateItem.name}"
        - Color: "${duplicateItem.color || 'Unknown'}"
        - Brand: "${duplicateItem.brand || 'Unknown'}"
        - Type: "${duplicateItem.type?.name || 'Unknown'}"
        - Category: "${duplicateItem.type?.category || 'Unknown'}"

        USER'S OTHER ITEMS:
        ${userOtherItems.length > 0 ? userOtherItems.map((item, index) => 
          `${index + 1}. "${item.name}" - ${item.color || 'No color'} - ${item.type?.name || 'Unknown type'}`
        ).join('\n') : 'No other items in wardrobe'}

        EVENT CONTEXT:
        - Event: "${eventContext.name || 'Unknown event'}"
        - Date: "${eventContext.date || 'Unknown date'}"
        - Location: "${eventContext.location || 'Unknown location'}"
        - Description: "${eventContext.description || 'No description'}"

        TASK: Generate 3-5 smart suggestions to help this user avoid the duplicate conflict while coordinating with their existing wardrobe and the event context.

        Focus on:
        1. Alternative colors that work with their other items
        2. Similar styles that avoid the conflict
        3. Complementary pieces that enhance their look
        4. Items that fit the event context`
      }
    ];

    const response = await deepseekClient.post('/chat/completions', {
      model: "deepseek-chat",
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from DeepSeek API');
    }

    const text = response.data.choices[0].message.content;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0]);
      
      // Sort by priority and limit to top 5
      const sortedSuggestions = suggestions
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .slice(0, 5);

      // Add real product recommendations to each suggestion
      const enhancedSuggestions = await Promise.all(
        sortedSuggestions.map(async (suggestion) => {
          try {
            const realProducts = await findRealProducts(suggestion, duplicateItem, 'all');
            return {
              ...suggestion,
              realProducts: realProducts
            };
          } catch (error) {
            logger.warn('Failed to find real products for suggestion:', error);
            return suggestion;
          }
        })
      );
      logger.info('AI suggestions generated:', {
        duplicateItem: duplicateItem.name,
        suggestionsCount: enhancedSuggestions.length,
        types: enhancedSuggestions.map(s => s.type),
        withProducts: enhancedSuggestions.filter(s => s.realProducts).length
      });

      return enhancedSuggestions;
    }

    return [];
  } catch (error) {
    logger.error('AI suggestions generation error:', {
      error: error.message,
      duplicateItem: duplicateItem.name,
      userItemsCount: userOtherItems.length
    });
    return []; // Fallback to no suggestions on error
  }
}

export async function generateSponsorSuggestions(suggestions, eventContext = {}) {
  try {
    // TODO: Future implementation for sponsor integration
    // This will integrate with sponsor APIs to find actual products
    // and generate affiliate links for commission tracking
    
    logger.info('Sponsor suggestions requested (future feature):', {
      suggestionsCount: suggestions.length,
      event: eventContext.name
    });

    // For now, return enhanced suggestions with placeholder sponsor data
    return suggestions.map(suggestion => ({
      ...suggestion,
      sponsor: {
        available: false,
        message: "Sponsor integration coming soon!",
        futureFeature: true
      }
    }));
  } catch (error) {
    logger.error('Sponsor suggestions error:', error);
    return suggestions;
  }
}

export async function trackSuggestionInteraction(suggestionId, action, userId) {
  try {
    // TODO: Track user interactions with suggestions
    // This will help improve AI recommendations and track conversion rates
    
    logger.info('Suggestion interaction tracked:', {
      suggestionId,
      action, // 'viewed', 'clicked', 'purchased', 'dismissed'
      userId,
      timestamp: new Date().toISOString()
    });

    // Future: Store in database for analytics and AI improvement
  } catch (error) {
    logger.error('Suggestion tracking error:', error);
  }
}