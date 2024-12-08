import { findBestImage } from '../../imageProcessor.js';
import { normalizeColor } from '../../normalizers.js';

export async function extractLouisVuittonProduct($, url) {
  const selectors = {
    name: [
      '.lv-product__title',
      '.product-name h1',
      'meta[property="og:title"]',
      '[data-test-id="product-title"]'
    ],
    price: [
      '.lv-product__price',
      '.product-price',
      'meta[property="product:price:amount"]',
      '[data-test-id="product-price"]'
    ],
    color: [
      '.lv-product__color',
      '.product-color',
      '.selected-color',
      '[data-test-id="selected-color"]'
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
    brand: 'Louis Vuitton',
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
  if (lowerName.includes('vestido')) return 'Dress';
  if (lowerName.includes('falda')) return 'Skirt';
  if (lowerName.includes('pantalón')) return 'Pants';
  if (lowerName.includes('bolso')) return 'Bag';
  if (lowerName.includes('zapatos')) return 'Shoes';
  return 'Other';
}