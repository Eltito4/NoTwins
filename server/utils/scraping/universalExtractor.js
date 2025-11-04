import { load } from 'cheerio';
import { logger } from '../logger.js';
import { findClosestNamedColor } from '../colors/utils.js';
import { detectProductType } from '../categorization/detector.js';
import { interpretScrapedProduct } from '../claude/index.js';
import axios from 'axios';

// Enhanced color detection for Spanish and other languages
const ENHANCED_COLOR_MAPPINGS = {
  // Spanish colors
  'blanco': 'White',
  'negro': 'Black',
  'rojo': 'Red',
  'azul': 'Blue',
  'azul cielo': 'Sky Blue',
  'azul marino': 'Navy Blue',
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
  'lima': 'Green',
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
  'sky blue': 'Sky Blue',
  'light blue': 'Light Blue',
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

// Brand mappings from domains
const BRAND_MAPPINGS = {
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

export async function universalExtract(url) {
  try {
    logger.info('Starting universal extraction for:', { url });

    // Try multiple extraction methods
    const methods = [
      () => extractWithMetaTags(url),
      () => extractWithDirectScraping(url),
      () => extractWithAI(url)
    ];

    let lastError = null;
    
    for (const method of methods) {
      try {
        const result = await method();
        if (result && result.name) {
          logger.info('Universal extraction successful:', {
            method: method.name,
            hasName: !!result.name,
            hasImage: !!result.imageUrl,
            hasPrice: !!result.price,
            hasColor: !!result.color,
            hasBrand: !!result.brand,
            hasType: !!result.type
          });
          return result;
        }
      } catch (error) {
        lastError = error;
        logger.warn(`Universal extraction method failed:`, error.message);
        continue;
      }
    }

    throw lastError || new Error('All universal extraction methods failed');
  } catch (error) {
    logger.error('Universal extraction error:', error);
    throw error;
  }
}

async function extractWithMetaTags(url) {
  logger.debug('Trying universal meta tags extraction');
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache'
      },
      timeout: 15000
    });

    const $ = load(response.data);
    
    // Extract basic info from meta tags and page content
    const name = extractName($, url);
    const imageUrl = extractImageUrl($, url);
    const price = extractPrice($, url);
    const description = extractDescription($, url);
    const color = extractColor($, url, name, description);
    const brand = extractBrand($, url);
    const type = detectProductType(name + ' ' + (description || '') + ' ' + url);

    if (name) {
      const result = {
        name: name.trim(),
        imageUrl: imageUrl || generatePlaceholderImage(name.trim()),
        price: price,
        description: description?.trim(),
        color: color,
        brand: brand,
        type: type
      };
      
      logger.debug('Universal meta tags extraction result:', result);
      return result;
    }
    
    throw new Error('Could not extract product name');
  } catch (error) {
    throw new Error(`Universal meta tags extraction failed: ${error.message}`);
  }
}

async function extractWithDirectScraping(url) {
  logger.debug('Trying universal direct scraping');
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache'
      },
      timeout: 15000
    });

    const $ = load(response.data);
    
    // Use comprehensive selectors for all retailers
    const name = extractWithSelectors($, [
      'h1',
      '.product-title',
      '.product-name',
      '.product-detail-info h1',
      '.pdp-title',
      '[data-testid*="title"]',
      '[data-testid*="name"]',
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      'title'
    ]);

    const imageUrl = extractImageWithSelectors($, [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      '.product-image img',
      '.gallery-image img',
      '.pdp-image img',
      '.media-image img',
      '.product-detail-image img',
      '[data-testid*="image"] img',
      'img[src*="product"]',
      'picture img'
    ], url);

    const priceText = extractWithSelectors($, [
      'meta[property="product:price:amount"]',
      '.price',
      '.product-price',
      '.current-price',
      '.price-current',
      '.money-amount',
      '[data-testid*="price"]',
      '[itemprop="price"]'
    ]);

    const description = extractWithSelectors($, [
      'meta[property="og:description"]',
      'meta[name="description"]',
      '.product-description',
      '.description',
      '[data-testid*="description"]'
    ]);

    if (name) {
      const color = extractColor($, url, name, description);
      const brand = extractBrand($, url);
      const type = detectProductType(name + ' ' + (description || '') + ' ' + url);

      return {
        name: name.trim(),
        imageUrl: imageUrl || generatePlaceholderImage(name.trim()),
        price: normalizePrice(priceText),
        description: description?.trim(),
        color: color,
        brand: brand,
        type: type
      };
    }
    
    throw new Error('Could not extract product name from direct scraping');
  } catch (error) {
    throw new Error(`Universal direct scraping failed: ${error.message}`);
  }
}

