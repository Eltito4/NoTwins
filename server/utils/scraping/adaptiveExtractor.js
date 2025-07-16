import { load } from 'cheerio';
import { logger } from '../logger.js';
import { scrapeWithScraperApi } from './scraperApi.js';
import { interpretScrapedProduct } from '../vision/deepseek.js';
import { findClosestNamedColor } from '../colors/utils.js';
import { detectProductType } from '../categorization/detector.js';
import { universalExtract } from './universalExtractor.js';
import axios from 'axios';

export async function adaptiveExtract(url, retailerConfig) {
  try {
    logger.info('Starting adaptive extraction for:', { url, retailer: retailerConfig.name });

    // Try universal extraction first (works for any retailer)
    const extractionMethods = [
      () => universalExtract(url),
      () => extractWithMetaTags(url),
      () => extractWithScraperApi(url, retailerConfig),
      () => extractWithDirectRequest(url, retailerConfig),
      () => extractWithAI(url, retailerConfig)
    ];

    let lastError = null;
    
    for (const method of extractionMethods) {
      try {
        const result = await method();
        if (result && result.name) {
          logger.info('Successfully extracted product data:', { 
            method: method.name, 
            hasName: !!result.name,
            hasImage: !!result.imageUrl,
            hasPrice: !!result.price,
            hasColor: !!result.color
          });
          return result;
        }
      } catch (error) {
        lastError = error;
        logger.warn(`Extraction method ${method.name} failed:`, error.message);
        continue;
      }
    }

    throw lastError || new Error('All extraction methods failed');
  } catch (error) {
    logger.error('Adaptive extraction error:', {
      message: error.message,
      url,
      retailer: retailerConfig.name
    });
    throw error;
  }
}

async function extractWithMetaTags(url) {
  logger.debug('Trying meta tags extraction');
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache'
      },
      timeout: 10000
    });

    const $ = load(response.data);
    
    // Extract from meta tags (most reliable)
    const name = $('meta[property="og:title"]').attr('content') ||
                $('meta[name="twitter:title"]').attr('content') ||
                $('title').text();
                
    const imageUrl = $('meta[property="og:image"]').attr('content') ||
                    $('meta[name="twitter:image"]').attr('content');
                    
    const price = extractPriceFromMeta($);
    const description = $('meta[property="og:description"]').attr('content') ||
                       $('meta[name="description"]').attr('content');

    // Enhanced color extraction from URL, title, and description
    const colorText = (url + ' ' + (name || '') + ' ' + (description || '')).toLowerCase();
    const color = findColorInText(colorText);
    
    // Enhanced brand extraction
    const brand = $('meta[property="og:site_name"]').attr('content') ||
                 $('meta[property="product:brand"]').attr('content') ||
                 extractBrandFromUrl(url);

    // Enhanced product type detection
    const productText = (name || '') + ' ' + (description || '') + ' ' + url;
    const type = detectProductType(productText);

    logger.debug('Meta tags extraction details:', {
      name,
      imageUrl,
      price,
      color,
      brand,
      type,
      url
    });

    if (name && imageUrl) {
      const result = {
        name: name.trim(),
        imageUrl: imageUrl ? makeAbsoluteUrl(imageUrl, url) : null,
        price: price,
        description: description?.trim(),
        color: color,
        brand: brand,
        type: type
      };
      
      logger.debug('Meta tags extraction result:', result);
      return result;
    }
    
    throw new Error('Required meta tags not found');
  } catch (error) {
    throw new Error(`Meta tags extraction failed: ${error.message}`);
  }
}

