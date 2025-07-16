import winston from 'winston';

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      let logMessage = `${timestamp} ${level}: ${message}`;
      
      if (Object.keys(meta).length > 0) {
        try {
          const safeMetadata = JSON.stringify(meta, (key, value) => {
            if (
              key === 'Authorization' || 
              key.toLowerCase().includes('key') ||
              key.toLowerCase().includes('token') ||
              key.toLowerCase().includes('secret')
            ) {
              return '[REDACTED]';
            }
            
            if (typeof value === 'object' && value !== null) {
              const seen = new WeakSet();
              if (seen.has(value)) {
                return '[Circular]';
              }
              seen.add(value);
            }

            if (value instanceof Error) {
              return {
                message: value.message,
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
    })
  ]
});

logger.success = (...args) => logger.log('info', '✓', ...args);

export { logger };