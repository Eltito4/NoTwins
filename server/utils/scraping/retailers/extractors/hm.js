import { findBestImage } from '../../imageProcessor.js';
import { normalizeColor } from '../../normalizers.js';

export async function extractHMProduct($, url) {
  const selectors = {
    name: [
      '.product-detail-name',
      '.pdp-heading',
      'meta[property="og:title"]',
      'h1[data-testid="product-name"]'
    ],
    price: [
      '.product-price-value',
      '.price-value',
      'meta[property="product:price:amount"]',
      '[data-testid="product-price"]'
    ],
    color: [
      '.product-input-label',
      '.product-detail-colour-picker__selected',
      '.selected-color',
      '[data-testid="color-picker"] .selected'
    ]
  };

  const name = extractText($, selectors.name);
  const imageUrl = await findBestImage($, url);
  const price = extractPrice($, selectors.price);
  const color = extractColor($, selectors.color);

  return {
    name,
    imageUrl,
    price,
    color: normalizeColor(color),
    brand: 'H&M',
    type: detectType(name)
  };
}

function extractText($, selectors) {
  for (const selector of selectors) {
    const element = $(selector);
    if (element.length) {
      const text = element.text().trim();
      if (text) return text;
      
      const content = element.attr('content');
      if (content) return content.trim();
    }
  }
  return null;
}

function extractPrice($, selectors) {
  for (const selector of selectors) {
    const element = $(selector);
    if (element.length) {
      const text = element.text().trim();
      if (text) {
        const match = text.match(/(\d+)[,.](\d{2})/);
        if (match) {
          const euros = parseInt(match[1], 10);
          const cents = parseInt(match[2], 10);
          return euros + (cents / 100);
        }
      }
    }
  }
  return null;
}

function extractColor($, selectors) {
  for (const selector of selectors) {
    const element = $(selector);
    if (element.length) {
      return element.text().trim() || 
             element.attr('data-color') || 
             element.attr('data-selected-color');
    }
  }
  return null;
}

function detectType(name) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('dress')) return 'Dress';
  if (lowerName.includes('skirt')) return 'Skirt';
  if (lowerName.includes('pants') || lowerName.includes('trousers')) return 'Pants';
  if (lowerName.includes('coat')) return 'Coat';
  return 'Other';
}