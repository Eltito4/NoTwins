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
    logger.info('Available env vars:', Object.keys(process.env).filter(key => key.includes('DEEP')));
    return null;
  }

  logger.info('Initializing DeepSeek client with API key:', {
    hasKey: !!API_KEY,
    keyLength: API_KEY.length,
    keyPreview: API_KEY.substring(0, 10) + '...'
  });

  try {
    deepseekClient = axios.create({
      baseURL: 'https://api.deepseek.com/v1',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      timeout: 30000
    });

    logger.info('DeepSeek client created successfully');
    return deepseekClient;
  } catch (error) {
    logger.error('Failed to initialize DeepSeek for suggestions:', error);
    return null;
  }
}

export async function generateDuplicateSuggestions(duplicateItem, userOtherItems = [], eventContext = {}) {
  try {
    logger.info('Generating duplicate suggestions for:', {
      duplicateItem: duplicateItem.name,
      userItemsCount: userOtherItems.length,
      eventName: eventContext.name
    });

    if (!deepseekClient) {
      logger.info('Initializing DeepSeek client...');
      deepseekClient = initializeDeepSeek();
      if (!deepseekClient) {
        logger.warn('DeepSeek not available, generating fallback suggestions');
        return generateFallbackSuggestions(duplicateItem, userOtherItems, eventContext);
      }
      logger.info('DeepSeek client initialized successfully');
    }

    const categories = getAllCategories();
    const colors = AVAILABLE_COLORS.map(c => c.name);

    logger.info('Preparing AI request with:', {
      categoriesCount: categories.length,
      colorsCount: colors.length,
      duplicateItem: duplicateItem.name,
      userOtherItemsCount: userOtherItems.length
    });

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
        2. STYLE VARIATIONS - DIFFERENT items with similar aesthetic/vibe
        3. COMPLEMENTARY ITEMS - Items that work well together but are DIFFERENT
        4. ALTERNATIVE STYLES - Completely different items that achieve same look
        
        Available categories: ${categories.map(c => c.name).join(', ')}
        Available colors: ${colors.join(', ')}
        
        CRITICAL: DO NOT suggest the same item name in different stores!
        Instead, suggest DIFFERENT items that achieve a similar style/aesthetic.
        
        EXAMPLES:
        - Instead of "Black Dress" → suggest "Black Jumpsuit", "Black Skirt + Top", "Black Romper"
        - Instead of "Red Heels" → suggest "Red Flats", "Red Boots", "Red Sandals"
        - Instead of "Blue Shirt" → suggest "Blue Blouse", "Blue Sweater", "Blue Tank Top"
        
        RESPONSE FORMAT:
        Return a JSON array of suggestions with this structure:
        [
          {
            "type": "style_alternative|color_variation|complementary|alternative_style",
            "title": "Suggestion title",
            "description": "Why this DIFFERENT item achieves the same style",
            "item": {
              "name": "DIFFERENT item name (not the same as duplicate)",
              "category": "category",
              "subcategory": "subcategory", 
              "color": "suggested color",
              "style": "style description that matches the original vibe"
            },
            "reasoning": "Why this DIFFERENT item works as an alternative",
            "searchTerms": ["different", "item", "terms"],
            "priority": 1-5
          }
        ]`
      },
      {
        role: "user",
        content: `STYLE-BASED ALTERNATIVE NEEDED:

        DUPLICATE ITEM (DO NOT suggest same name):
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

        CRITICAL TASK: Generate 3-5 DIFFERENT items (NOT the same name) that achieve a similar style/aesthetic.

        STRICT REQUIREMENTS:
        1. NEVER suggest the same item name ("${duplicateItem.name}")
        2. Suggest DIFFERENT items that achieve similar style/vibe
        3. Consider the event formality and context
        4. Coordinate with user's existing wardrobe
        5. Provide truly alternative options, not just color changes
        
        EXAMPLES of GOOD suggestions for "${duplicateItem.name}":
        - If it's a dress → suggest jumpsuit, skirt+top combo, romper
        - If it's heels → suggest flats, boots, sandals, wedges
        - If it's a shirt → suggest blouse, sweater, tank top, cardigan
        - If it's pants → suggest skirt, shorts, leggings, culottes`
      }
    ];

    logger.info('Sending request to DeepSeek API...');

    const response = await deepseekClient.post('/chat/completions', {
      model: "deepseek-chat",
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    logger.info('DeepSeek API response received:', {
      hasResponse: !!response.data,
      hasChoices: !!response.data?.choices,
      choicesLength: response.data?.choices?.length || 0
    });

    if (!response.data?.choices?.[0]?.message?.content) {
      logger.error('Invalid response from DeepSeek API:', response.data);
      throw new Error('Invalid response from DeepSeek API');
    }

    const text = response.data.choices[0].message.content;
    logger.info('DeepSeek response text:', { textLength: text.length, preview: text.substring(0, 200) });
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      logger.info('Found JSON in response, parsing...');
      const suggestions = JSON.parse(jsonMatch[0]);
      
      // Sort by priority and limit to top 5
      const sortedSuggestions = suggestions
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .slice(0, 3); // Limit to 3 main suggestions

      logger.info('Parsed suggestions:', { count: sortedSuggestions.length });

      // Add real product recommendations to each suggestion
      const enhancedSuggestions = await Promise.all(
        sortedSuggestions.map(async (suggestion) => {
          try {
            // Get products for all budget categories
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

    logger.warn('No valid JSON found in DeepSeek response:', { text });
    logger.warn('No valid JSON found in DeepSeek response, using fallback');
    return generateFallbackSuggestions(duplicateItem, userOtherItems, eventContext);
  } catch (error) {
    logger.error('AI suggestions generation error:', {
      error: error.message,
      stack: error.stack,
      duplicateItem: duplicateItem.name,
      userItemsCount: userOtherItems.length
    });
    return generateFallbackSuggestions(duplicateItem, userOtherItems, eventContext);
  }
}

async function generateFallbackSuggestions(duplicateItem, userOtherItems, eventContext) {
  logger.info('Generating fallback suggestions');
  
  // Generate truly different alternatives based on item type
  const getAlternativeItems = (originalItem) => {
    const category = originalItem.type?.category || 'clothes';
    const subcategory = originalItem.type?.subcategory || 'other';
    
    const alternatives = {
      'dresses': ['jumpsuit', 'skirt and top combo', 'romper', 'two-piece set'],
      'tops': ['blouse', 'sweater', 'cardigan', 'tank top', 'bodysuit'],
      'bottoms': ['skirt', 'shorts', 'culottes', 'palazzo pants'],
      'shoes': ['flats', 'boots', 'sandals', 'wedges', 'sneakers'],
      'bags': ['clutch', 'crossbody bag', 'tote bag', 'backpack']
    };
    
    return alternatives[subcategory] || ['alternative style item', 'different option'];
  };
  
  const alternativeItems = getAlternativeItems(duplicateItem);
  
  const fallbackSuggestions = [
    {
      type: 'style_alternative',
      title: `Alternativa de Estilo: ${alternativeItems[0]}`,
      description: `En lugar de "${duplicateItem.name}", considera un ${alternativeItems[0]} que logre un look similar.`,
      item: {
        name: `${duplicateItem.color || 'Elegant'} ${alternativeItems[0]}`,
        category: duplicateItem.type?.category || 'clothes',
        subcategory: duplicateItem.type?.subcategory || 'dresses',
        color: duplicateItem.color || 'Black',
        style: 'Similar aesthetic, different item'
      },
      reasoning: `Un ${alternativeItems[0]} te dará un look similar sin el conflicto de duplicados.`,
      searchTerms: [alternativeItems[0], duplicateItem.color || 'elegant', 'alternative'],
      priority: 5
    },
    {
      type: 'alternative_style',
      title: `Opción Diferente: ${alternativeItems[1] || 'Alternative Style'}`,
      description: `Prueba con un ${alternativeItems[1] || 'different style'} para lograr un look único y evitar duplicados.`,
      item: {
        name: `${duplicateItem.color || 'Stylish'} ${alternativeItems[1] || 'Alternative'}`,
        category: duplicateItem.type?.category || 'clothes',
        subcategory: duplicateItem.type?.subcategory || 'dresses',
        color: duplicateItem.color || 'Negro',
        style: 'Different but coordinated'
      },
      reasoning: `Un ${alternativeItems[1] || 'different style'} te permitirá mantener la elegancia sin duplicar artículos.`,
      searchTerms: [alternativeItems[1] || 'alternative', duplicateItem.color || 'elegant', 'different'],
      priority: 4
    }
  ];

  // Add real products to fallback suggestions
  return Promise.all(
    fallbackSuggestions.map(async (suggestion) => {
      try {
        const realProducts = await findRealProducts(suggestion, duplicateItem, 'all');
        return {
          ...suggestion,
          realProducts: realProducts
        };
      } catch (error) {
        logger.warn('Failed to find real products for fallback suggestion:', error);
        return suggestion;
      }
    })
  );
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