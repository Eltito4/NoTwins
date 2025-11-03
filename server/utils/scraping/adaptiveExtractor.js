import { load } from 'cheerio';
import { logger } from '../logger.js';
import { scrapeWithScraperApi } from './scraperApi.js';
import { findClosestNamedColor } from '../colors/utils.js';
import { detectProductType } from '../categorization/detector.js';
import { interpretScrapedProduct } from '../vision/deepseek.js'; // DeepSeek for scraping

export async function adaptiveExtract(url, retailerConfig) {
  try {
    logger.info('Starting adaptive extraction for:', { 
      url, 
      retailer: retailerConfig.name,
      hasScraperKey: !!process.env.SCRAPER_API_KEY,
      hasDeepSeekKey: !!process.env.DEEPSEEK_API_KEY
    });

    // PRIORITY 1: ScraperAPI + DeepSeek AI (most reliable)
    try {
      logger.debug('Using ScraperAPI + DeepSeek extraction');
      const result = await extractWithScraperApiAndDeepSeek(url, retailerConfig);
      if (result && result.name && result.imageUrl) {
        logger.info('ScraperAPI + DeepSeek extraction successful:', { 
          hasName: !!result.name,
          hasImage: !!result.imageUrl,
          hasPrice: !!result.price,
          hasColor: !!result.color
        });
        return result;
      }
    } catch (error) {
      logger.error('ScraperAPI + DeepSeek extraction failed:', {
        error: error.message,
        stack: error.stack
      });
    }

    // PRIORITY 2: Direct request + DeepSeek AI
    try {
      logger.debug('Trying direct request + DeepSeek extraction');
      const result = await extractWithDirectRequestAndDeepSeek(url, retailerConfig);
      if (result && result.name) {
        logger.info('Direct request + DeepSeek extraction successful');
        return result;
      }
    } catch (error) {
      logger.error('Direct request + DeepSeek extraction failed:', error.message);
    }

    // PRIORITY 3: Basic extraction with manual parsing
    try {
      logger.debug('Trying basic extraction with manual parsing');
      const result = await extractBasicWithManualParsing(url, retailerConfig);
      if (result && result.name) {
        logger.info('Basic extraction successful');
        return result;
      }
    } catch (error) {
      logger.error('Basic extraction failed:', error.message);
    }

    throw new Error('All extraction methods failed');
  } catch (error) {
    logger.error('Adaptive extraction error:', {
      message: error.message,
      url,
      retailer: retailerConfig.name
    });
    throw error;
  }
}

async function extractWithScraperApiAndDeepSeek(url, retailerConfig) {
  try {
    if (!process.env.SCRAPER_API_KEY) {
      throw new Error('SCRAPER_API_KEY not configured');
    }

    const { html } = await scrapeWithScraperApi(url);
    
    if (!html || html.length < 1000) {
      throw new Error('ScraperAPI returned insufficient HTML content');
    }
    
    logger.debug('ScraperAPI HTML received:', {
      htmlLength: html.length,
      hasTitle: html.includes('<title'),
      hasImages: html.includes('<img'),
      hasProduct: html.toLowerCase().includes('product'),
      titleContent: html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || 'No title found'
    });
    
    const $ = load(html);
    
    // Extract basic info first
    const basicInfo = extractBasicInfo($, retailerConfig, url);
    
    logger.debug('Basic info extracted:', {
      hasName: !!basicInfo.name,
      hasImage: !!basicInfo.imageUrl,
      hasPrice: !!basicInfo.price,
      name: basicInfo.name?.substring(0, 50),
      imageUrl: basicInfo.imageUrl?.substring(0, 100)
    });
    
    // Use DeepSeek AI to enhance the extracted data
    try {
      logger.debug('Enhancing with DeepSeek AI...');
      const enhancedData = await interpretScrapedProduct({
        html: html.substring(0, 3000), // Send first 3000 chars to DeepSeek
        basicInfo,
        url
      });
      
      logger.debug('DeepSeek enhancement completed:', {
        hasName: !!enhancedData.name,
        hasImage: !!enhancedData.imageUrl,
        hasPrice: !!enhancedData.price,
        hasColor: !!enhancedData.color,
        hasType: !!enhancedData.type
      });
      
      // Merge enhanced data with basic info
      const finalData = {
        name: enhancedData.name || basicInfo.name,
        imageUrl: enhancedData.imageUrl || basicInfo.imageUrl,
        color: enhancedData.color || findClosestNamedColor(basicInfo.color),
        price: enhancedData.price || normalizePrice(basicInfo.price),
        brand: enhancedData.brand || basicInfo.brand || retailerConfig.brand?.defaultValue,
        description: enhancedData.description || basicInfo.description,
        type: enhancedData.type || detectProductType(enhancedData.name || basicInfo.name)
      };
      
      if (finalData.name && finalData.imageUrl) {
        return finalData;
      }
    } catch (deepseekError) {
      logger.warn('DeepSeek enhancement failed, using basic extraction:', deepseekError.message);
    }
    
    // Fallback to manual enhancement if DeepSeek fails
    enhanceForSpecificRetailers($, url, basicInfo);
    
    if (basicInfo.name) {
      return {
        name: basicInfo.name,
        imageUrl: basicInfo.imageUrl,
        color: findClosestNamedColor(basicInfo.color),
        price: normalizePrice(basicInfo.price),
        brand: basicInfo.brand || retailerConfig.brand?.defaultValue,
        description: basicInfo.description,
        type: detectProductType(basicInfo.name)
      };
    }
    
    throw new Error('Could not extract required information from ScraperAPI response');
  } catch (error) {
    logger.error('ScraperAPI + DeepSeek extraction error:', {
      error: error.message,
      stack: error.stack,
      url,
      hasKey: !!process.env.SCRAPER_API_KEY
    });
    throw new Error(`ScraperAPI + DeepSeek extraction failed: ${error.message}`);
  }
}

