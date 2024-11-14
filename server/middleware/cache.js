import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 60, // Cache for 1 minute
  checkperiod: 120,
  useClones: false
});

export const cacheMiddleware = (duration = 60) => {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.originalUrl || req.url}-${req.user?.id || 'anonymous'}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // Store the original json method
    const originalJson = res.json;
    
    // Override json method
    res.json = function(body) {
      // Restore original json method
      res.json = originalJson;
      
      // Cache the response
      cache.set(key, body, duration);
      
      // Send the response
      return res.json(body);
    };

    next();
  };
};