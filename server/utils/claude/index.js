import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../logger.js';
import { AVAILABLE_COLORS } from '../colors/constants.js';
import { getAllCategories } from '../categorization/index.js';
import axios from 'axios';

let claudeClient = null;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Initialize Claude client
 */
function initializeClaude() {
  const API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!API_KEY) {
    logger.error('Missing ANTHROPIC_API_KEY environment variable');
    return null;
  }

  try {
    claudeClient = new Anthropic({
      apiKey: API_KEY,
    });

    logger.info('Claude client initialized successfully');
    return claudeClient;
  } catch (error) {
    logger.error('Failed to initialize Claude:', error);
    return null;
  }
}

/**
 * Analyze garment image using Claude Vision
 * Replaces: Google Cloud Vision + DeepSeek interpretation
 */
export async function analyzeGarmentImage(imageUrl) {
  try {
    logger.info('Starting Claude image analysis:', { imageUrl });

    if (!claudeClient) {
      claudeClient = initializeClaude();
      if (!claudeClient) {
        throw new Error('Failed to initialize Claude client');
      }
    }

    // Enhanced image URL validation
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    const categories = getAllCategories();
    const colors = AVAILABLE_COLORS.map(c => c.name);

    let imageContent;

    // Handle base64 images
    if (imageUrl.startsWith('data:image/')) {
      logger.debug('Processing base64 image');
      const matches = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) {
        throw new Error('Invalid base64 image data');
      }

      const [, mediaType, data] = matches;
      imageContent = {
        type: "image",
        source: {
          type: "base64",
          media_type: `image/${mediaType}`,
          data: data,
        },
      };
    } else {
      // Regular URL - download and convert to base64
      logger.debug('Downloading image from URL...');
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const base64Data = Buffer.from(response.data).toString('base64');
      const contentType = response.headers['content-type'] || 'image/jpeg';

      imageContent = {
        type: "image",
        source: {
          type: "base64",
          media_type: contentType,
          data: base64Data,
        },
      };
    }

    // Spanish fashion brands to recognize
    const spanishBrands = [
      'Bimani', 'Bruna', 'Coosy', 'Lady Pipa', 'Redondo Brand', 'Miphai',
      'Mariquita Trasquilá', 'Vogana', 'Matilde Cano', 'Violeta Vergara',
      'Cayro Woman', 'La Croixé', 'Aware Barcelona', 'Cardié Moda',
      'Güendolina', 'Mattui', 'THE-ARE', 'Mannit', 'Mimoki', 'Panambi',
      'Carolina Herrera', 'CH', 'Zara', 'Mango', 'Massimo Dutti'
    ];

    const response = await claudeClient.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            imageContent,
            {
              type: "text",
              text: `Eres un experto en moda española. Analiza esta imagen de una prenda de ropa y extrae la siguiente información:

INSTRUCCIONES CRÍTICAS:
1. DETECCIÓN DE TIPO DE PRODUCTO:
   - ZAPATOS: Cualquier calzado incluyendo botas, tacones, zapatillas, sandalias
   - VESTIDOS: Cualquier prenda de una pieza incluyendo vestidos, túnicas
   - TOPS: Camisas, blusas, suéteres, camisetas
   - BOTTOMS: Pantalones, faldas, shorts
   - BOLSOS: Carteras, mochilas, clutches
   - JOYERÍA: Collares, pendientes, pulseras, anillos
   - OTROS: Cinturones, bufandas, sombreros, accesorios

2. DETECCIÓN DE MARCA - Busca estas marcas españolas:
   ${spanishBrands.join(', ')}
   También busca: logos CH, texto Carolina Herrera, etiquetas visibles

3. DETECCIÓN DE COLOR:
   - Analiza el color REAL del artículo, no el empaque
   - Colores disponibles: ${colors.join(', ')}
   - Usa el color más cercano de la lista

4. CATEGORIZACIÓN:
   - Categorías disponibles: ${categories.map(c => c.name).join(', ')}
   - Para ropa: subcategorías: tops, bottoms, dresses, outerwear
   - Para accesorios: subcategorías: shoes, bags, jewelry, other

EJEMPLOS:
- Botas de tacón moradas = category: "accessories", subcategory: "shoes", color: "Purple"
- Logo CH = brand: "Carolina Herrera"
- Vestido negro formal = category: "clothes", subcategory: "dresses", color: "Black"

Devuelve SOLO un objeto JSON con esta estructura exacta:
{
  "name": "Nombre descriptivo del producto en español",
  "color": "Color de la lista",
  "brand": "Marca si es visible, sino null",
  "type": {
    "category": "clothes o accessories",
    "subcategory": "subcategoría apropiada",
    "name": "Nombre legible de la subcategoría"
  },
  "description": "Descripción detallada del artículo",
  "confidence": 0.95
}`
            }
          ]
        }
      ]
    });

    const text = response.content[0].text;
    logger.debug('Claude response received:', { textLength: text.length });

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Claude response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    logger.info('Claude analysis completed successfully:', {
      hasName: !!analysis.name,
      hasBrand: !!analysis.brand,
      hasColor: !!analysis.color,
      hasType: !!analysis.type,
      confidence: analysis.confidence
    });

    return {
      name: analysis.name || 'Fashion Item',
      brand: analysis.brand || null,
      color: analysis.color || null,
      type: analysis.type || {
        category: 'clothes',
        subcategory: 'dresses',
        name: 'Dresses'
      },
      description: analysis.description || 'Fashion item from uploaded image',
      confidence: {
        labels: analysis.confidence || 0.85,
        overall: analysis.confidence || 0.85
      }
    };
  } catch (error) {
    logger.error('Claude image analysis error:', {
      error: error.message,
      stack: error.stack
    });
    throw new Error('Claude image analysis failed: ' + error.message);
  }
}