async function extractWithDirectRequestAndDeepSeek(url, retailerConfig) {
  try {
    const axios = (await import('axios')).default;
    const https = (await import('https')).default;
    
    logger.debug('Making direct request to:', url);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache'
      },
      timeout: 15000,
      maxRedirects: 5,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
        secureOptions: require('constants').SSL_OP_LEGACY_SERVER_CONNECT
      })
    });

    logger.debug('Direct request response:', {
      status: response.status,
      contentLength: response.data?.length || 0,
      contentType: response.headers['content-type']
    });

    const $ = load(response.data);
    const basicInfo = extractBasicInfo($, retailerConfig, url);
    
    // Use DeepSeek to enhance
    try {
      const enhancedData = await interpretScrapedProduct({
        html: response.data.substring(0, 3000),
        basicInfo,
        url
      });
      
      return {
        name: enhancedData.name || basicInfo.name,
        imageUrl: enhancedData.imageUrl || basicInfo.imageUrl,
        color: enhancedData.color || findClosestNamedColor(basicInfo.color),
        price: enhancedData.price || normalizePrice(basicInfo.price),
        brand: enhancedData.brand || basicInfo.brand || retailerConfig.brand?.defaultValue,
        description: enhancedData.description || basicInfo.description,
        type: enhancedData.type || detectProductType(enhancedData.name || basicInfo.name)
      };
    } catch (deepseekError) {
      logger.warn('DeepSeek enhancement failed in direct request:', deepseekError.message);
      
      // Fallback to manual enhancement
      enhanceForSpecificRetailers($, url, basicInfo);
      
      if (basicInfo.name) {
        return {
          ...basicInfo,
          color: findClosestNamedColor(basicInfo.color),
          type: detectProductType(basicInfo.name),
          brand: basicInfo.brand || retailerConfig.brand?.defaultValue
        };
      }
    }
    
    throw new Error('Could not extract required information from direct request');
  } catch (error) {
    logger.error('Direct request + DeepSeek error:', {
      error: error.message,
      stack: error.stack,
      url,
      isTimeout: error.code === 'ECONNABORTED',
      isNetworkError: error.code === 'ENOTFOUND',
      isSSLError: error.message.includes('SSL') || error.message.includes('EPROTO')
    });
    throw new Error(`Direct request + DeepSeek extraction failed: ${error.message}`);
  }
}

async function extractBasicWithManualParsing(url, retailerConfig) {
  try {
    const axios = (await import('axios')).default;
    const https = (await import('https')).default;
    
    // Try with minimal headers and SSL fixes
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      },
      timeout: 10000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    const $ = load(response.data);
    
    // Manual parsing for common patterns
    const name = $('meta[property="og:title"]').attr('content') || 
                 $('title').text() || 
                 $('h1').first().text() ||
                 $('.product-title').text() ||
                 $('.product-name').text();
    
    const imageUrl = $('meta[property="og:image"]').attr('content') ||
                     $('.product-image img').first().attr('src') ||
                     $('img[src*="product"]').first().attr('src');
    
    const description = $('meta[property="og:description"]').attr('content') ||
                       $('meta[name="description"]').attr('content');

    const priceText = $('.price').first().text() ||
                      $('[class*="price"]').first().text() ||
                      $('meta[property="product:price:amount"]').attr('content');

    if (name) {
      return {
        name: name.trim(),
        imageUrl: imageUrl ? makeAbsoluteUrl(imageUrl, url) : null,
        description: description?.trim(),
        color: null,
        price: normalizePrice(priceText),
        brand: retailerConfig.brand?.defaultValue,
        type: detectProductType(name)
      };
    }
    
    throw new Error('No basic information found');
  } catch (error) {
    throw new Error(`Basic extraction failed: ${error.message}`);
  }
}

