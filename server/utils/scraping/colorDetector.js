import { COLOR_MAPPINGS } from './constants.js';

function normalizeColorName(colorText) {
  if (!colorText) return null;
  
  const text = colorText.toLowerCase().trim();
  
  // Direct mapping
  if (COLOR_MAPPINGS[text]) {
    return COLOR_MAPPINGS[text];
  }

  // Check for compound colors (e.g., "dark blue", "light green")
  const colorWords = text.split(/\s+/);
  for (let i = 0; i < colorWords.length; i++) {
    const word = colorWords[i];
    const nextWord = colorWords[i + 1];
    
    if (nextWord && COLOR_MAPPINGS[nextWord]) {
      if (['light', 'dark', 'pale', 'bright', 'deep'].includes(word)) {
        return `${word} ${COLOR_MAPPINGS[nextWord]}`;
      }
    }
    
    if (COLOR_MAPPINGS[word]) {
      return COLOR_MAPPINGS[word];
    }
  }

  // Check for color within text
  for (const [key, value] of Object.entries(COLOR_MAPPINGS)) {
    if (text.includes(key)) {
      return value;
    }
  }

  // Handle special cases
  if (text.includes('oliva') || text.includes('olive')) {
    return 'olive';
  }

  return text;
}

export async function findProductColor($, url, structuredData = null) {
  // Try structured data first
  if (structuredData) {
    const structuredColor = parseStructuredData(structuredData);
    if (structuredColor) return structuredColor;
  }

  // Try JSON-LD data
  const jsonLdScripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < jsonLdScripts.length; i++) {
    try {
      const data = JSON.parse($(jsonLdScripts[i]).html());
      if (Array.isArray(data)) {
        for (const item of data) {
          const color = parseStructuredData(item);
          if (color) return color;
        }
      } else {
        const color = parseStructuredData(data);
        if (color) return color;
      }
    } catch (e) {
      continue;
    }
  }

  // Try meta tags
  const metaColor = $('meta[property="product:color"], meta[name="product:color"]').attr('content');
  if (metaColor) {
    return normalizeColorName(metaColor);
  }

  // Try common selectors
  const colorSelectors = [
    '[data-testid="product-color"]',
    '.color-label',
    '.selected-color',
    '.product-color',
    '.color-name',
    '.color-value',
    '[data-element="product-color"]',
    '.variant-color',
    '[data-qa-id="product-color"]',
    '[data-auto-id="selected-color"]',
    '.color-selector.selected',
    '.color-swatches .selected',
    '[data-component="pdpColorSelector"]',
    '.product-info-color'
  ];

  for (const selector of colorSelectors) {
    const element = $(selector).first();
    if (element.length) {
      const text = element.text().trim();
      if (text) {
        return normalizeColorName(text);
      }

      // Check for color in data attributes
      const dataColor = element.attr('data-color') || 
                       element.attr('data-selected-color') || 
                       element.attr('data-value');
      if (dataColor) {
        return normalizeColorName(dataColor);
      }
    }
  }

  // Try finding color in product name or description
  const productName = $('h1').first().text() || '';
  const productDesc = $('.product-description, [data-testid="product-description"]').first().text() || '';
  
  const nameColor = normalizeColorName(productName);
  if (nameColor) return nameColor;
  
  const descColor = normalizeColorName(productDesc);
  if (descColor) return descColor;

  return null;
}

function parseStructuredData(data) {
  if (!data) return null;

  // Handle direct color property
  if (typeof data.color === 'string') {
    return normalizeColorName(data.color);
  }

  // Handle color in offers
  if (data.offers) {
    const offers = Array.isArray(data.offers) ? data.offers : [data.offers];
    for (const offer of offers) {
      if (offer.itemOffered?.color) {
        return normalizeColorName(offer.itemOffered.color);
      }
    }
  }

  // Handle color in variants
  if (data.variants) {
    const variants = Array.isArray(data.variants) ? data.variants : [data.variants];
    for (const variant of variants) {
      if (variant.color) {
        return normalizeColorName(variant.color);
      }
    }
  }

  return null;
}