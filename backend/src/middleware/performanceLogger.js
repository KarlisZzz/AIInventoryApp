/**
 * Performance Logging Middleware
 * 
 * Logs response times for critical operations per FR-037:
 * - Lend operations
 * - Return operations
 * - Dashboard load
 * - Search operations
 * 
 * Enables performance monitoring and threshold alerting.
 */

/**
 * Simple logger for performance metrics
 * Uses console with timestamps and formatting
 */
const logger = {
  info: (message, data) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  warn: (message, data) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message, data) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

/**
 * Middleware to measure and log response time
 * 
 * @param {string} operationName - Name of the operation being measured
 * @param {number} thresholdMs - Warning threshold in milliseconds (optional)
 * @returns {Function} Express middleware
 */
function performanceLogger(operationName, thresholdMs = null) {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Store original end function
    const originalEnd = res.end;
    
    // Override end function to capture response time
    res.end = function(...args) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Build log message
      const logData = {
        operation: operationName,
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        status: res.statusCode,
        timestamp: new Date().toISOString(),
      };
      
      // Add query params if present
      if (Object.keys(req.query).length > 0) {
        logData.query = req.query;
      }
      
      // Add body params for POST/PUT (exclude sensitive data)
      if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
        const sanitizedBody = { ...req.body };
        delete sanitizedBody.password;
        delete sanitizedBody.token;
        logData.body = sanitizedBody;
      }
      
      // Log based on threshold
      if (thresholdMs && duration > thresholdMs) {
        logger.warn(`⚠️  Performance threshold exceeded: ${operationName}`, logData);
      } else {
        logger.info(`Performance: ${operationName}`, logData);
      }
      
      // Call original end function
      return originalEnd.apply(res, args);
    };
    
    next();
  };
}

/**
 * Create performance logger with default thresholds
 */
const performanceLoggers = {
  // Dashboard load: SC-004 (< 2 seconds)
  dashboard: performanceLogger('dashboard_load', 2000),
  
  // Search: SC-005 (< 1 second)
  search: performanceLogger('search', 1000),
  
  // Lend operation
  lend: performanceLogger('lend_item', 1000),
  
  // Return operation
  return: performanceLogger('return_item', 1000),
  
  // Item list
  itemsList: performanceLogger('items_list', 1000),
  
  // Lending history
  history: performanceLogger('lending_history', 1000),
  
  // Generic operation logger (no threshold)
  generic: (operationName) => performanceLogger(operationName),
};

module.exports = { performanceLogger, performanceLoggers };
