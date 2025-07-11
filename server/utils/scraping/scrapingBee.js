import axios from 'axios';
import { logger } from '../logger.js';

const SCRAPINGBEE_API_KEY = process.env.SCRAPINGBEE_API_KEY;
const SCRAPINGBEE_API_URL = 'https://app.scrapingbee.com/api/v1';

if (!SCRAPINGBEE_API_KEY) {
  logger.error('SCRAPINGBEE_API_KEY is not set in environment variables');
}

export async function scrapeWithScrapingBee(url) {
  try {
    logger.debug('Starting ScrapingBee request:', { url });

    if (!SCRAPINGBEE_API_KEY) {
      throw new Error('ScrapingBee API key is not configured');
    }

    // Build the ScrapingBee URL with parameters
    const params = new URLSearchParams({
      'api_key': SCRAPINGBEE_API_KEY,
      'url': url,
      'json_response': 'true',
      'render_js': 'true',
      'premium_proxy': 'true',
      'country_code': 'es',
      'block_ads': 'true',
      'wait_browser': '8000',
      'stealth_proxy': 'true',
      'device': 'desktop'
    });

    // Add extract rules for images
    const extractRules = {
      images: {
        selector: 'img',
        type: 'list',
        output: {
          src: 'img@src',
          alt: 'img@alt'
        }
      }
    };
    params.append('extract_rules', JSON.stringify(extractRules));

    // Add custom headers
    const customHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
    params.append('forward_headers', JSON.stringify(customHeaders));

    // Special handling for different retailers
    if (url.includes('ladypipa.com')) {
      params.append('wait_for', '.product-single__title,.product__price');
      params.append('block_resources', 'false');
    } else if (url.includes('chcarolinaherrera.com')) {
      params.append('wait_for', '.product-detail-info,.product-name,.product-price');
      params.append('cookies', JSON.stringify({
        'region': 'es',
        'language': 'es'
      }));
    }

    // Make the request
    const response = await axios({
      method: 'GET',
      url: `${SCRAPINGBEE_API_URL}?${params.toString()}`,
      responseType: 'json',
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      validateStatus: null
    });

    // Log response details
    logger.debug('ScrapingBee response received:', {
      status: response.status,
      statusText: response.statusText,
      hasData: !!response.data,
      contentType: response.headers['content-type'],
      contentLength: response.headers['content-length'],
      timestamp: new Date().toISOString()
    });

    // Handle different response types
    if (response.status === 401) {
      throw new Error('Invalid ScrapingBee API key');
    }

    if (response.status === 403) {
      throw new Error('Access forbidden - check your ScrapingBee plan limits');
    }

    if (response.status === 429) {
      throw new Error('Too many requests - rate limit exceeded');
    }

    if (response.status !== 200) {
      throw new Error(`ScrapingBee request failed with status ${response.status}`);
    }

    // Parse response data
    const { 
      body: html, 
      screenshot,
      cookies,
      headers: responseHeaders,
      url: finalUrl,
      status: statusCode
    } = response.data;

    // Validate HTML content
    if (!html || html.length < 100) {
      // Try API endpoint for specific retailers
      if (url.includes('ladypipa.com')) {
        const productHandle = url.split('/products/')[1]?.split('?')[0];
        if (productHandle) {
          const apiUrl = `https://ladypipa.com/api/products/${productHandle}.json`;
          const apiResponse = await axios.get(apiUrl);

          if (apiResponse.data?.product) {
            const product = apiResponse.data.product;
            const apiHtml = `
              <html>
                <head>
                  <title>${product.title}</title>
                  <meta property="og:title" content="${product.title}" />
                  <meta property="og:image" content="${product.images[0]?.src}" />
                  <meta property="product:price:amount" content="${product.variants[0]?.price}" />
                </head>
                <body>
                  <h1 class="product-single__title">${product.title}</h1>
                  <div class="product__price">${product.variants[0]?.price}</div>
                  <div class="product-description">${product.description}</div>
                </body>
              </html>
            `;

            return {
              html: apiHtml,
              screenshot,
              url: finalUrl || url,
              cookies,
              headers: responseHeaders,
              statusCode: 200
            };
          }
        }
      }

      throw new Error('Invalid or empty HTML content received');
    }

    // Return successful response
    return {
      html,
      screenshot,
      url: finalUrl || url,
      cookies,
      headers: responseHeaders,
      statusCode
    };
  } catch (error) {
    logger.error('ScrapingBee request failed:', {
      error: error.message,
      url,
      timestamp: new Date().toISOString()
    });

    let errorMessage = 'ScrapingBee request failed';
    if (error.response?.status) {
      errorMessage += `: Status ${error.response.status}`;
    }
    if (error.message) {
      errorMessage += `: ${error.message}`;
    }

    throw new Error(errorMessage);
  }
}