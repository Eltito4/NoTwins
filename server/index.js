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

app.set('trust proxy', 1);

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/unique-dress', {
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

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'https://vermillion-smakager-55c20e.netlify.app/' // Replace with your Netlify URL
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(helmet());
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
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});