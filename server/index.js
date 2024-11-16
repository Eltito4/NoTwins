import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { config } from 'dotenv';
import winston from 'winston';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import authRouter from './routes/auth.js';
import eventsRouter from './routes/events.js';
import dressesRouter from './routes/dresses.js';
import scrapingRouter from './routes/scraping.js';

config();

const app = express();
const PORT = process.env.PORT || 3001;
const isDevelopment = process.env.NODE_ENV === 'development';

// Configure logger
const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (isDevelopment) {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
    level: 'debug'
  }));
} else {
  logger.add(new winston.transports.Console({
    format: winston.format.json(),
    level: 'info'
  }));
}

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info(`MongoDB Connected in ${process.env.NODE_ENV} mode`);
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// CORS configuration
const corsOptions = {
  origin: isDevelopment 
    ? ['http://localhost:5173', 'https://notwins.netlify.app']
    : 'https://notwins.netlify.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: isDevelopment 
        ? ["'self'", "https://notwins.netlify.app", "http://localhost:5173"]
        : ["'self'", "https://notwins.netlify.app"],
      imgSrc: ["'self'", "*", "data:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", ...(isDevelopment ? ["'unsafe-eval'"] : [])],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));

// Middleware
app.use(express.json());
app.use(morgan(isDevelopment ? 'dev' : 'combined'));
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
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error(err);
  
  if (isDevelopment) {
    res.status(err.status || 500).json({
      error: err.message,
      stack: err.stack
    });
  } else {
    res.status(err.status || 500).json({
      error: 'Internal Server Error'
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});