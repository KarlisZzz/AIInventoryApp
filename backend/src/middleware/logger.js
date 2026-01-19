/**
 * Request Logger Middleware
 * 
 * Logs incoming HTTP requests with timing, status codes, and sanitized data.
 * Excludes sensitive information from logs.
 * 
 * @see FR-037: Response time logging for performance monitoring
 * @see Constitution Principle V - Observability
 */

const config = require('../config/env');

/**
 * List of sensitive fields to exclude from logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
  'cookie',
];

/**
 * Sanitize object by removing sensitive fields
 * 
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitize(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const lowerKey = key.toLowerCase();
      
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitized[key] = sanitize(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
  }
  
  return sanitized;
}

/**
 * Format response time with appropriate unit
 * 
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time string
 */
function formatResponseTime(ms) {
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Get log color based on status code
 * 
 * @param {number} status - HTTP status code
 * @returns {string} ANSI color code
 */
function getStatusColor(status) {
  if (status >= 500) return '\x1b[31m'; // Red
  if (status >= 400) return '\x1b[33m'; // Yellow
  if (status >= 300) return '\x1b[36m'; // Cyan
  if (status >= 200) return '\x1b[32m'; // Green
  return '\x1b[0m'; // Reset
}

/**
 * Request logger middleware
 * 
 * Logs request details and response time.
 * Skip logging for health check endpoints to reduce noise.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // Skip logging for health check endpoints
  const skipPaths = ['/health', '/ping'];
  if (skipPaths.includes(req.path)) {
    return next();
  }
  
  // Log request start (only in development)
  if (config.isDevelopment) {
    console.log(`\n→ ${req.method} ${req.path}`);
    
    if (Object.keys(req.query).length > 0) {
      console.log('  Query:', sanitize(req.query));
    }
    
    if (Object.keys(req.body || {}).length > 0) {
      console.log('  Body:', sanitize(req.body));
    }
  }
  
  // Capture response details
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;
    
    const responseTime = Date.now() - startTime;
    // Set response time header here before the response is sent to avoid headers-sent errors
    try {
      res.setHeader('X-Response-Time', `${responseTime}ms`);
    } catch (e) {
      // ignore errors setting header
    }
    const statusColor = getStatusColor(res.statusCode);
    const reset = '\x1b[0m';
    
    // Log response
    if (config.isDevelopment) {
      console.log(
        `← ${statusColor}${res.statusCode}${reset} ${req.method} ${req.path} - ${formatResponseTime(responseTime)}`,
      );
    } else if (config.logging.level === 'info' || config.logging.level === 'debug') {
      // Production: Structured log
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        status: res.statusCode,
        responseTime: responseTime,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
      }));
    }
    
    // Log slow requests (> 1 second)
    if (responseTime > 1000) {
      console.warn(
        `⚠️  SLOW REQUEST: ${req.method} ${req.path} took ${formatResponseTime(responseTime)}`,
      );
    }
    
    return res.send(data);
  };
  
  next();
}

/**
 * Performance monitoring middleware
 * 
 * Tracks response times for performance analysis.
 * Can be extended to send metrics to monitoring service.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function performanceMonitor(req, res, next) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    // Response finished; header was set by requestLogger prior to sending
    
    // Store metrics for analysis (in-memory for now)
    // TODO: Send to monitoring service like Prometheus, DataDog, etc.
    if (!global.requestMetrics) {
      global.requestMetrics = [];
    }
    
    global.requestMetrics.push({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      responseTime,
    });
    
    // Keep only last 1000 metrics
    if (global.requestMetrics.length > 1000) {
      global.requestMetrics.shift();
    }
  });
  
  next();
}

/**
 * Get performance metrics summary
 * 
 * @returns {Object} Metrics summary
 */
function getMetrics() {
  if (!global.requestMetrics || global.requestMetrics.length === 0) {
    return { message: 'No metrics available' };
  }
  
  const metrics = global.requestMetrics;
  const responseTimes = metrics.map(m => m.responseTime);
  
  return {
    total: metrics.length,
    averageResponseTime: (responseTimes.reduce((a, b) => a + b, 0) / metrics.length).toFixed(2),
    minResponseTime: Math.min(...responseTimes),
    maxResponseTime: Math.max(...responseTimes),
    slowRequests: metrics.filter(m => m.responseTime > 1000).length,
    statusCodes: metrics.reduce((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {}),
  };
}

module.exports = {
  requestLogger,
  performanceMonitor,
  getMetrics,
  sanitize,
};
