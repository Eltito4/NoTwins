import winston from 'winston';

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      let logMessage = `${timestamp} ${level}: ${message}`;
      
      // Handle metadata objects
      if (Object.keys(meta).length > 0) {
        try {
          // Custom replacer function to handle circular references
          const seen = new WeakSet();
          const safeMetadata = JSON.parse(JSON.stringify(meta, (key, value) => {
            // Skip internal axios and http objects
            if (['socket', 'agent', 'request', 'response', 'config'].includes(key)) {
              return undefined;
            }
            
            // Handle circular references
            if (typeof value === 'object' && value !== null) {
              if (seen.has(value)) {
                return '[Circular]';
              }
              seen.add(value);
            }
            return value;
          }));
          
          logMessage += `\nMetadata: ${JSON.stringify(safeMetadata, null, 2)}`;
        } catch (error) {
          // Fallback for any stringification errors
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
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      options: { flags: 'w' }
    })
  ]
});

// Add convenience methods for debugging
logger.debug = (...args) => logger.log('debug', ...args);
logger.success = (...args) => logger.log('info', '✓', ...args);

export { logger };