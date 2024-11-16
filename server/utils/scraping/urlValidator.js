import { URL } from 'url';

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

const BLOCKED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'example.com'
];

const SUPPORTED_DOMAINS = [
  'zara.com',
  'mango.com',
  'elcorteingles.es',
  'pronovias.com',
  'hm.com',
  'massimodutti.com',
  'bershka.com',
  'stradivarius.com',
  'sfera.com',
  'cortefiel.com',
  'asos.com',
  'springfield.com',
  'dolorespromesas.com',
  'hossintropia.com',
  'bimbaylola.com',
  'carolinaherrera.com',
  'cos.com',
  'hugoboss.com',
  'ladypipa.com',
  'violetabymango.com',
  'tedbaker.com',
  'farfetch.com',
  'net-a-porter.com',
  'matchesfashion.com',
  'selfridges.com',
  'mytheresa.com'
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

    // Verify supported domains
    const isSupported = SUPPORTED_DOMAINS.some(domain => 
      parsedUrl.hostname.includes(domain)
    );

    if (!isSupported) {
      throw new Error('This retailer is not supported. Please use one of our supported stores.');
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

    return cleanUrl;
  } catch (error) {
    throw new Error(`Invalid URL format: ${error.message}`);
  }
}