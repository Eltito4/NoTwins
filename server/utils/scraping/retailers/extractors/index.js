import { load } from 'cheerio';
import { findBestImage } from '../../imageProcessor.js';
import { normalizeColor } from '../../normalizers.js';
import { detectProductType } from '../../typeDetector.js';

export async function extractCosProduct($, url) {
  const selectors = {
    name: [
      '[data-test-id="product-title"]',
      '.product-hero h1',
      '.product-title'
    ],
    price: [
      '[data-test-id="product-price"]',
      '.product-price',
      '.price-value'
    ],
    color: [
      '[data-test-id="selected-color"]',
      '.color-selector .active',
      '.selected-color'
    ]
  };

  const name = extractText($, selectors.name);
  const imageUrl = await findBestImage($, url);
  const price = extractPrice($, selectors.price);
  const color = extractColor($, selectors.color);
  const type = detectProductType(name);

  return {
    name,
    imageUrl,
    price,
    color: normalizeColor(color),
    brand: 'COS',
    type
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