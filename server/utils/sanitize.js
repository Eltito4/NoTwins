/**
 * Sanitization utilities to prevent XSS and injection attacks
 */

/**
 * Sanitize string input by removing potentially dangerous HTML/script tags
 * @param {string} input - The input string to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized string
 */
export function sanitizeString(input, maxLength = 500) {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove potentially dangerous characters for XSS
  sanitized = sanitized.replace(/[<>]/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize object with string fields
 * @param {Object} obj - Object to sanitize
 * @param {Array<string>} fields - Array of field names to sanitize
 * @param {number} maxLength - Maximum allowed length for strings
 * @returns {Object} - Sanitized object
 */
export function sanitizeObject(obj, fields, maxLength = 500) {
  const sanitized = {};

  fields.forEach(field => {
    if (obj[field] !== undefined) {
      if (typeof obj[field] === 'string') {
        sanitized[field] = sanitizeString(obj[field], maxLength);
      } else {
        sanitized[field] = obj[field];
      }
    }
  });

  return sanitized;
}

/**
 * Escape regex special characters to prevent ReDoS attacks
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
export function escapeRegex(str) {
  if (typeof str !== 'string') {
    return '';
  }
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate and sanitize MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {string|null} - Valid ID or null
 */
export function sanitizeObjectId(id) {
  if (typeof id !== 'string') {
    return null;
  }

  // MongoDB ObjectId is 24 hex characters
  const objectIdRegex = /^[a-f\d]{24}$/i;

  return objectIdRegex.test(id) ? id : null;
}

/**
 * Sanitize URL to prevent javascript: and data: schemes
 * @param {string} url - URL to sanitize
 * @returns {string|null} - Valid URL or null
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') {
    return null;
  }

  const trimmedUrl = url.trim();

  // Block javascript: and data: schemes
  if (/^(javascript|data|vbscript):/i.test(trimmedUrl)) {
    return null;
  }

  // Only allow http:// and https://
  if (!/^https?:\/\//i.test(trimmedUrl)) {
    return null;
  }

  return trimmedUrl;
}

/**
 * Sanitize email address
 * @param {string} email - Email to sanitize
 * @returns {string} - Sanitized email
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return '';
  }

  return email.toLowerCase().trim().substring(0, 255);
}

/**
 * Validate sort field against whitelist
 * @param {string} field - Field name to validate
 * @param {Array<string>} allowedFields - Whitelist of allowed fields
 * @param {string} defaultField - Default field if validation fails
 * @returns {string} - Valid field name
 */
export function validateSortField(field, allowedFields, defaultField) {
  if (typeof field !== 'string') {
    return defaultField;
  }

  return allowedFields.includes(field) ? field : defaultField;
}

export default {
  sanitizeString,
  sanitizeObject,
  escapeRegex,
  sanitizeObjectId,
  sanitizeUrl,
  sanitizeEmail,
  validateSortField
};
