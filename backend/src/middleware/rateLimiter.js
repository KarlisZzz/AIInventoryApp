/**
 * Rate Limiting Middleware
 * 
 * Protects API endpoints from abuse by limiting the number of requests per IP address.
 * Implements sliding window rate limiting.
 * 
 * Security Requirement: T141 - 100 requests per minute per IP
 * @see Phase 8: Security & Data Validation
 */

/**
 * In-memory store for request counts
 * For production with multiple servers, use Redis or similar
 */
const requestStore = new Map();

/**
 * Default rate limit configuration
 */
const DEFAULT_CONFIG = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,     // 100 requests per window
  message: 'Too many requests, please try again later',
  statusCode: 429,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

/**
 * Cleanup old entries periodically
 */
function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, data] of requestStore.entries()) {
    // Remove entries older than 5 minutes
    if (now - data.firstRequest > 5 * 60 * 1000) {
      requestStore.delete(key);
    }
  }
}

// Run cleanup every 2 minutes
setInterval(cleanupOldEntries, 2 * 60 * 1000);

/**
 * Get client identifier (IP address with X-Forwarded-For support)
 * 
 * @param {Object} req - Express request
 * @returns {string} Client identifier
 */
function getClientId(req) {
  // Check for forwarded IP (behind proxy/load balancer)
  const forwardedFor = req.get('X-Forwarded-For');
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, use the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  // Fall back to direct connection IP
  return req.ip || req.connection.remoteAddress;
}

/**
 * Create rate limiter middleware
 * 
 * @param {Object} options - Rate limiter configuration
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxRequests - Maximum requests per window
 * @param {string} options.message - Error message when limit exceeded
 * @param {number} options.statusCode - HTTP status code for rate limit response
 * @param {boolean} options.skipSuccessfulRequests - Don't count successful requests
 * @param {boolean} options.skipFailedRequests - Don't count failed requests
 * @returns {Function} Express middleware
 */
function createRateLimiter(options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };
  
  return (req, res, next) => {
    const clientId = getClientId(req);
    const now = Date.now();
    
    // Get or create client record
    let clientData = requestStore.get(clientId);
    
    if (!clientData) {
      // First request from this client
      clientData = {
        count: 0,
        firstRequest: now,
        resetTime: now + config.windowMs,
      };
      requestStore.set(clientId, clientData);
    }
    
    // Check if window has expired
    if (now > clientData.resetTime) {
      // Reset the window
      clientData.count = 0;
      clientData.firstRequest = now;
      clientData.resetTime = now + config.windowMs;
    }
    
    // Increment request count
    clientData.count++;
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - clientData.count));
    res.setHeader('X-RateLimit-Reset', new Date(clientData.resetTime).toISOString());
    
    // Check if limit exceeded
    if (clientData.count > config.maxRequests) {
      const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      
      return res.status(config.statusCode).json({
        data: null,
        error: 'RATE_LIMIT_EXCEEDED',
        message: config.message,
        retryAfter: retryAfter,
      });
    }
    
    // Track response status if needed
    if (config.skipSuccessfulRequests || config.skipFailedRequests) {
      const originalEnd = res.end;
      res.end = function(...args) {
        const statusCode = res.statusCode;
        
        // Decrement count if we should skip this type of request
        if ((config.skipSuccessfulRequests && statusCode < 400) ||
            (config.skipFailedRequests && statusCode >= 400)) {
          clientData.count--;
        }
        
        return originalEnd.apply(res, args);
      };
    }
    
    next();
  };
}

/**
 * Default rate limiter (100 req/min per IP)
 */
const rateLimiter = createRateLimiter();

/**
 * Strict rate limiter for sensitive endpoints (20 req/min)
 */
const strictRateLimiter = createRateLimiter({
  maxRequests: 20,
  message: 'Too many requests to sensitive endpoint, please try again later',
});

/**
 * Lenient rate limiter for read-only endpoints (200 req/min)
 */
const lenientRateLimiter = createRateLimiter({
  maxRequests: 200,
  message: 'Too many requests, please slow down',
});

/**
 * Get rate limiter statistics
 * 
 * @returns {Object} Statistics
 */
function getRateLimiterStats() {
  const stats = {
    totalClients: requestStore.size,
    clients: [],
    timestamp: new Date().toISOString(),
  };
  
  for (const [clientId, data] of requestStore.entries()) {
    stats.clients.push({
      ip: clientId,
      requests: data.count,
      windowStart: new Date(data.firstRequest).toISOString(),
      resetTime: new Date(data.resetTime).toISOString(),
    });
  }
  
  return stats;
}

/**
 * Clear rate limiter data for a specific client
 * 
 * @param {string} clientId - Client IP address
 */
function clearClientData(clientId) {
  requestStore.delete(clientId);
}

/**
 * Clear all rate limiter data
 */
function clearAllData() {
  requestStore.clear();
}

module.exports = {
  rateLimiter,
  strictRateLimiter,
  lenientRateLimiter,
  createRateLimiter,
  getRateLimiterStats,
  clearClientData,
  clearAllData,
};