/**
 * Analyze similarity between items and detect duplicates
 * Replaces: Grok aiSimilarity.js
 */
export async function analyzeSimilarItems(newItemName, existingItems) {
  try {
    if (!claudeClient) {
      claudeClient = initializeClaude();
      if (!claudeClient) {
        logger.warn('Claude not available for similarity analysis');
        return [];
      }
    }

    // Filter out items that are exactly the same
    const differentItems = existingItems.filter(item =>
      item.name.toLowerCase() !== newItemName.toLowerCase()
    );

    if (differentItems.length === 0) {
      return [];
    }

    const response = await claudeClient.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: `Eres un analizador de similitud de moda. Compara nombres de prendas para encontrar artículos similares que podrían causar conflictos.

REGLAS DE SIMILITUD:
1. Mismo tipo de ropa con diferentes descripciones = SIMILAR
2. Misma marca/estilo con diferentes colores/tallas = SIMILAR
3. Diferentes tipos de ropa = NO SIMILAR
4. Accesorios vs ropa = NO SIMILAR
5. Considera nombres en español, inglés, francés, italiano

EJEMPLOS:
- "Vestido rojo largo" vs "Red maxi dress" = SIMILAR (mismo tipo)
- "Zapatos negros tacón" vs "Black high heels" = SIMILAR (mismo tipo de zapato)
- "Vestido" vs "Pantalón" = NO SIMILAR (diferentes tipos)
- "Dress" vs "Bag" = NO SIMILAR (diferentes categorías)

ARTÍCULO NUEVO: "${newItemName}"

ARTÍCULOS EXISTENTES:
${differentItems.map((item, index) => `${index + 1}. "${item.name}"`).join('\n')}

Devuelve un array JSON con puntuaciones de similitud de 0.0 a 1.0:
- 0.8-1.0 = Muy similar (probablemente mismo tipo)
- 0.6-0.79 = Algo similar (artículos relacionados)
- 0.0-0.59 = No similar

Formato:
[
  {
    "itemIndex": 1,
    "itemName": "nombre del artículo existente",
    "similarity": 0.85,
    "reason": "Ambos son vestidos largos, mismo estilo"
  }
]

Solo incluye artículos con similitud >= 0.6`
        }
      ]
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const similarities = JSON.parse(jsonMatch[0]);

      // Map back to original items and filter by threshold
      const similarItems = similarities
        .filter(sim => sim.similarity >= 0.6)
        .map(sim => ({
          ...differentItems[sim.itemIndex - 1],
          similarity: sim.similarity,
          reason: sim.reason
        }));

      logger.info('Claude similarity analysis completed:', {
        newItem: newItemName,
        foundSimilar: similarItems.length
      });

      return similarItems;
    }

    return [];
  } catch (error) {
    logger.error('Claude similarity analysis error:', {
      error: error.message,
      newItem: newItemName
    });
    return [];
  }
}

/**
 * Detect smart duplicates using Claude
 * Replaces: Grok aiSimilarity.js detectSmartDuplicates
 */