async function extractWithScraperApi(url, retailerConfig) {
  logger.debug('Trying ScraperAPI extraction');
  
  try {
    const { html } = await scrapeWithScraperApi(url);
    const $ = load(html);
    
    const basicInfo = extractBasicInfo($, retailerConfig);
    
    // Enhanced extraction for Zara specifically
    if (url.includes('zara.com')) {
      // Try to extract image from JSON-LD or data attributes
      const scripts = $('script[type="application/ld+json"]');
      for (let i = 0; i < scripts.length; i++) {
        try {
          const data = JSON.parse($(scripts[i]).html());
          if (data.image) {
            basicInfo.imageUrl = Array.isArray(data.image) ? data.image[0] : data.image;
          }
          if (data.offers && data.offers.price) {
            basicInfo.price = parseFloat(data.offers.price);
          }
        } catch (e) {
          continue;
        }
      }
      
      // Try additional Zara-specific selectors
      if (!basicInfo.imageUrl) {
        const imgSelectors = [
          'picture.media-image img',
          '.product-detail-images img',
          '.media-image img',
          'img[data-qa-anchor="product-image"]'
        ];
        
        for (const selector of imgSelectors) {
          const img = $(selector).first();
          if (img.length) {
            const src = img.attr('src') || img.attr('data-src');
            if (src) {
              basicInfo.imageUrl = makeAbsoluteUrl(src, url);
              break;
            }
          }
        }
      }
      
      // Try to extract price from various selectors
      if (!basicInfo.price) {
        const priceSelectors = [
          '.price .money-amount__main',
          '.price__amount',
          '[data-qa-anchor="product-price"]',
          '.product-detail-info__price'
        ];
        
        for (const selector of priceSelectors) {
          const priceEl = $(selector).first();
          if (priceEl.length) {
            const priceText = priceEl.text().trim();
            const price = normalizePrice(priceText);
            if (price) {
              basicInfo.price = price;
              break;
            }
          }
        }
      }
      
      // Try to extract color
      if (!basicInfo.color) {
        const colorSelectors = [
          '.product-detail-selected-color',
          '.color-name',
          '[data-qa-anchor="product-color"]'
        ];
        
        for (const selector of colorSelectors) {
          const colorEl = $(selector).first();
          if (colorEl.length) {
            const colorText = colorEl.text().trim();
            if (colorText) {
              basicInfo.color = colorText;
              break;
            }
          }
        }
      }
    }
    
    // Enhanced extraction for specific brands
    if (url.includes('bimani.com')) {
      // BIMANI specific extraction
      if (!basicInfo.color) {
        // Extract color from URL and product name
        const urlColor = extractColorFromUrl(url);
        const nameColor = extractColorFromText(basicInfo.name);
        basicInfo.color = urlColor || nameColor;
      }
      
      // Fix price format for BIMANI
      if (!basicInfo.price) {
        const priceSelectors = [
          '.price-value',
          '.product-price .price',
          '[data-price]',
          '.money'
        ];
        
        for (const selector of priceSelectors) {
          const priceEl = $(selector).first();
          if (priceEl.length) {
            const priceText = priceEl.text().trim();
            const price = normalizePrice(priceText);
            if (price) {
              basicInfo.price = price;
              break;
            }
          }
        }
      }
    }
    
    if (url.includes('miphai.com')) {
      // MIPHAI specific extraction
      if (!basicInfo.color) {
        // Extract color from URL and product name
        const urlColor = extractColorFromUrl(url);
        const nameColor = extractColorFromText(basicInfo.name);
        basicInfo.color = urlColor || nameColor;
      }
    }
    
    if (url.includes('mariquitatrasquila.com')) {
      // MARIQUITA TRASQUILA specific extraction
      if (!basicInfo.imageUrl) {
        const imgSelectors = [
          '.product-image-main img',
          '.product-gallery img',
          '.featured-image img',
          'img[alt*="vestido"]',
          'img[alt*="dress"]'
        ];
        
        for (const selector of imgSelectors) {
          const img = $(selector).first();
          if (img.length) {
            const src = img.attr('src') || img.attr('data-src');
            if (src) {
              basicInfo.imageUrl = makeAbsoluteUrl(src, url);
              break;
            }
          }
        }
      }
    }
    
    if (url.includes('matildecano.es')) {
      // MATILDE CANO specific extraction
      if (!basicInfo.imageUrl) {
        const imgSelectors = [
          '.product-image img',
          '.main-image img',
          '.hero-image img',
          'img[src*="vestido"]'
        ];
        
        for (const selector of imgSelectors) {
          const img = $(selector).first();
          if (img.length) {
            const src = img.attr('src') || img.attr('data-src');
            if (src) {
              basicInfo.imageUrl = makeAbsoluteUrl(src, url);
              break;
            }
          }
        }
      }
    }
    
    if (basicInfo.name && basicInfo.imageUrl) {
      // Try to enhance with AI if available
      try {
        const enhancedInfo = await interpretScrapedProduct({
          html,
          basicInfo,
          url
        });
        
        return {
          name: enhancedInfo.name || basicInfo.name,
          imageUrl: enhancedInfo.imageUrl || basicInfo.imageUrl,
          color: findClosestNamedColor(enhancedInfo.color || basicInfo.color),
          price: normalizePrice(enhancedInfo.price || basicInfo.price),
          brand: enhancedInfo.brand || basicInfo.brand || retailerConfig.brand?.defaultValue,
          description: enhancedInfo.description || basicInfo.description || url,
          type: enhancedInfo.type || detectProductType(basicInfo.name)
        };
      } catch (aiError) {
        logger.warn('AI enhancement failed, using basic info:', aiError.message);
        return {
          ...basicInfo,
          color: findClosestNamedColor(basicInfo.color),
          type: detectProductType(basicInfo.name),
          brand: basicInfo.brand || retailerConfig.brand?.defaultValue
        };
      }
    }
    
    throw new Error('Could not extract required information from ScraperAPI response');
  } catch (error) {
    throw new Error(`ScraperAPI extraction failed: ${error.message}`);
  }
}

