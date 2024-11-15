import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { config } from 'dotenv';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import authRouter from './routes/auth.js';
import eventsRouter from './routes/events.js';
import dressesRouter from './routes/dresses.js';
import scrapingRouter from './routes/scraping.js';

config();

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('MongoDB Connected');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// CORS configuration with proper options
app.use(cors({
  origin: ['https://notwins.netlify.app', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
}));

// Security middleware with adjusted settings
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

app.use(express.json());
app.use(morgan('dev'));
app.use(apiLimiter);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/dresses', dressesRouter);
app.use('/api/scraping', scrapingRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
});