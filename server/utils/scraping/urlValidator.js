import { logger } from '../logger.js';

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

const BLOCKED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'example.com',
  'pinterest.com',
  'facebook.com',
  'instagram.com',
  'twitter.com'
];

export function validateUrl(url) {
  try {
    // Add protocol if missing
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    const parsedUrl = new URL(url);

    // Check protocol
    if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol. Only HTTP and HTTPS are supported.');
    }

    // Check for blocked domains
    if (BLOCKED_DOMAINS.some(domain => parsedUrl.hostname.includes(domain))) {
      throw new Error('This domain is not allowed.');
    }

    // Clean up URL
    let cleanUrl = parsedUrl.toString();
    
    // Remove tracking parameters
    cleanUrl = cleanUrl.replace(/utm_[^&]+&?/g, '')
                      .replace(/fbclid=[^&]+&?/g, '')
                      .replace(/gclid=[^&]+&?/g, '')
                      .replace(/ref=[^&]+&?/g, '');
    
    // Remove session IDs and other tracking tokens
    cleanUrl = cleanUrl.replace(/sid=[^&]+&?/g, '')
                      .replace(/session=[^&]+&?/g, '')
                      .replace(/token=[^&]+&?/g, '');
    
    // Remove analytics parameters
    cleanUrl = cleanUrl.replace(/ga_[^&]+&?/g, '')
                      .replace(/\_ga=[^&]+&?/g, '');
    
    // Ensure HTTPS
    cleanUrl = cleanUrl.replace(/^http:/, 'https:');

    // Remove trailing slashes and empty parameters
    cleanUrl = cleanUrl.replace(/\?$/, '')
                      .replace(/\&$/, '')
                      .replace(/\/$/, '');

    logger.debug('URL validated and cleaned:', {
      original: url,
      cleaned: cleanUrl
    });

    return cleanUrl;
  } catch (error) {
    logger.error('URL validation error:', {
      url,
      error: error.message
    });
    throw new Error(`Invalid URL format: ${error.message}`);
  }
}