async function extractWithDirectRequest(url, retailerConfig) {
  logger.debug('Trying direct request extraction');
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 15000,
      maxRedirects: 5
    });

    const $ = load(response.data);
    const basicInfo = extractBasicInfo($, retailerConfig);
    
    if (basicInfo.name && basicInfo.imageUrl) {
      return {
        ...basicInfo,
        color: findClosestNamedColor(basicInfo.color),
        type: detectProductType(basicInfo.name),
        brand: basicInfo.brand || retailerConfig.brand?.defaultValue
      };
    }
    
    throw new Error('Could not extract required information from direct request');
  } catch (error) {
    throw new Error(`Direct request extraction failed: ${error.message}`);
  }
}

async function extractWithAI(url, retailerConfig) {
  logger.debug('Trying AI-only extraction');
  
  try {
    // Use AI to generate product info based on URL
    const enhancedInfo = await interpretScrapedProduct({
      html: '',
      basicInfo: { name: null, imageUrl: null },
      url
    });
    
    if (enhancedInfo && enhancedInfo.name) {
      // For AI extraction, we can use a placeholder image or make it optional
      const imageUrl = enhancedInfo.imageUrl || generatePlaceholderImage(enhancedInfo.name);
      
      return {
        name: enhancedInfo.name,
        imageUrl: imageUrl,
        color: findClosestNamedColor(enhancedInfo.color),
        price: normalizePrice(enhancedInfo.price),
        brand: enhancedInfo.brand || retailerConfig.brand?.defaultValue,
        description: enhancedInfo.description || url,
        type: enhancedInfo.type || detectProductType(enhancedInfo.name)
      };
    }
    
    throw new Error('AI could not generate product information');
  } catch (error) {
    throw new Error(`AI extraction failed: ${error.message}`);
  }
}

