import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Import routes
import eventRoutes from './routes/events.js';
import dressRoutes from './routes/dresses.js';
import visionRoutes from './routes/vision.js';
import authRoutes from './routes/auth.js';
import messageRoutes from './routes/messages.js';

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    vision: {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      hasCredentials: !!process.env.GOOGLE_CLOUD_PRIVATE_KEY
    }
  });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/dresses', dressRoutes);
app.use('/api/vision', visionRoutes);
app.use('/api/messages', messageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error:', err);
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
      logger.debug('Vision API credentials:', {
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        hasClientEmail: !!process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.GOOGLE_CLOUD_PRIVATE_KEY?.length
      });
    });
  })
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

export default app;