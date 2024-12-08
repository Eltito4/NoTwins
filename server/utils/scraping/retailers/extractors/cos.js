import { findBestImage } from '../../imageProcessor.js';
import { normalizeColor } from '../../normalizers.js';

export async function extractCosProduct($, url) {
  // COS specific selectors
  const selectors = {
    name: [
      '[data-test-id="product-title"]',
      '.product-detail-title',
      '.pdp-title h1',
      'meta[property="og:title"]'
    ],
    price: [
      '[data-test-id="product-price"]',
      '.product-price',
      '.price-value',
      'meta[property="product:price:amount"]'
    ],
    color: [
      '[data-test-id="selected-color"]',
      '.color-selector .active',
      '.selected-color',
      '.product-color'
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
    brand: 'COS',
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
  if (lowerName.includes('parka')) return 'Parka';
  if (lowerName.includes('coat')) return 'Coat';
  if (lowerName.includes('jacket')) return 'Jacket';
  return 'Other';
}