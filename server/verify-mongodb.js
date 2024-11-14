import mongoose from 'mongoose';
import { logger } from './utils/logger.js';

async function verifyMongoDB() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/unique-dress', {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info('✓ MongoDB connection successful');
    logger.info(`✓ Connected to database: ${mongoose.connection.name}`);
    logger.info(`✓ MongoDB version: ${await mongoose.connection.db.admin().serverInfo().then(info => info.version)}`);
    process.exit(0);
  } catch (error) {
    logger.error('MongoDB verification failed:', error.message);
    if (error.name === 'MongoServerSelectionError') {
      logger.error('Please ensure MongoDB is installed and running:');
      logger.error('1. Install MongoDB: https://www.mongodb.com/try/download/community');
      logger.error('2. Start MongoDB service:');
      logger.error('   - Windows: Start MongoDB service in Services');
      logger.error('   - macOS: brew services start mongodb-community');
      logger.error('   - Linux: sudo systemctl start mongod');
    }
    process.exit(1);
  }
}

verifyMongoDB();