async function extractWithAI(url) {
  logger.debug('Trying universal AI extraction');
  
  try {
    const enhancedInfo = await interpretScrapedProduct({
      html: '',
      basicInfo: { name: null, imageUrl: null },
      url
    });
    
    if (enhancedInfo && enhancedInfo.name) {
      const imageUrl = enhancedInfo.imageUrl || generatePlaceholderImage(enhancedInfo.name);
      
      return {
        name: enhancedInfo.name,
        imageUrl: imageUrl,
        color: findClosestNamedColor(enhancedInfo.color),
        price: normalizePrice(enhancedInfo.price),
        brand: enhancedInfo.brand || extractBrandFromUrl(url),
        description: enhancedInfo.description || url,
        type: enhancedInfo.type || detectProductType(enhancedInfo.name)
      };
    }
    
    throw new Error('AI could not generate product information');
  } catch (error) {
    throw new Error(`Universal AI extraction failed: ${error.message}`);
  }
}

// Helper functions
function extractName($, url) {
  // Try meta tags first
  let name = $('meta[property="og:title"]').attr('content') ||
            $('meta[name="twitter:title"]').attr('content') ||
            $('title').text();

  // Clean up the name
  if (name) {
    name = name.split('|')[0].split('-')[0].trim();
    return name;
  }

  // Try common selectors
  const selectors = [
    'h1',
    '.product-title',
    '.product-name',
    '.product-detail-info h1',
    '.pdp-title'
  ];

  for (const selector of selectors) {
    const element = $(selector);
    if (element.length) {
      const text = element.text().trim();
      if (text) return text;
    }
  }

  return null;
}

function extractImageUrl($, url) {
  const selectors = [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'meta[property="product:image"]',
    'link[rel="image_src"]',
    '.product-image img',
    '.gallery-image img',
    '.pdp-image img',
    '.media-image img',
    '.product-gallery img',
    '.hero-image img',
    '.main-image img',
    '[data-testid*="image"] img',
    '.swiper-slide img',
    '.carousel img',
    'img[src*="product"]',
    'img[src*="item"]',
    'img[alt*="product"]',
    'picture img'
  ];

  for (const selector of selectors) {
    const element = $(selector);
    if (element.length) {
      const src = element.attr('content') || 
                 element.attr('src') || 
                 element.attr('data-src') ||
                 element.attr('data-lazy') ||
                 element.attr('data-original') ||
                 element.attr('srcset')?.split(',')[0]?.split(' ')[0];
      if (src) {
        return makeAbsoluteUrl(src, url);
      }
    }
  }

  return null;
}

