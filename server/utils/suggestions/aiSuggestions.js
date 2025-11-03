// MIGRATED TO CLAUDE - This file now uses Claude AI instead of Grok
import { generateDuplicateSuggestions as claudeGenerateSuggestions } from '../claude/index.js';
import { logger } from '../logger.js';
import { AVAILABLE_COLORS } from '../colors/constants.js';
import { findRealProducts } from './productSearch.js';

export async function generateDuplicateSuggestions(duplicateItem, userOtherItems = [], eventContext = {}) {
  try {
    logger.info('Generating duplicate suggestions with Claude (migrated from Grok):', {
      duplicateItem: duplicateItem.name,
      userItemsCount: userOtherItems.length,
      eventName: eventContext.name
    });

    // Use Claude for suggestions
    const suggestions = await claudeGenerateSuggestions(duplicateItem, userOtherItems, eventContext);

    // Add real product recommendations to each suggestion
    const enhancedSuggestions = await Promise.all(
      suggestions.map(async (suggestion) => {
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

    logger.info('Claude AI suggestions generated successfully:', {
      duplicateItem: duplicateItem.name,
      suggestionsCount: enhancedSuggestions.length,
      withProducts: enhancedSuggestions.filter(s => s.realProducts).length
    });

    return enhancedSuggestions;
  } catch (error) {
    logger.error('Claude AI suggestions generation error:', {
      error: error.message,
      stack: error.stack,
      duplicateItem: duplicateItem.name,
      userItemsCount: userOtherItems.length
    });

    // Return fallback suggestions on error
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
      'dresses': ['mono', 'conjunto falda y top', 'pelele', 'conjunto de dos piezas'],
      'tops': ['blusa', 'jersey', 'cardigan', 'camiseta sin mangas', 'body'],
      'bottoms': ['falda', 'shorts', 'culottes', 'pantalones palazzo'],
      'shoes': ['bailarinas', 'botas', 'sandalias', 'cuñas', 'zapatillas'],
      'bags': ['clutch', 'bolso bandolera', 'bolso tote', 'mochila']
    };
    
    return alternatives[subcategory] || ['artículo de estilo alternativo', 'opción diferente'];
  };
  
  const alternativeItems = getAlternativeItems(duplicateItem);
  
  const fallbackSuggestions = [
    {
      type: 'alternativa_estilo',
      title: `Alternativa de Estilo: ${alternativeItems[0]}`,
      description: `En lugar de "${duplicateItem.name}", considera un ${alternativeItems[0]} que logre un look similar.`,
      item: {
        name: `${duplicateItem.color || 'Elegant'} ${alternativeItems[0]}`,
        category: duplicateItem.type?.category || 'clothes',
        subcategory: duplicateItem.type?.subcategory || 'dresses',
        color: duplicateItem.color || 'Black',
        style: 'Estética similar, artículo diferente'
      },
      reasoning: `Un ${alternativeItems[0]} te dará un look similar sin el conflicto de duplicados.`,
      searchTerms: [alternativeItems[0], duplicateItem.color || 'elegante', 'alternativa'],
      priority: 5
    },
    {
      type: 'estilo_alternativo',
      title: `Opción Diferente: ${alternativeItems[1] || 'Alternative Style'}`,
      description: `Prueba con un ${alternativeItems[1] || 'different style'} para lograr un look único y evitar duplicados.`,
      item: {
        name: `${duplicateItem.color || 'Stylish'} ${alternativeItems[1] || 'Alternative'}`,
        category: duplicateItem.type?.category || 'clothes',
        subcategory: duplicateItem.type?.subcategory || 'dresses',
        color: duplicateItem.color || 'Black',
        style: 'Diferente pero coordinado'
      },
      reasoning: `Un ${alternativeItems[1] || 'different style'} te permitirá mantener la elegancia sin duplicar artículos.`,
      searchTerms: [alternativeItems[1] || 'alternativa', duplicateItem.color || 'elegante', 'diferente'],
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