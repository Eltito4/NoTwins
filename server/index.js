import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { logger } from './utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables based on NODE_ENV
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'SCRAPER_API_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  logger.error('Missing required environment variables:', missingVars);
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS with specific options
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://notwins.netlify.app',
    'https://notwins.onrender.com',
    process.env.CORS_ORIGIN
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Increase payload size limit to 10MB
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Import routes
import eventRoutes from './routes/events.js';
import dressRoutes from './routes/dresses.js';
import visionRoutes from './routes/vision.js';
import authRoutes from './routes/auth.js';
import messageRoutes from './routes/messages.js';
import scrapingRoutes from './routes/scraping.js';
import suggestionRoutes from './routes/suggestions.js';
import adminRoutes from './routes/admin.js';

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    services: 'operational'
  });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/dresses', dressRoutes);
app.use('/api/vision', visionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/scraping', scrapingRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error:', {
    error: err.message,
    stack: err.stack,
    type: err.type,
    expected: err.expected,
    length: err.length,
    limit: err.limit
  });

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Request entity too large',
      details: 'The uploaded file exceeds the size limit'
    });
  }

  res.status(500).json({ 
    error: 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    logger.success('Connected to MongoDB');
    app.listen(port, () => {
      logger.success(`Server running on port ${port}`);
      logger.info('Environment:', process.env.NODE_ENV);
      logger.info('ScraperAPI status:', {
        }      )
    }
    )
  }
  )
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

export default app;