export async function detectSmartDuplicates(newItem, existingItems) {
  try {
    if (!claudeClient) {
      claudeClient = initializeClaude();
      if (!claudeClient) {
        logger.warn('Claude not available for smart duplicate detection');
        return [];
      }
    }

    // Filter items that could be duplicates
    const potentialDuplicates = existingItems.filter(item => {
      if (item.brand && newItem.brand && item.color && newItem.color) {
        if (item.brand.toLowerCase() === newItem.brand.toLowerCase() &&
            item.color.toLowerCase() === newItem.color.toLowerCase()) {
          return true;
        }
      }

      if (item.type?.subcategory && newItem.type?.subcategory && item.color && newItem.color) {
        if (item.type.subcategory === newItem.type.subcategory &&
            item.color.toLowerCase() === newItem.color.toLowerCase()) {
          return true;
        }
      }

      return false;
    });

    if (potentialDuplicates.length === 0) {
      return [];
    }

    const response = await claudeClient.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: `Eres un detector de duplicados de moda. Analiza si estos artículos son el mismo producto con diferentes nombres.

REGLAS CRÍTICAS:
1. Misma marca + mismo color + mismo tipo = PROBABLEMENTE DUPLICADO
2. Diferentes idiomas para el mismo artículo = DUPLICADO ("Vestido Negro" = "Black Dress")
3. Diferentes descripciones para el mismo artículo = DUPLICADO ("Vestido Formal" = "Formal Dress")
4. Misma apariencia visual = DUPLICADO
5. Diferentes tallas del mismo artículo = DUPLICADO

ARTÍCULO NUEVO:
- Nombre: "${newItem.name}"
- Marca: "${newItem.brand || 'Desconocida'}"
- Color: "${newItem.color || 'Desconocido'}"
- Tipo: "${newItem.type?.name || 'Desconocido'}"
- Categoría: "${newItem.type?.category || 'Desconocida'}"

ARTÍCULOS EXISTENTES PARA COMPARAR:
${potentialDuplicates.map((item, index) => `
${index + 1}. "${item.name}"
   - Marca: "${item.brand || 'Desconocida'}"
   - Color: "${item.color || 'Desconocido'}"
   - Tipo: "${item.type?.name || 'Desconocido'}"
   - Usuario: "${item.userName || 'Usuario Desconocido'}"
`).join('')}

Devuelve un array JSON con el análisis de duplicados:
[
  {
    "itemIndex": 1,
    "itemName": "nombre del artículo existente",
    "confidence": 0.95,
    "isDuplicate": true,
    "reason": "Mismo vestido negro formal Carolina Herrera, solo diferente idioma",
    "type": "exact"
  }
]

Solo incluye artículos con confidence >= 0.7`
        }
      ]
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const duplicates = JSON.parse(jsonMatch[0]);

      const detectedDuplicates = duplicates
        .filter(dup => dup.confidence >= 0.7 && dup.isDuplicate)
        .map(dup => ({
          ...potentialDuplicates[dup.itemIndex - 1],
          confidence: dup.confidence,
          reason: dup.reason,
          duplicateType: dup.confidence >= 0.9 ? 'exact' : 'similar'
        }));

      logger.info('Claude smart duplicate detection completed:', {
        newItem: newItem.name,
        detectedCount: detectedDuplicates.length
      });

      return detectedDuplicates;
    }

    return [];
  } catch (error) {
    logger.error('Claude smart duplicate detection error:', {
      error: error.message,
      newItem: newItem.name
    });
    return [];
  }
}

/**
 * Generate alternative suggestions for duplicate items
 * Replaces: Grok aiSuggestions.js
 */
export async function generateDuplicateSuggestions(duplicateItem, userOtherItems = [], eventContext = {}) {
  try {
    logger.info('Generating duplicate suggestions with Claude:', {
      duplicateItem: duplicateItem.name,
      userItemsCount: userOtherItems.length,
      eventName: eventContext.name
    });

    if (!claudeClient) {
      claudeClient = initializeClaude();
      if (!claudeClient) {
        throw new Error('Claude not available for suggestions');
      }
    }

    const categories = getAllCategories();
    const colors = AVAILABLE_COLORS.map(c => c.name);

    const response = await claudeClient.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2500,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: `Eres una IA estilista de moda que ayuda a usuarios a evitar conflictos de vestuario sugiriendo artículos alternativos.

INSTRUCCIONES CRÍTICAS:
1. Analiza el artículo duplicado y sugiere 3-5 alternativas
2. Considera los otros artículos del usuario para asegurar coordinación
3. Sugiere artículos que complementen su guardarropa existente
4. Proporciona sugerencias específicas y accionables con razonamiento
5. Incluye alternativas de color y variaciones de estilo
6. Considera el contexto del evento (formal, casual, etc.)

TIPOS DE SUGERENCIAS:
1. ALTERNATIVAS DE COLOR - Mismo artículo, diferentes colores
2. VARIACIONES DE ESTILO - Artículos DIFERENTES con estética similar
3. ARTÍCULOS COMPLEMENTARIOS - Artículos que funcionan bien juntos
4. ESTILOS ALTERNATIVOS - Artículos completamente diferentes que logran el mismo look

Categorías disponibles: ${categories.map(c => c.name).join(', ')}
Colores disponibles: ${colors.join(', ')}

CRÍTICO: ¡NO sugieras el mismo nombre en diferentes tiendas!
Sugiere artículos DIFERENTES que logren un estilo similar.

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

TAREA: Genera 3-5 artículos DIFERENTES que logren un estilo similar.

Devuelve un array JSON:
[
  {
    "type": "alternativa_estilo|variacion_color|complementario|estilo_alternativo",
    "title": "Título de la sugerencia",
    "description": "Por qué este artículo DIFERENTE logra el mismo estilo",
    "item": {
      "name": "Nombre DIFERENTE (no el duplicado)",
      "category": "categoría",
      "subcategory": "subcategoría",
      "color": "color sugerido",
      "style": "descripción de estilo"
    },
    "reasoning": "Por qué funciona como alternativa",
    "searchTerms": ["términos", "de", "búsqueda"],
    "priority": 5
  }
]`
        }
      ]
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0]);

      // Sort by priority and limit to top 5
      const sortedSuggestions = suggestions
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .slice(0, 5);

      logger.info('Claude suggestions generated successfully:', {
        duplicateItem: duplicateItem.name,
        suggestionsCount: sortedSuggestions.length
      });

      return sortedSuggestions;
    }

    logger.warn('No valid JSON found in Claude suggestions response');
    return [];
  } catch (error) {
    logger.error('Claude suggestions generation error:', {
      error: error.message,
      stack: error.stack,
      duplicateItem: duplicateItem.name
    });
    throw error;
  }
}

