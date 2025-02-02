import winston from 'winston';

const logger = winston.createLogger({
  level: 'debug', // Change to debug level
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      let logMessage = `${timestamp} ${level}: ${message}`;
      if (Object.keys(meta).length > 0) {
        logMessage += `\nMetadata: ${JSON.stringify(meta, null, 2)}`;
      }
      return logMessage;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log',
      options: { flags: 'w' } // Overwrite file on restart
    })
  ]
});

// Add convenience methods for debugging
logger.debug = (...args) => logger.log('debug', ...args);
logger.success = (...args) => logger.log('info', '✓', ...args);

export { logger };