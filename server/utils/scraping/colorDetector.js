import { COLOR_MAPPINGS } from './constants.js';

export function findProductColor($, url, retailerConfig) {
  // Try retailer-specific selectors first
  if (retailerConfig?.selectors?.color) {
    for (const selector of retailerConfig.selectors.color) {
      const element = $(selector);
      if (element.length) {
        const text = element.text().trim();
        if (text) {
          const color = normalizeColorName(text);
          if (color) return color;
        }

        // Check data attributes
        const dataColor = element.attr('data-color') || 
                         element.attr('data-selected-color') ||
                         element.attr('data-value');
        if (dataColor) {
          const color = normalizeColorName(dataColor);
          if (color) return color;
        }
      }
    }
  }

  // Try JSON-LD data
  const jsonLdScripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < jsonLdScripts.length; i++) {
    try {
      const data = JSON.parse($(jsonLdScripts[i]).html());
      if (data['@type'] === 'Product' && data.color) {
        const color = normalizeColorName(data.color);
        if (color) return color;
      }
    } catch (e) {
      continue;
    }
  }

  // Try meta tags
  const metaColor = $('meta[property="product:color"], meta[name="product:color"]').attr('content');
  if (metaColor) {
    const color = normalizeColorName(metaColor);
    if (color) return color;
  }

  // Try finding color in product name or description
  const productName = $('h1').first().text() || '';
  const productDesc = $('.product-description, [data-testid="product-description"]').first().text() || '';
  
  const nameColor = findColorInText(productName);
  if (nameColor) return nameColor;
  
  const descColor = findColorInText(productDesc);
  if (descColor) return descColor;

  // Try finding color in URL
  const urlColor = findColorInText(url);
  if (urlColor) return urlColor;

  return null;
}

function normalizeColorName(colorText) {
  if (!colorText) return null;
  
  const text = colorText.toLowerCase().trim();
  
  // Direct mapping
  if (COLOR_MAPPINGS[text]) {
    return COLOR_MAPPINGS[text];
  }

  // Check for compound colors (e.g., "dark blue", "light green")
  const colorWords = text.split(/[\s-]+/);
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

  return findColorInText(text);
}

function findColorInText(text) {
  if (!text) return null;
  text = text.toLowerCase();

  // Check each word against color mappings
  const words = text.split(/[\s-]+/);
  for (const word of words) {
    if (COLOR_MAPPINGS[word]) {
      return COLOR_MAPPINGS[word];
    }
  }

  // Check for compound colors
  for (let i = 0; i < words.length - 1; i++) {
    const compound = `${words[i]} ${words[i + 1]}`;
    if (COLOR_MAPPINGS[compound]) {
      return COLOR_MAPPINGS[compound];
    }
  }

  // Check for color within text
  for (const [key, value] of Object.entries(COLOR_MAPPINGS)) {
    if (text.includes(key)) {
      return value;
    }
  }

  return null;
}