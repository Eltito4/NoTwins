import axios from 'axios';
import { logger } from '../logger.js';
import { AVAILABLE_COLORS } from '../colors/constants.js';
import { getAllCategories } from '../categorization/index.js';
import { findRealProducts } from './productSearch.js';
import { initializeGrok, checkGrokStatus } from '../vision/grok.js';

let grokClient = null;

export async function generateDuplicateSuggestions(duplicateItem, userOtherItems = [], eventContext = {}) {
  try {
    logger.info('Generating duplicate suggestions for:', {
      duplicateItem: duplicateItem.name,
      userItemsCount: userOtherItems.length,
      eventName: eventContext.name
    });

    if (!grokClient) {
      logger.info('Initializing Grok client...');
      grokClient = initializeGrok();
      if (!grokClient) {
        logger.warn('Grok not available, generating fallback suggestions');
        return generateFallbackSuggestions(duplicateItem, userOtherItems, eventContext);
      }
      logger.info('Grok client initialized successfully');
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
        content: `Eres una IA estilista de moda que ayuda a los usuarios a evitar conflictos de vestuario sugiriendo artículos alternativos.

        INSTRUCCIONES CRÍTICAS:
        1. Analiza el artículo duplicado y sugiere 3-5 alternativas
        2. Considera los otros artículos del usuario para asegurar coordinación
        3. Sugiere artículos que complementen su guardarropa existente
        4. Proporciona sugerencias específicas y accionables con razonamiento
        5. Incluye alternativas de color y variaciones de estilo
        6. Considera el contexto del evento (formal, casual, etc.)
        
        TIPOS DE SUGERENCIAS:
        1. ALTERNATIVAS DE COLOR - Mismo artículo, diferentes colores
        2. VARIACIONES DE ESTILO - Artículos DIFERENTES con estética/vibra similar
        3. ARTÍCULOS COMPLEMENTARIOS - Artículos que funcionan bien juntos pero son DIFERENTES
        4. ESTILOS ALTERNATIVOS - Artículos completamente diferentes que logran el mismo look
        
        Categorías disponibles: ${categories.map(c => c.name).join(', ')}
        Colores disponibles: ${colors.join(', ')}
        
        CRÍTICO: ¡NO sugieras el mismo nombre de artículo en diferentes tiendas!
        En su lugar, sugiere artículos DIFERENTES que logren un estilo/estética similar.
        
        EJEMPLOS:
        - En lugar de "Vestido Negro" → sugiere "Mono Negro", "Falda Negra + Top", "Pelele Negro"
        - En lugar de "Tacones Rojos" → sugiere "Bailarinas Rojas", "Botas Rojas", "Sandalias Rojas"
        - En lugar de "Camisa Azul" → sugiere "Blusa Azul", "Jersey Azul", "Camiseta Sin Mangas Azul"
        
        FORMATO DE RESPUESTA:
        Devuelve un array JSON de sugerencias con esta estructura:
        [
          {
            "type": "alternativa_estilo|variacion_color|complementario|estilo_alternativo",
            "title": "Título de la sugerencia",
            "description": "Por qué este artículo DIFERENTE logra el mismo estilo",
            "item": {
              "name": "Nombre del artículo DIFERENTE (no el mismo que el duplicado)",
              "category": "categoría",
              "subcategory": "subcategory", 
              "color": "color sugerido",
              "style": "descripción de estilo que coincida con la vibra original"
            },
            "reasoning": "Por qué este artículo DIFERENTE funciona como alternativa",
            "searchTerms": ["términos", "de", "búsqueda"],
            "priority": 1-5
          }
        ]`
      },
      {
        role: "user",
        content: `ALTERNATIVA BASADA EN ESTILO NECESARIA:

        ARTÍCULO DUPLICADO (NO sugieras el mismo nombre):
        - Nombre: "${duplicateItem.name}"
        - Color: "${duplicateItem.color || 'Desconocido'}"
        - Marca: "${duplicateItem.brand || 'Desconocida'}"
        - Tipo: "${duplicateItem.type?.name || 'Desconocido'}"
        - Categoría: "${duplicateItem.type?.category || 'Desconocida'}"

        OTROS ARTÍCULOS DEL USUARIO:
        ${userOtherItems.length > 0 ? userOtherItems.map((item, index) => 
          `${index + 1}. "${item.name}" - ${item.color || 'Sin color'} - ${item.type?.name || 'Tipo desconocido'}`
        ).join('\n') : 'No hay otros artículos en el guardarropa'}

        CONTEXTO DEL EVENTO:
        - Evento: "${eventContext.name || 'Evento desconocido'}"
        - Fecha: "${eventContext.date || 'Fecha desconocida'}"
        - Ubicación: "${eventContext.location || 'Ubicación desconocida'}"
        - Descripción: "${eventContext.description || 'Sin descripción'}"

        TAREA CRÍTICA: Genera 3-5 artículos DIFERENTES (NO el mismo nombre) que logren un estilo/estética similar.

        REQUISITOS ESTRICTOS:
        1. NUNCA sugieras el mismo nombre de artículo ("${duplicateItem.name}")
        2. Sugiere artículos DIFERENTES que logren estilo/vibra/silueta similar
        3. Considera la formalidad del evento y contexto ("${eventContext.name}" - "${eventContext.description}")
        4. Coordina con los artículos existentes del guardarropa del usuario
        5. Enfócate en ALTERNATIVAS DE ESTILO, no variaciones de nombre
        6. Piensa en lograr el mismo look general con piezas diferentes`
      }
    ];

    logger.info('Sending request to Grok API...');

    const response = await grokClient.post('/chat/completions', {
      model: "grok-4-latest",
      messages,
      temperature: 0.7,
      stream: false,
      max_tokens: 2000
    });

    logger.info('Grok API response received:', {
      hasResponse: !!response.data,
      hasChoices: !!response.data?.choices,
      choicesLength: response.data?.choices?.length || 0,
      responseContent: response.data?.choices?.[0]?.message?.content?.substring(0, 100) || 'No content'
    });

    if (!response.data?.choices?.[0]?.message?.content) {
      logger.error('Invalid response from Grok API:', response.data);
      throw new Error('Invalid response from Grok API');
    }

    const text = response.data.choices[0].message.content;
    logger.info('Grok response received successfully:', { 
      textLength: text.length, 
      preview: text.substring(0, 200),
      hasJsonMatch: text.includes('[') && text.includes(']')
    });
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      logger.info('Found JSON in Grok response, parsing...', { 
        jsonLength: jsonMatch[0].length 
      });
      const suggestions = JSON.parse(jsonMatch[0]);
      
      // Sort by priority and limit to top 5
      const sortedSuggestions = suggestions
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .slice(0, 3); // Limit to 3 main suggestions

      logger.info('Grok suggestions parsed successfully:', { 
        count: sortedSuggestions.length,
        types: sortedSuggestions.map(s => s.type),
        titles: sortedSuggestions.map(s => s.title)
      });

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
      
      logger.info('Grok AI suggestions generated successfully:', {
        duplicateItem: duplicateItem.name,
        suggestionsCount: enhancedSuggestions.length,
        types: enhancedSuggestions.map(s => s.type),
        withProducts: enhancedSuggestions.filter(s => s.realProducts).length
      });

      return enhancedSuggestions;
    }

    logger.warn('No valid JSON found in Grok response, using fallback:', { 
      textPreview: text.substring(0, 500),
      hasArray: text.includes('['),
      hasBrace: text.includes('{')
    });
    return generateFallbackSuggestions(duplicateItem, userOtherItems, eventContext);
  } catch (error) {
    logger.error('Grok AI suggestions generation error:', {
      error: error.message,
      stack: error.stack,
      duplicateItem: duplicateItem.name,
      userItemsCount: userOtherItems.length,
      isTimeout: error.message.includes('timeout'),
      isNetworkError: error.code === 'ECONNRESET' || error.code === 'ENOTFOUND'
    });
    
    if (error.message.includes('timeout')) {
      logger.error('Grok API timeout - consider increasing timeout or checking API status');
    }
    
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