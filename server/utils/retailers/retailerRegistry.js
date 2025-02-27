import { logger } from '../logger.js';
import { carolinaHerreraConfig } from './configs/carolina-herrera.js';

// Registry of known retailer configurations
const retailerRegistry = {
  // Spanish retailers
  'carolinaherrera.com': carolinaHerreraConfig,
  
  // Add more retailers as needed
};

/**
 * Get a retailer configuration by domain
 * @param {string} hostname - The hostname to look up
 * @returns {object|null} - The retailer configuration or null if not found
 */
export function getRegisteredRetailerConfig(hostname) {
  // Normalize hostname
  const normalizedHostname = hostname.toLowerCase().replace(/^www\./, '');
  
  // Direct match
  if (retailerRegistry[normalizedHostname]) {
    return retailerRegistry[normalizedHostname];
  }
  
  // Partial match
  for (const [domain, config] of Object.entries(retailerRegistry)) {
    if (normalizedHostname.includes(domain)) {
      logger.debug(`Found partial match for ${normalizedHostname} with ${domain}`);
      return config;
    }
  }
  
  return null;
}

/**
 * Register a new retailer configuration
 * @param {string} domain - The domain to register
 * @param {object} config - The retailer configuration
 */
export function registerRetailerConfig(domain, config) {
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
  retailerRegistry[normalizedDomain] = config;
  logger.info(`Registered configuration for ${normalizedDomain}`);
}

/**
 * Get all registered retailer domains
 * @returns {string[]} - Array of registered domains
 */
export function getRegisteredRetailers() {
  return Object.keys(retailerRegistry);
}