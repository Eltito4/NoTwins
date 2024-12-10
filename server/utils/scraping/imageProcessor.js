import { getRetailerConfig } from './retailers/index.js';

export async function findBestImage($, url) {
  const retailerConfig = getRetailerConfig(url);
  
  // Try meta tags first (usually highest quality)
  const metaSelectors = [
    'meta[property="og:image"]',
    'meta[property="og:image:secure_url"]',
    'meta[property="product:image"]',
    'meta[name="twitter:image"]'
  ];

  for (const selector of metaSelectors) {
    const element = $(selector);
    if (element.length) {
      const content = element.attr('content');
      if (content) {
        return makeAbsoluteUrl(content, url);
      }
    }
  }

  // Try retailer-specific selectors
  if (retailerConfig?.selectors?.image) {
    for (const selector of retailerConfig.selectors.image) {
      const element = $(selector);
      if (element.length) {
        const src = element.attr('src') || 
                   element.attr('data-src') || 
                   element.attr('data-zoom-image') ||
                   element.attr('data-image');
        if (src) {
          return makeAbsoluteUrl(src, url);
        }
      }
    }
  }

  // Try common selectors
  const imgSelectors = [
    '.product-detail-main-image img',
    '.pdp-image img',
    '.product-gallery__image img',
    '.main-image img',
    'img[data-zoom-image]',
    'img[data-large]'
  ];

  for (const selector of imgSelectors) {
    const element = $(selector);
    if (element.length) {
      const src = element.attr('src') || 
                 element.attr('data-src') || 
                 element.attr('data-zoom-image') ||
                 element.attr('data-large');
      if (src) {
        return makeAbsoluteUrl(src, url);
      }
    }
  }

  return null;
}

function makeAbsoluteUrl(imageUrl, baseUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('data:')) return imageUrl;
  
  try {
    // Handle protocol-relative URLs
    if (imageUrl.startsWith('//')) {
      return `https:${imageUrl}`;
    }
    
    // Make relative URLs absolute
    if (!imageUrl.startsWith('http')) {
      const urlObj = new URL(baseUrl);
      return new URL(imageUrl, urlObj.origin).toString();
    }
    
    // Ensure HTTPS
    return imageUrl.replace(/^http:/, 'https:');
  } catch (e) {
    console.error('Error making absolute URL:', e);
    return null;
  }
}