import axios from 'axios';
import { logger } from '../../utils/logger.js';

let grokClient = null;

function initializeGrok() {
  logger.debug('Starting Grok initialization...', {
    timestamp: new Date().toISOString(),
    hasClient: !!grokClient,
    envVars: {
      hasKey: !!process.env.GROK_API_KEY,
      keyLength: process.env.GROK_API_KEY?.length || 0,
      hasUrl: !!process.env.GROK_API_URL
    }
  });

  const API_KEY = process.env.GROK_API_KEY;
  const API_URL = process.env.GROK_API_URL || 'https://api.x.ai/v1/chat/completions';
  
  if (!API_KEY) {
    logger.error('Missing GROK_API_KEY environment variable', {
      envKeys: Object.keys(process.env).filter(key => key.includes('GROK')),
      timestamp: new Date().toISOString()
    });
    return null;
  }

  try {
    logger.debug('Creating Grok API client...', {
      baseURL: API_URL,
      timestamp: new Date().toISOString()
    });

    // Create axios instance with proper headers
    grokClient = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}` // Add Bearer prefix
      },
      timeout: 30000,
      validateStatus: status => status >= 200 && status < 300
    });

    // Add request interceptor for logging
    grokClient.interceptors.request.use(
      (config) => {
        logger.debug('Outgoing Grok request:', {
          method: config.method,
          url: config.url,
          hasAuth: !!config.headers.Authorization,
          authType: config.headers.Authorization?.split(' ')[0],
          timestamp: new Date().toISOString()
        });
        return config;
      },
      (error) => {
        logger.error('Grok request error:', {
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    grokClient.interceptors.response.use(
      (response) => {
        logger.debug('Grok response received:', {
          status: response.status,
          statusText: response.statusText,
          hasData: !!response.data,
          timestamp: new Date().toISOString()
        });
        return response;
      },
      (error) => {
        const errorDetails = {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          timestamp: new Date().toISOString()
        };

        if (error.response?.status === 401 || error.response?.status === 403) {
          logger.error('Grok API authentication failed:', errorDetails);
        } else if (error.response?.status === 400) {
          logger.error('Invalid Grok API request:', errorDetails);
        } else {
          logger.error('Grok API error:', errorDetails);
        }

        return Promise.reject(error);
      }
    );

    return grokClient;
  } catch (error) {
    logger.error('Failed to initialize Grok:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return null;
  }
}

export async function interpretProductDetails(visionResults) {
  try {
    if (!visionResults) {
      logger.error('No vision results provided to interpret', {
        timestamp: new Date().toISOString()
      });
      return null;
    }

    logger.debug('Vision results received:', {
      hasLabels: !!visionResults.labelAnnotations?.length,
      hasObjects: !!visionResults.localizedObjectAnnotations?.length,
      hasLogos: !!visionResults.logoAnnotations?.length,
      timestamp: new Date().toISOString()
    });

    if (!grokClient) {
      logger.debug('Grok client not found, initializing...', {
        timestamp: new Date().toISOString()
      });
      grokClient = initializeGrok();
      if (!grokClient) {
        throw new Error('Failed to initialize Grok client');
      }
    }

    const messages = [
      {
        role: "system",
        content: "You are a fashion product analyzer. Extract product details from Vision API results."
      },
      {
        role: "user",
        content: `Analyze this product based on Vision API results:
          Labels: ${visionResults.labelAnnotations?.map(l => l.description).join(', ')}
          Objects: ${visionResults.localizedObjectAnnotations?.map(o => o.name).join(', ')}
          Logos: ${visionResults.logoAnnotations?.map(l => l.description).join(', ')}
          
          Return a JSON object with:
          - name: Product name
          - brand: Brand name if found
          - type: Object with category, subcategory, and name
          - color: Main color if detected`
      }
    ];

    logger.debug('Sending request to Grok API...', {
      messageLength: messages[1].content.length,
      timestamp: new Date().toISOString()
    });

    const response = await grokClient.post('', {
      model: "grok-2-1212",
      messages,
      temperature: 0.7,
      max_tokens: 150,
      stream: false
    });

    logger.debug('Received Grok API response:', {
      status: response.status,
      hasData: !!response.data,
      hasChoices: !!response.data?.choices,
      timestamp: new Date().toISOString()
    });

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from Grok API');
    }

    const text = response.data.choices[0].message.content;
    logger.debug('Processing Grok response text:', {
      textLength: text.length,
      timestamp: new Date().toISOString()
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      logger.debug('Successfully parsed Grok response:', {
        hasName: !!result.name,
        hasBrand: !!result.brand,
        hasType: !!result.type,
        hasColor: !!result.color,
        timestamp: new Date().toISOString()
      });
      return result;
    }

    throw new Error('No valid JSON found in Grok response');
  } catch (error) {
    logger.error('Grok analysis error:', {
      error: error.message,
      stack: error.stack,
      isAxiosError: axios.isAxiosError(error),
      response: error.response?.data,
      timestamp: new Date().toISOString()
    });
    return null;
  }
}

export async function checkGrokStatus() {
  try {
    logger.debug('Starting Grok status check...', {
      timestamp: new Date().toISOString()
    });

    const envStatus = {
      hasKey: !!process.env.GROK_API_KEY,
      keyLength: process.env.GROK_API_KEY?.length || 0,
      hasUrl: !!process.env.GROK_API_URL,
      url: process.env.GROK_API_URL || 'https://api.x.ai/v1/chat/completions'
    };

    logger.debug('Grok environment status:', {
      ...envStatus,
      timestamp: new Date().toISOString()
    });

    if (!process.env.GROK_API_KEY) {
      return {
        initialized: false,
        hasApiKey: false,
        hasUrl: envStatus.hasUrl,
        error: 'Missing API key'
      };
    }

    if (!grokClient) {
      grokClient = initializeGrok();
    }

    if (!grokClient) {
      return {
        initialized: false,
        hasApiKey: true,
        hasUrl: envStatus.hasUrl,
        error: 'Failed to initialize client'
      };
    }

    // Test connection
    const response = await grokClient.post('', {
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant."
        },
        {
          role: "user",
          content: "Test connection"
        }
      ],
      temperature: 0.7,
      max_tokens: 50,
      stream: false
    });

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from Grok API');
    }

    return {
      initialized: true,
      hasApiKey: true,
      hasUrl: true,
      status: 'connected'
    };
  } catch (error) {
    const errorDetails = {
      message: error.message,
      isAxiosError: axios.isAxiosError(error),
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      timestamp: new Date().toISOString()
    };

    logger.error('Grok status check failed:', errorDetails);

    return {
      initialized: false,
      hasApiKey: !!process.env.GROK_API_KEY,
      hasUrl: !!process.env.GROK_API_URL,
      error: error.message,
      details: errorDetails
    };
  }
}