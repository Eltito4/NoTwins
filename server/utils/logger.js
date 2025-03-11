import winston from 'winston';

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      let logMessage = `${timestamp} ${level}: ${message}`;
      
      if (Object.keys(meta).length > 0) {
        try {
          // Custom replacer function to handle sensitive data
          const safeMetadata = JSON.stringify(meta, (key, value) => {
            // Redact sensitive information
            if (
              key === 'Authorization' || 
              key.toLowerCase().includes('key') ||
              key.toLowerCase().includes('token') ||
              key.toLowerCase().includes('secret')
            ) {
              return '[REDACTED]';
            }
            
            // Handle circular references
            if (typeof value === 'object' && value !== null) {
              const seen = new WeakSet();
              if (seen.has(value)) {
                return '[Circular]';
              }
              seen.add(value);
            }

            // Handle Error objects
            if (value instanceof Error) {
              return {
                message: value.message,
                stack: value.stack,
                ...value
              };
            }

            return value;
          }, 2);
          
          logMessage += `\nMetadata: ${safeMetadata}`;
        } catch (error) {
          logMessage += '\nMetadata: [Complex Object]';
        }
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
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.json()
      )
    }),
    new winston.transports.File({ 
      filename: 'combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.json()
      )
    })
  ]
});

// Add convenience methods for debugging
logger.debug = (...args) => logger.log('debug', ...args);
logger.success = (...args) => logger.log('info', '✓', ...args);

export { logger };