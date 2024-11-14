import axios from 'axios';
import { getRetailerConfig, transformImageUrl, getRetailerHeaders } from './retailers/index.js';

const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
const MAX_REDIRECTS = 5;
const TIMEOUT = 10000;

const CDN_DOMAINS = [
  // Luxury brands
  'media.louisvuitton.com',
  'assets.burberry.com',
  'images.ralphlauren.com',
  'images.coach.com',
  'assets.hermes.com',
  'media.gucci.com',
  'assets.prada.com',
  'images.chanel.com',
  
  // Spanish retailers
  'static.zara.net',
  'static.massimodutti.net',
  'static.bershka.net',
  'static.pullandbear.net',
  'static.e-stradivarius.net',
  'images.elcorteingles.es',
  'assets.pronovias.com',
  'images.cortefiel.com',
  'static.sfera.com',
  'images.bimbaylola.com',
  
  // Common CDNs
  'cloudinary.com',
  'cloudfront.net',
  'amazonaws.com',
  'akamaized.net',
  'imgix.net',
  'cdn.shopify.com',
  'images.unsplash.com',
  'images.asos-media.com',
  'cdn-images.farfetch-contents.com',
  'images.selfridges.com'
];

async function isImageAccessible(url, retailerConfig) {
  const headers = getRetailerHeaders(retailerConfig);
  
  try {
    const response = await axios.head(url, {
      timeout: TIMEOUT,
      maxRedirects: MAX_REDIRECTS,
      validateStatus: status => status === 200,
      headers: {
        ...headers,
        'Accept': 'image/*'
      }
    });
    
    const contentType = response.headers['content-type'];
    return contentType && contentType.startsWith('image/');
  } catch {
    try {
      const response = await axios.get(url, {
        timeout: TIMEOUT,
        maxRedirects: MAX_REDIRECTS,
        responseType: 'arraybuffer',
        headers: {
          ...headers,
          'Accept': 'image/*'
        }
      });
      
      const contentType = response.headers['content-type'];
      return contentType && contentType.startsWith('image/');
    } catch {
      return false;
    }
  }
}

function hasValidExtension(url) {
  try {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname.toLowerCase();
    return VALID_IMAGE_EXTENSIONS.some(ext => path.endsWith(ext));
  } catch {
    return false;
  }
}

function isDataUrl(url) {
  return url.startsWith('data:image/');
}

function isCDNUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return CDN_DOMAINS.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
}

export async function validateAndProcessImage(imageUrl, baseUrl) {
  if (!imageUrl) return null;
  
  if (isDataUrl(imageUrl)) {
    return imageUrl;
  }
  
  let absoluteUrl = imageUrl;
  if (!imageUrl.startsWith('http')) {
    try {
      const urlObj = new URL(baseUrl);
      absoluteUrl = new URL(imageUrl, urlObj.origin).toString();
    } catch {
      return null;
    }
  }
  
  const retailerConfig = getRetailerConfig(baseUrl);
  if (retailerConfig) {
    absoluteUrl = transformImageUrl(absoluteUrl, retailerConfig);
  }
  
  absoluteUrl = absoluteUrl.replace(/^http:/, 'https:');
  
  if (!hasValidExtension(absoluteUrl) && !isCDNUrl(absoluteUrl)) {
    return null;
  }
  
  if (await isImageAccessible(absoluteUrl, retailerConfig)) {
    return absoluteUrl;
  }
  
  return null;
}

export async function findBestImage($, baseUrl) {
  const images = [];
  const retailerConfig = getRetailerConfig(baseUrl);
  const selectors = retailerConfig?.selectors?.image || [];
  
  // Try JSON-LD first
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const data = JSON.parse($(element).html());
      if (Array.isArray(data)) {
        const product = data.find(item => item['@type'] === 'Product');
        if (product?.image) {
          const imageUrl = Array.isArray(product.image) ? product.image[0] : product.image;
          images.push({
            url: imageUrl,
            priority: 20
          });
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
  });
  
  // Try meta tags
  $('meta[property="og:image"], meta[property="og:image:secure_url"]').each((_, element) => {
    const content = $(element).attr('content');
    if (content) {
      images.push({
        url: content,
        priority: 15
      });
    }
  });
  
  // Try retailer-specific selectors
  for (const selector of selectors) {
    const elements = $(selector);
    elements.each((_, element) => {
      const $element = $(element);
      
      const urls = [
        $element.attr('src'),
        $element.attr('data-src'),
        $element.attr('data-zoom-image'),
        $element.attr('data-image'),
        $element.attr('data-original'),
        $element.attr('data-srcset')?.split(',').pop()?.split(' ')[0],
        $element.attr('srcset')?.split(',').pop()?.split(' ')[0]
      ].filter(Boolean);
      
      urls.forEach(url => {
        images.push({
          url,
          priority: 10
        });
      });
    });
  }
  
  // Sort by priority and try each image
  const sortedImages = images.sort((a, b) => b.priority - a.priority);
  
  for (const image of sortedImages) {
    const validUrl = await validateAndProcessImage(image.url, baseUrl);
    if (validUrl) {
      return validUrl;
    }
  }
  
  return null;
}