function extractBasicInfo($, retailerConfig, url) {
  const info = {
    name: null,
    imageUrl: null,
    color: null,
    price: null,
    brand: null,
    description: null
  };

  // Enhanced extraction with more selectors
  const nameSelectors = [
    'meta[property="og:title"]',
    'h1.product-detail-info__header-name',
    '.product-detail-info h1',
    '.pdp-product-name',
    '.product-title',
    '.product-name',
    'h1[data-testid*="title"]',
    ...retailerConfig.selectors.name,
    'h1',
    'title'
  ];
  
  info.name = extractText($, nameSelectors);

  const imageSelectors = [
    'meta[property="og:image"]',
    '.product-detail-images img',
    '.media-image img',
    'picture.media-image img',
    '.product-media img',
    '.gallery-image img',
    '.product-image img',
    'img[data-testid*="image"]',
    'img[src*="product"]',
    'img[alt*="product"]',
    ...retailerConfig.selectors.image
  ];
  
  info.imageUrl = extractImageUrl($, imageSelectors, url);

  const colorSelectors = [
    '.color-name',
    '.selected-color',
    '.color-selector .selected',
    '.color-option.active',
    '[data-testid*="color"]',
    ...retailerConfig.selectors.color
  ];
  
  info.color = extractText($, colorSelectors);

  const brandSelectors = [
    'meta[property="product:brand"]',
    '.brand',
    '.designer',
    '.brand-name',
    '[data-testid*="brand"]',
    ...retailerConfig.selectors.brand
  ];
  
  info.brand = extractText($, brandSelectors);

  const priceSelectors = [
    'meta[property="product:price:amount"]',
    '.price .money-amount',
    '.price-current',
    '.price .sr-only',
    '.price',
    '[data-testid*="price"]',
    '[class*="price"]',
    ...retailerConfig.selectors.price
  ];
  
  const priceText = extractText($, priceSelectors);
  
  if (priceText) {
    info.price = normalizePrice(priceText);
  }

  const descriptionSelectors = [
    'meta[property="og:description"]',
    '.product-detail-description',
    '.product-description',
    '.description',
    'meta[name="description"]'
  ];
  
  info.description = extractText($, descriptionSelectors);

  logger.debug('Extracted basic info:', {
    hasName: !!info.name,
    hasImage: !!info.imageUrl,
    hasPrice: !!info.price,
    hasColor: !!info.color,
    hasBrand: !!info.brand,
    name: info.name?.substring(0, 50),
    imageUrl: info.imageUrl?.substring(0, 100)
  });

  return info;
}

function enhanceForSpecificRetailers($, url, basicInfo) {
  // Enhanced extraction for Carolina Herrera
  if (url.includes('chcarolinaherrera.com') || url.includes('carolinaherrera.com')) {
    logger.debug('Applying Carolina Herrera-specific enhancements');
    
    if (!basicInfo.imageUrl) {
      const imgSelectors = [
        'meta[property="og:image"]',
        '.product-image img',
        '.gallery-image img',
        '.media-image img',
        'picture img',
        'img[src*="product"]',
        'img[alt*="product"]'
      ];
      
      for (const selector of imgSelectors) {
        const img = $(selector).first();
        if (img.length) {
          const src = img.attr('src') || img.attr('data-src');
          if (src && !src.includes('placeholder')) {
            basicInfo.imageUrl = makeAbsoluteUrl(src, url);
            logger.debug('Found Carolina Herrera image:', basicInfo.imageUrl?.substring(0, 100));
            break;
          }
        }
      }
    }
    
    if (!basicInfo.price) {
      const priceSelectors = [
        '.price',
        '.product-price',
        '[class*="price"]',
        '.money-amount'
      ];
      
      for (const selector of priceSelectors) {
        const priceEl = $(selector).first();
        if (priceEl.length) {
          const priceText = priceEl.text().trim();
          if (priceText) {
            basicInfo.price = normalizePrice(priceText);
            if (basicInfo.price) break;
          }
        }
      }
    }
  }

  // Enhanced extraction for Zara
  if (url.includes('zara.com')) {
    logger.debug('Applying Zara-specific enhancements');
    
    if (!basicInfo.imageUrl) {
      const imgSelectors = [
        'meta[property="og:image"]',
        'picture.media-image img',
        '.product-detail-images img',
        '.media-image img',
        'img[data-qa-anchor="product-image"]',
        'img[src*="static.zara.net"]'
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
}

function extractText($, selectors) {
  for (const selector of selectors) {
    try {
      const element = $(selector);
      if (element.length) {
        const content = element.attr('content');
        if (content && content.trim()) return content.trim();

        const text = element.text().trim();
        if (text) return text;
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}

function extractImageUrl($, selectors, baseUrl) {
  for (const selector of selectors) {
    try {
      const element = $(selector);
      if (element.length) {
        const url = element.attr('content') || 
                   element.attr('src') || 
                   element.attr('data-src') ||
                   element.attr('data-zoom-image') ||
                   element.attr('data-lazy') ||
                   element.attr('srcset')?.split(',')[0]?.split(' ')[0];
        
        if (url && !url.includes('placeholder') && !url.includes('loading')) {
          const absoluteUrl = makeAbsoluteUrl(url, baseUrl);
          logger.debug('Found image URL:', { selector, url: absoluteUrl?.substring(0, 100) });
          return absoluteUrl;
        }
      }
    } catch (error) {
      continue;
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
      const base = baseUrl || 'https://example.com';
      return new URL(url, base).toString();
    }
    
    let cleanUrl = url.replace(/^http:/, 'https:');
    
    if (cleanUrl.includes('chcarolinaherrera.com') || cleanUrl.includes('carolinaherrera.com')) {
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