function extractPrice($, url) {
  const selectors = [
    'meta[property="product:price:amount"]',
    'meta[property="product:price"]',
    'meta[name="price"]',
    '[data-testid*="price"]',
    '[data-price]',
    '.price',
    '.product-price',
    '.current-price',
    '.price-current',
    '.final-price',
    '.sale-price',
    '.regular-price',
    '.money',
    '.amount',
    '.cost',
    '.precio',
    '[class*="price"]',
    '[id*="price"]',
    'span:contains("€")',
    'span:contains("$")',
    'div:contains("€")',
    'div:contains("$")'
  ];

  for (const selector of selectors) {
    const element = $(selector);
    if (element.length) {
      const content = element.attr('content') || 
                     element.attr('data-price') ||
                     element.text().trim();
      if (content) {
        const price = normalizePrice(content);
        if (price) return price;
      }
    }
  }

  // Try to find price in JSON-LD structured data
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const data = JSON.parse($(scripts[i]).html());
      if (data.offers && data.offers.price) {
        const price = normalizePrice(data.offers.price);
        if (price) return price;
      }
      if (data.price) {
        const price = normalizePrice(data.price);
        if (price) return price;
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

function extractDescription($, url) {
  return $('meta[property="og:description"]').attr('content') ||
         $('meta[name="description"]').attr('content') ||
         $('.product-description').text().trim() ||
         null;
}

function extractColor($, url, name = '', description = '') {
  const text = (url + ' ' + name + ' ' + description).toLowerCase();
  
  // Check for colors in the combined text
  
  // Special handling for specific product names
  if (name && name.toLowerCase().includes('cassia')) {
    if (text.includes('navy') || text.includes('marino')) {
      return 'Navy Blue';
    }
  }
  
  if (name && name.toLowerCase().includes('ambar')) {
    if (text.includes('granate') || text.includes('burgundy')) {
      return 'Burgundy';
    }
    if (text.includes('amarillo') || text.includes('yellow')) {
      return 'Yellow';
    }
  }
  
  // Enhanced color detection from URL
  const urlColor = extractColorFromUrl(url);
  if (urlColor) return urlColor;
  
  for (const [key, value] of Object.entries(ENHANCED_COLOR_MAPPINGS)) {
    if (text.includes(key.toLowerCase())) {
      return value;
    }
  }

  return null;
}

function extractColorFromUrl(url) {
  const colorMappings = {
    'navy': 'Navy Blue',
    'azul-marino': 'Navy Blue',
    'granate': 'Burgundy',
    'burgundy': 'Burgundy',
    'amarillo': 'Yellow',
    'yellow': 'Yellow',
    'ambar': 'Amber',
    'amber': 'Amber'
  };
  
  const lowerUrl = url.toLowerCase();
  for (const [key, value] of Object.entries(colorMappings)) {
    if (lowerUrl.includes(key)) {
      return value;
    }
  }
  return null;
}

function extractBrand($, url) {
  // Try meta tags first
  let brand = $('meta[property="og:site_name"]').attr('content') ||
             $('meta[property="product:brand"]').attr('content');

  if (brand) return brand;

  // Try domain mapping
  return extractBrandFromUrl(url);
}

function extractBrandFromUrl(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    
    for (const [domain, brand] of Object.entries(BRAND_MAPPINGS)) {
      if (hostname.includes(domain)) {
        return brand;
      }
    }
    
    // Extract brand from domain name
    const domainParts = hostname.split('.');
    if (domainParts.length > 0) {
      return domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

function extractWithSelectors($, selectors) {
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

function extractImageWithSelectors($, selectors, baseUrl) {
  for (const selector of selectors) {
    try {
      const element = $(selector);
      if (element.length) {
        const url = element.attr('content') || 
                   element.attr('src') || 
                   element.attr('data-src');
        
        if (url) return makeAbsoluteUrl(url, baseUrl);
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}

function normalizePrice(priceText) {
  if (!priceText) return null;

  try {
    let normalized = priceText.toString()
      .replace(/[^\d.,]/g, '')
      .trim();
    
    if (normalized.includes(',')) {
      if (normalized.includes('.') && normalized.includes(',')) {
        normalized = normalized.replace(/\./g, '').replace(',', '.');
      } else {
        normalized = normalized.replace(',', '.');
      }
    }
    
    const price = parseFloat(normalized);
    return isNaN(price) ? null : price;
  } catch (error) {
    return null;
  }
}

function makeAbsoluteUrl(url, baseUrl = '') {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  
  try {
    // Handle protocol-relative URLs
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    
    // Handle relative URLs
    if (!url.startsWith('http')) {
      const base = baseUrl || 'https://example.com';
      return new URL(url, base).toString();
    }
    
    // Ensure HTTPS and handle special cases
    let cleanUrl = url.replace(/^http:/, 'https:');
    
    // For Zara images, ensure proper format
    if (cleanUrl.includes('zara.net') || cleanUrl.includes('zara.com')) {
      // Zara images often need specific parameters
      if (!cleanUrl.includes('?')) {
        cleanUrl += '?ts=' + Date.now();
      }
    }
    
    return cleanUrl;
  } catch (error) {
    logger.warn('URL processing error:', { url, baseUrl, error: error.message });
    return null;
  }
}

function generatePlaceholderImage(productName) {
  const encodedName = encodeURIComponent(productName);
  return `https://via.placeholder.com/400x400/CCCCCC/666666?text=${encodedName}`;
}