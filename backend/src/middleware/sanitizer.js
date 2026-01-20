/**
 * XSS Sanitization Middleware
 * 
 * Sanitizes user input to prevent cross-site scripting (XSS) attacks.
 * Removes potentially dangerous HTML/script tags from request body, query params, and URL params.
 * 
 * Security Requirement: T139
 * @see Phase 8: Security & Data Validation
 */

const xss = require('xss');

/**
 * XSS sanitization options
 * Allows basic formatting but removes dangerous tags and attributes
 */
const xssOptions = {
  whiteList: {}, // No HTML tags allowed
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
};

/**
 * Recursively sanitize an object's string values
 * 
 * @param {*} obj - Object to sanitize
 * @returns {*} Sanitized object
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // String: sanitize directly
  if (typeof obj === 'string') {
    return xss(obj, xssOptions);
  }
  
  // Array: sanitize each element
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  // Object: sanitize all properties
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  // Other types (number, boolean, etc.): return as-is
  return obj;
}

/**
 * XSS sanitization middleware
 * 
 * Sanitizes:
 * - req.body
 * - req.query
 * - req.params
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function sanitizeInput(req, res, next) {
  try {
    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    console.error('XSS sanitization error:', error);
    // Continue even if sanitization fails (log but don't block)
    next();
  }
}

/**
 * Sanitize a single string value
 * Useful for manual sanitization in specific cases
 * 
 * @param {string} value - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(value) {
  if (typeof value !== 'string') {
    return value;
  }
  return xss(value, xssOptions);
}

module.exports = {
  sanitizeInput,
  sanitizeString,
  sanitizeObject,
};