function generatePlaceholderImage(productName) {
  // Generate a placeholder image URL based on the product name
  const encodedName = encodeURIComponent(productName);
  return `https://via.placeholder.com/400x400/CCCCCC/666666?text=${encodedName}`;
}
function extractBasicInfo($, retailerConfig) {
  const info = {
    name: null,
    imageUrl: null,
    color: null,
    price: null,
    brand: null,
    description: null
  };

  // Extract using multiple selector strategies
  info.name = extractText($, [
    ...retailerConfig.selectors.name,
    'h1',
    '.product-title',
    '.product-name',
    '[data-testid*="title"]',
    '[data-testid*="name"]'
  ]);

  info.imageUrl = extractImageUrl($, [
    ...retailerConfig.selectors.image,
    'img[src*="product"]',
    '.product-image img',
    '.gallery img',
    '[data-testid*="image"] img'
  ]);

  info.color = extractText($, [
    ...retailerConfig.selectors.color,
    '.color-name',
    '.selected-color',
    '[data-testid*="color"]'
  ]);

  info.brand = extractText($, [
    ...retailerConfig.selectors.brand,
    '.brand',
    '.designer',
    '[data-testid*="brand"]'
  ]);

  const priceText = extractText($, [
    ...retailerConfig.selectors.price,
    '.price',
    '.cost',
    '[data-testid*="price"]'
  ]);
  
  if (priceText) {
    info.price = normalizePrice(priceText);
  }

  info.description = extractText($, [
    '.description',
    '.product-description',
    '[data-testid*="description"]'
  ]);

  return info;
}