/**
 * Interpret scraped product HTML
 * Replaces: DeepSeek/Grok interpretScrapedProduct
 */
export async function interpretScrapedProduct({ html, basicInfo, url }) {
  try {
    if (!claudeClient) {
      claudeClient = initializeClaude();
      if (!claudeClient) {
        throw new Error('Failed to initialize Claude client');
      }
    }

    const categories = getAllCategories();
    const colors = AVAILABLE_COLORS.map(c => c.name);

    const response = await claudeClient.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: `Eres un analizador de productos de moda. Extrae y mejora los detalles del producto desde el HTML.

INSTRUCCIONES CRÍTICAS:
1. Categorías: clothes, accessories
2. Para ropa: subcategorías: tops, bottoms, dresses, outerwear
3. Para accesorios: subcategorías: shoes, bags, jewelry, other
4. DETECCIÓN DE VESTIDO: "vestido", "dress", "robe" = categoría "clothes", subcategoría "dresses"
5. DETECCIÓN DE ZAPATOS: "zapato", "shoe", "sandalia", "bota" = categoría "accessories", subcategoría "shoes"
6. DETECCIÓN DE BOLSOS: "bolso", "bag", "cartera" = categoría "accessories", subcategoría "bags"
7. Formato de precio:
   - Convertir "45,95€" a 45.95 (NO 4595)
   - Convertir "169,95€" a 169.95 (NO 16995)
   - Usar punto como separador decimal
   - Ejemplos: "45,95€" → 45.95, "1.234,56€" → 1234.56

Categorías disponibles: ${categories.map(c => c.name).join(', ')}
Colores disponibles: ${colors.join(', ')}

URL: ${url}

Info Básica:
${JSON.stringify(basicInfo, null, 2)}

HTML (primeros 1500 caracteres):
${html.substring(0, 1500)}

Devuelve un objeto JSON con:
- name: Nombre del producto
- imageUrl: URL de imagen principal (REQUERIDO)
- color: Color principal de la lista
- price: Precio como número (correctamente formateado)
- brand: Marca si se encuentra
- type: Objeto con category y subcategory
- description: Descripción del producto`
        }
      ]
    });

    const text = response.content[0].text;
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

      if (!result.imageUrl && basicInfo.imageUrl) {
        result.imageUrl = basicInfo.imageUrl;
      }

      logger.debug('Claude parsed scraped product:', result);
      return result;
    }

    throw new Error('No valid JSON found in Claude response');
  } catch (error) {
    logger.error('Claude scraping analysis error:', error);
    return basicInfo;
  }
}

/**
 * Check Claude API status
 */
export async function checkClaudeStatus() {
  try {
    const now = Date.now();
    if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL && claudeClient) {
      return {
        initialized: true,
        hasApiKey: true,
        status: 'connected'
      };
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        initialized: false,
        hasApiKey: false,
        error: 'Missing API key'
      };
    }

    if (!claudeClient) {
      claudeClient = initializeClaude();
    }

    if (!claudeClient) {
      return {
        initialized: false,
        hasApiKey: true,
        error: 'Failed to initialize client'
      };
    }

    // Simple test request
    try {
      const response = await Promise.race([
        claudeClient.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 10,
          messages: [{ role: "user", content: "Test" }]
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
      logger.warn('Claude test request failed:', testError.message);

      return {
        initialized: true,
        hasApiKey: true,
        status: 'limited',
        error: 'Test failed but client available'
      };
    }
  } catch (error) {
    logger.error('Claude status check failed:', error);
    return {
      initialized: false,
      hasApiKey: !!process.env.ANTHROPIC_API_KEY,
      error: error.message
    };
  }
}

export { initializeClaude };
