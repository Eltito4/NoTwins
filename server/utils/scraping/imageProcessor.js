import { getRetailerConfig, getRetailerHeaders } from './retailers/index.js';

export function findBestImage($, url) {
  const getImageUrl = (element) => {
    const src = element.attr('content') || 
                element.attr('src') || 
                element.attr('data-src') || 
                element.attr('data-zoom-image') || 
                element.attr('data-image') ||
                element.attr('data-lazy-src');
    return src ? makeAbsoluteUrl(src, url) : null;
  };

  // Get retailer config
  const retailerConfig = getRetailerConfig(url);
  
  // Try to get image from JSON-LD
  const jsonLdScripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < jsonLdScripts.length; i++) {
    try {
      const data = JSON.parse($(jsonLdScripts[i]).html());
      if (data['@type'] === 'Product' && data.image) {
        const image = Array.isArray(data.image) ? data.image[0] : data.image;
        if (image) {
          const imageUrl = makeAbsoluteUrl(image, url);
          if (imageUrl) return imageUrl;
        }
      }
    } catch (e) {
      continue;
    }
  }

  // Try meta tags (usually highest quality)
  const metaSelectors = [
    'meta[property="og:image"]',
    'meta[property="og:image:secure_url"]',
    'meta[property="product:image"]',
    'meta[name="twitter:image"]',
    'meta[name="twitter:image:src"]'
  ];

  for (const selector of metaSelectors) {
    const element = $(selector).first();
    if (element.length) {
      const imageUrl = getImageUrl(element);
      if (imageUrl) return imageUrl;
    }
  }

  // Try retailer-specific selectors
  if (retailerConfig?.selectors?.image) {
    for (const selector of retailerConfig.selectors.image) {
      const element = $(selector).first();
      if (element.length) {
        const imageUrl = getImageUrl(element);
        if (imageUrl) return imageUrl;
      }
    }
  }

  // Try product-specific image selectors
  const productSelectors = [
    '#product-image img',
    '.product-image img',
    '.main-image img',
    '.primary-image img',
    '[data-testid="product-image"]',
    '.gallery-image img:first',
    '.product-gallery img:first',
    '.product-photo img',
    '.featured-image img',
    '.product-media img:first',
    '.pdp-image img',
    '.product-hero-image img',
    '.product-main-image img',
    '[data-component="PDPMainImage"] img'
  ];

  for (const selector of productSelectors) {
    const element = $(selector).first();
    if (element.length) {
      const imageUrl = getImageUrl(element);
      if (imageUrl) return imageUrl;
    }
  }

  // Last resort: find any large image
  const images = $('img').filter((_, img) => {
    const width = parseInt($(img).attr('width'), 10);
    const height = parseInt($(img).attr('height'), 10);
    const src = $(img).attr('src') || '';
    return (width > 300 || height > 300) && !src.includes('logo') && !src.includes('icon');
  });

  if (images.length) {
    const imageUrl = getImageUrl(images.first());
    if (imageUrl) return imageUrl;
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
    return null;
  }
}