function extractText($, selectors) {
  for (const selector of selectors) {
    try {
      const element = $(selector);
      if (element.length) {
        const content = element.attr('content');
        if (content) return content.trim();

        const text = element.text().trim();
        if (text) return text;
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}

function extractImageUrl($, selectors) {
  for (const selector of selectors) {
    try {
      const element = $(selector);
      if (element.length) {
        const url = element.attr('content') || 
                   element.attr('src') || 
                   element.attr('data-src') ||
                   element.attr('data-zoom-image') ||
                   element.attr('data-lazy') ||
                   element.attr('data-original') ||
                   element.attr('data-large') ||
                   element.attr('data-full') ||
                   element.attr('srcset')?.split(',')[0]?.split(' ')[0];
        
        if (url) return makeAbsoluteUrl(url);
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}

function extractPriceFromMeta($) {
  const priceSelectors = [
    'meta[property="product:price:amount"]',
    'meta[property="og:price:amount"]',
    'meta[name="price"]'
  ];
  
  for (const selector of priceSelectors) {
    const content = $(selector).attr('content');
    if (content) {
      const price = normalizePrice(content);
      if (price) return price;
    }
  }
  return null;
}

function extractBrandFromUrl(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    
    // Common brand mappings from domain names
    const brandMappings = {
      'bimbaylola.com': 'Bimba y Lola',
      'zara.com': 'Zara',
      'hm.com': 'H&M',
      'mango.com': 'Mango',
      'massimodutti.com': 'Massimo Dutti',
      'cos.com': 'COS',
      'asos.com': 'ASOS',
      'pullandbear.com': 'Pull & Bear',
      'bershka.com': 'Bershka',
      'stradivarius.com': 'Stradivarius',
      'oysho.com': 'Oysho',
      'uterque.com': 'Uterque'
    };
    
    for (const [domain, brand] of Object.entries(brandMappings)) {
      if (hostname.includes(domain)) {
        return brand;
      }
    }
    
    // Extract brand from domain name (e.g., "example.com" -> "Example")
    const domainParts = hostname.replace('www.', '').split('.');
    if (domainParts.length > 0) {
      return domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

function extractColorFromUrl(url) {
  const colorMappings = {
    'navy': 'Navy Blue',
    'azul-marino': 'Navy Blue',
    'granate': 'Burgundy',
    'burgundy': 'Burgundy',
    'amarillo': 'Yellow',
    'yellow': 'Yellow',
    'negro': 'Black',
    'black': 'Black',
    'blanco': 'White',
    'white': 'White',
    'rojo': 'Red',
    'red': 'Red',
    'verde': 'Green',
    'green': 'Green',
    'rosa': 'Pink',
    'pink': 'Pink',
    'morado': 'Purple',
    'purple': 'Purple'
  };
  
  const lowerUrl = url.toLowerCase();
  for (const [key, value] of Object.entries(colorMappings)) {
    if (lowerUrl.includes(key)) {
      return value;
    }
  }
  return null;
}

function extractColorFromText(text) {
  if (!text) return null;
  
  const colorMappings = {
    'navy': 'Navy Blue',
    'marino': 'Navy Blue',
    'granate': 'Burgundy',
    'burgundy': 'Burgundy',
    'amarillo': 'Yellow',
    'yellow': 'Yellow',
    'ambar': 'Amber',
    'amber': 'Amber',
    'cassia': 'Navy Blue', // CASSIA is often navy
    'negro': 'Black',
    'black': 'Black',
    'blanco': 'White',
    'white': 'White'
  };
  
  const lowerText = text.toLowerCase();
  for (const [key, value] of Object.entries(colorMappings)) {
    if (lowerText.includes(key)) {
      return value;
    }
  }
  return null;
}

function findColorInText(text) {
  if (!text) return null;
  
  const lowerText = text.toLowerCase();
  
  // Enhanced Spanish and English color mappings
  const colorMappings = {
    // Spanish colors
    'blanco': 'White',
    'negro': 'Black',
    'rojo': 'Red',
    'azul': 'Blue',
    'verde': 'Green',
    'amarillo': 'Yellow',
    'rosa': 'Pink',
    'morado': 'Purple',
    'naranja': 'Orange',
    'marrón': 'Brown',
    'gris': 'Gray',
    'beige': 'Beige',
    'crema': 'Cream',
    'dorado': 'Gold',
    'plateado': 'Silver',
    'marino': 'Navy Blue',
    'kiwi': 'Green',
    'coral': 'Coral',
    'turquesa': 'Turquoise',
    'lavanda': 'Lavender',
    'fucsia': 'Hot Pink',
    'burdeos': 'Burgundy',
    'granate': 'Maroon',
    'camel': 'Beige',
    'mostaza': 'Yellow',
    'oliva': 'Olive',
    'caqui': 'Khaki',
    // English colors
    'white': 'White',
    'black': 'Black',
    'red': 'Red',
    'blue': 'Blue',
    'green': 'Green',
    'yellow': 'Yellow',
    'pink': 'Pink',
    'purple': 'Purple',
    'orange': 'Orange',
    'brown': 'Brown',
    'gray': 'Gray',
    'grey': 'Gray',
    'beige': 'Beige',
    'cream': 'Cream',
    'gold': 'Gold',
    'silver': 'Silver',
    'navy': 'Navy Blue',
    'coral': 'Coral',
    'turquoise': 'Turquoise',
    'lavender': 'Lavender',
    'fuchsia': 'Hot Pink',
    'burgundy': 'Burgundy',
    'maroon': 'Maroon',
    'camel': 'Beige',
    'mustard': 'Yellow',
    'olive': 'Olive',
    'khaki': 'Khaki'
  };
  
  // Check for exact color matches first
  for (const [key, value] of Object.entries(colorMappings)) {
    if (lowerText.includes(key)) {
      return value;
    }
  }
  
  return null;
}

function makeAbsoluteUrl(url, baseUrl = '') {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  
  try {
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    
    if (!url.startsWith('http')) {
      return new URL(url, baseUrl || 'https://').toString();
    }
    
    return url.replace(/^http:/, 'https:');
  } catch (error) {
    return null;
  }
}

function normalizePrice(priceText) {
  if (!priceText) return null;

  try {
    // Handle different price formats
    let normalized = priceText.toString()
      .replace(/[^\d.,]/g, '')
      .trim();
    
    // Handle European format (e.g., "45,95" or "1.234,95")
    if (normalized.includes(',')) {
      // If there's both comma and dot, assume dot is thousands separator
      if (normalized.includes('.') && normalized.includes(',')) {
        normalized = normalized.replace(/\./g, '').replace(',', '.');
      } else {
        // Just comma, assume it's decimal separator
        normalized = normalized.replace(',', '.');
      }
    }
    
    // Remove any remaining non-digit characters except the last dot
    const parts = normalized.split('.');
    if (parts.length > 2) {
      // Multiple dots, keep only the last one as decimal
      const lastPart = parts.pop();
      normalized = parts.join('') + '.' + lastPart;
    }

    const price = parseFloat(normalized);
    return isNaN(price) ? null : price;
  } catch (error) {
    return null;
  }
}