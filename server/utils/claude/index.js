import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../logger.js';
import { AVAILABLE_COLORS } from '../colors/constants.js';
import { getAllCategories } from '../categorization/index.js';
import axios from 'axios';
import NodeCache from 'node-cache';

let claudeClient = null;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Cache for storing analysis results (24 hours TTL)
const analysisCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });
const crypto = await import('crypto');

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

    // Check cache first (saves 100% on repeated images)
    const cacheKey = `image:${crypto.default.createHash('md5').update(imageUrl).digest('hex')}`;
    const cached = analysisCache.get(cacheKey);
    if (cached) {
      logger.info('Cache HIT - returning cached image analysis', { imageUrl: imageUrl.substring(0, 50) });
      return cached;
    }

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
    const spanishBrands = ['Bimani', 'Bruna', 'Coosy', 'Lady Pipa', 'Redondo Brand', 'Miphai',
      'Mariquita Trasquilá', 'Vogana', 'Matilde Cano', 'Violeta Vergara', 'Cayro Woman',
      'La Croixé', 'Aware Barcelona', 'Cardié Moda', 'Güendolina', 'Mattui', 'THE-ARE',
      'Mannit', 'Mimoki', 'Panambi', 'Carolina Herrera', 'CH', 'Zara', 'Mango', 'Massimo Dutti'];

    // Use Claude 3 Haiku - only model available on this API key
    // Optimized prompt for maximum brand detection capability
    const response = await claudeClient.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024, // Higher for detailed brand detection
      system: [
        {
          type: "text",
          text: `Experto en moda. Analiza la imagen paso a paso:

PASO 1 - BUSCAR MARCA (MUY IMPORTANTE):
Examina TODO en busca de texto/logos:
• Etiquetas: cuello, interior, cintura, mangas
• Logos: pecho, espalda, mangas, piernas
• Texto: costuras, botones, cremalleras, hebillas
• Marcas: ${spanishBrands.join(', ')}, Nike, Adidas, H&M, Bershka, Pull&Bear, Stradivarius, CUALQUIER OTRA
• Si ves CUALQUIER palabra/logo → es la marca
• Si NO ves texto → brand: null

PASO 2 - IDENTIFICAR TIPO:
Tipo: ${categories.map(c => `${c.name}: ${c.subcategories.map(s => s.name).join(', ')}`).join(' | ')}

PASO 3 - COLOR:
Elige de: ${colors.join(', ')}

PASO 4 - NOMBRE Y DESCRIPCIÓN:
Nombre descriptivo en español

JSON EXACTO (copia formato):
{"name":"Vestido negro","color":"Negro","brand":"Zara","type":{"category":"clothes","subcategory":"dresses","name":"Dresses"},"description":"Vestido negro elegante","confidence":0.9}

REGLAS:
✓ Si hay texto visible → siempre incluir en brand
✓ Buscar en etiquetas, logos, costuras, hebillas
✓ Marcas comunes: Zara, Mango, H&M, Nike, Adidas, etc.
✗ No inventar marcas si no las ves`,
          cache_control: { type: "ephemeral" } // ⭐ PROMPT CACHING
        }
      ],
      messages: [
        {
          role: "user",
          content: [imageContent]
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

    const result = {
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

    // Store in cache for 24 hours (100% cost saving on repeated images)
    analysisCache.set(cacheKey, result);
    logger.debug('Result cached for future requests');

    return result;
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
    // Check cache first
    const itemNames = existingItems.map(i => i.name).sort().join('|');
    const cacheKey = `similarity:${crypto.default.createHash('md5').update(newItemName + itemNames).digest('hex')}`;
    const cached = analysisCache.get(cacheKey);
    if (cached) {
      logger.info('Cache HIT - returning cached similarity analysis');
      return cached;
    }

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

    // COST OPTIMIZATION: Use Haiku (80% cheaper) for simple comparisons
    const response = await claudeClient.messages.create({
      model: "claude-3-haiku-20240307", // 80% cheaper than Sonnet
      max_tokens: 800, // Reduced from 2000
      temperature: 0.2,
      system: [
        {
          type: "text",
          text: `Analiza similitud de moda. Reglas:
- Mismo tipo + descripción diferente = SIMILAR
- Marca/estilo igual + color diferente = SIMILAR
- Tipo diferente = NO SIMILAR
- ES/EN/FR/IT: mismo significado = SIMILAR

Score 0-1: 0.8-1.0=muy similar, 0.6-0.79=algo similar, <0.6=diferente. JSON: [{"itemIndex":N,"itemName":"...","similarity":0.85,"reason":"..."}]. Solo >= 0.6`,
          cache_control: { type: "ephemeral" } // ⭐ PROMPT CACHING
        }
      ],
      messages: [
        {
          role: "user",
          content: `Nuevo: "${newItemName}"
Existentes:
${differentItems.map((item, index) => `${index + 1}. "${item.name}"`).join('\n')}`
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

      // Store in cache
      analysisCache.set(cacheKey, similarItems);

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
    // Check cache first
    const itemData = JSON.stringify({n: newItem.name, b: newItem.brand, c: newItem.color, t: newItem.type?.subcategory});
    const existingData = existingItems.map(i => ({n:i.name, b:i.brand, c:i.color})).sort((a,b) => a.n.localeCompare(b.n));
    const cacheKey = `duplicates:${crypto.default.createHash('md5').update(itemData + JSON.stringify(existingData)).digest('hex')}`;
    const cached = analysisCache.get(cacheKey);
    if (cached) {
      logger.info('Cache HIT - returning cached duplicate detection');
      return cached;
    }

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

    // COST OPTIMIZATION: Reduced prompt + cache_control
    const response = await claudeClient.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 800, // Reduced from 1500
      temperature: 0.2,
      system: [
        {
          type: "text",
          text: `Detector duplicados moda. Reglas:
- Marca + color + tipo = DUPLICADO
- Idioma diferente, mismo producto = DUPLICADO (ES/EN/FR/IT)
- Talla diferente, mismo producto = DUPLICADO

Confidence 0-1: 0.9-1.0=exacto, 0.7-0.89=muy probable, <0.7=diferente. JSON: [{"itemIndex":N,"itemName":"...","confidence":0.95,"isDuplicate":true,"reason":"...","type":"exact"}]. Solo >= 0.7`,
          cache_control: { type: "ephemeral" } // ⭐ PROMPT CACHING
        }
      ],
      messages: [
        {
          role: "user",
          content: `Nuevo: "${newItem.name}" | Marca: ${newItem.brand||'?'} | Color: ${newItem.color||'?'} | Tipo: ${newItem.type?.name||'?'}

Existentes:
${potentialDuplicates.map((item, index) => `${index + 1}. "${item.name}" | ${item.brand||'?'} | ${item.color||'?'} | ${item.type?.name||'?'} | User: ${item.userName||'?'}`).join('\n')}`
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

      // Store in cache
      analysisCache.set(cacheKey, detectedDuplicates);

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
    // Check cache first
    const cacheData = JSON.stringify({d: duplicateItem.name, c: duplicateItem.color, t: duplicateItem.type?.subcategory, e: eventContext.name});
    const cacheKey = `suggestions:${crypto.default.createHash('md5').update(cacheData).digest('hex')}`;
    const cached = analysisCache.get(cacheKey);
    if (cached) {
      logger.info('Cache HIT - returning cached suggestions');
      return cached;
    }

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

    // COST OPTIMIZATION: Reduced prompt + cache_control
    const response = await claudeClient.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1200, // Reduced from 2500 (50% saving)
      temperature: 0.7,
      system: [
        {
          type: "text",
          text: `Estilista moda. Sugiere 3-5 alternativas DIFERENTES (NO mismo nombre). Tipos:
- Alternativa color: mismo artículo, color diferente
- Variación estilo: artículo diferente, estética similar
- Complementario: combina bien
- Alternativo: diferente pero logra mismo look

Categorías: ${categories.map(c => c.name).join(', ')}
Colores: ${colors.join(', ')}

JSON: [{"type":"...","title":"...","description":"...","item":{"name":"DIFERENTE","category":"...","subcategory":"...","color":"...","style":"..."},"reasoning":"...","searchTerms":[...],"priority":1-5}]`,
          cache_control: { type: "ephemeral" } // ⭐ PROMPT CACHING
        }
      ],
      messages: [
        {
          role: "user",
          content: `Duplicado: "${duplicateItem.name}" | ${duplicateItem.color||'?'} | ${duplicateItem.brand||'?'} | ${duplicateItem.type?.name||'?'}

Guardarropa:
${userOtherItems.length > 0 ? userOtherItems.slice(0,5).map(i => `"${i.name}" ${i.color||''}`).join(', ') : 'vacío'}

Evento: ${eventContext.name||'General'} | ${eventContext.description||''}

Sugiere 3-5 artículos DIFERENTES (NO "${duplicateItem.name}")`
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

      // Store in cache
      analysisCache.set(cacheKey, sortedSuggestions);

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
    // Check cache first (by URL)
    const cacheKey = `scraping:${crypto.default.createHash('md5').update(url).digest('hex')}`;
    const cached = analysisCache.get(cacheKey);
    if (cached) {
      logger.info('Cache HIT - returning cached scraped product');
      return cached;
    }

    if (!claudeClient) {
      claudeClient = initializeClaude();
      if (!claudeClient) {
        throw new Error('Failed to initialize Claude client');
      }
    }

    const categories = getAllCategories();
    const colors = AVAILABLE_COLORS.map(c => c.name);

    // COST OPTIMIZATION: Use Haiku (80% cheaper) for simple HTML extraction
    const response = await claudeClient.messages.create({
      model: "claude-3-haiku-20240307", // 80% cheaper
      max_tokens: 500, // Reduced from 1000
      temperature: 0.2,
      system: [
        {
          type: "text",
          text: `Extrae producto de HTML. Categorías: ${categories.map(c => c.name).join(',')}. Colors: ${colors.join(',')}.
Reglas: vestido/dress/robe=clothes/dresses, zapato/shoe=accessories/shoes, bolso/bag=accessories/bags.
Precio: "45,95€"→45.95, "169,95€"→169.95 (punto decimal). JSON: {"name":"...","imageUrl":"REQUIRED","color":"...","price":45.95,"brand":"...","type":{"category":"...","subcategory":"..."},"description":"..."}`,
          cache_control: { type: "ephemeral" } // ⭐ PROMPT CACHING
        }
      ],
      messages: [
        {
          role: "user",
          content: `URL: ${url}

BasicInfo: ${JSON.stringify(basicInfo)}

HTML: ${html.substring(0, 1000)}`
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

      // Store in cache for 24 hours
      analysisCache.set(cacheKey, result);

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
          model: "claude-3-haiku-20240307",
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
