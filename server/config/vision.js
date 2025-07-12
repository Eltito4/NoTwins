let visionClient = null;

export async function initializeVisionClient() {
  try {
    // Try to import Google Cloud Vision dynamically
    let ImageAnnotatorClient;
    try {
      const visionModule = await import('@google-cloud/vision');
      ImageAnnotatorClient = visionModule.ImageAnnotatorClient;
    } catch (importError) {
      console.warn('Google Cloud Vision package not available:', importError.message);
      return null;
    }

    // Check for required credentials
    const requiredEnvVars = [
      'GOOGLE_CLOUD_PROJECT_ID',
      'GOOGLE_CLOUD_CLIENT_EMAIL',
      'GOOGLE_CLOUD_PRIVATE_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn(`Missing required environment variables: ${missingVars.join(', ')}`);
      return null;
    }

    // Log credential info (without sensitive data)
    console.log('Initializing Vision client with:', {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      clientEmail: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_CLOUD_PRIVATE_KEY
    });

    const credentials = {
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
      project_id: process.env.GOOGLE_CLOUD_PROJECT_ID
    };

    // Create the client with enhanced features
    visionClient = new ImageAnnotatorClient({
      credentials,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      apiEndpoint: 'vision.googleapis.com',
      fallback: true // Enable fallback for better reliability
    });

    // Test the client immediately
    await testVisionClient(visionClient);
    console.log('Vision API client initialized successfully');
    return visionClient;
  } catch (error) {
    console.error('Vision client initialization failed:', {
      error: error.message,
      stack: error.stack
    });
    return null;
  }
}

async function testVisionClient(client) {
  try {
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    await client.labelDetection(testImage);
    console.log('Vision API client test successful');
    return true;
  } catch (error) {
    console.error('Vision API test failed:', error);
    throw error;
  }
}

export function getVisionClient() {
  return visionClient;
}

export async function checkVisionApiStatus() {
  try {
    if (!visionClient) {
      visionClient = await initializeVisionClient();
    }
    
    if (!visionClient) {
      throw new Error('Failed to initialize Vision client');
    }

    await testVisionClient(visionClient);
    
    return {
      status: 'ok',
      credentials: {
        hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
        hasClientEmail: !!process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.GOOGLE_CLOUD_PRIVATE_KEY
      }
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      details: error.details || error.stack,
      credentials: {
        hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
        hasClientEmail: !!process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.GOOGLE_CLOUD_PRIVATE_KEY
      }
    };
  }
}