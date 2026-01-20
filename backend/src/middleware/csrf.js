/**
 * CSRF Protection Middleware
 * 
 * Provides Cross-Site Request Forgery (CSRF) protection for state-changing operations.
 * For SPA applications with token-based auth, this is a simplified implementation.
 * 
 * Security Requirement: T140
 * @see Phase 8: Security & Data Validation
 * 
 * Note: This implementation uses a custom header approach suitable for SPAs.
 * For session-based apps, consider using csurf package instead.
 */

const crypto = require('crypto');

/**
 * Generate a CSRF token
 * 
 * @returns {string} CSRF token
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Token store (in-memory for simplicity)
 * For production with multiple servers, use Redis or similar
 */
const tokenStore = new Map();

/**
 * Token expiration time (1 hour)
 */
const TOKEN_EXPIRATION_MS = 60 * 60 * 1000;

/**
 * Cleanup expired tokens periodically
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of tokenStore.entries()) {
    if (now > data.expiresAt) {
      tokenStore.delete(token);
    }
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupExpiredTokens, 10 * 60 * 1000);

/**
 * Middleware to generate and send CSRF token
 * Should be applied to routes that serve the application
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function generateCsrfToken(req, res, next) {
  // Generate token
  const token = generateToken();
  const expiresAt = Date.now() + TOKEN_EXPIRATION_MS;
  
  // Store token with expiration
  tokenStore.set(token, {
    expiresAt,
    userAgent: req.get('user-agent'),
  });
  
  // Send token in response header
  res.setHeader('X-CSRF-Token', token);
  
  // Also make available via route if needed
  req.csrfToken = () => token;
  
  next();
}

/**
 * Middleware to verify CSRF token on state-changing requests
 * Should be applied to POST, PUT, DELETE, PATCH routes
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function verifyCsrfToken(req, res, next) {
  // Skip verification for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Get token from header (client must send it back)
  const token = req.get('X-CSRF-Token');
  
  if (!token) {
    return res.status(403).json({
      data: null,
      error: 'CSRF_TOKEN_MISSING',
      message: 'CSRF token is required for this operation',
    });
  }
  
  // Verify token exists and is valid
  const tokenData = tokenStore.get(token);
  
  if (!tokenData) {
    return res.status(403).json({
      data: null,
      error: 'CSRF_TOKEN_INVALID',
      message: 'Invalid or expired CSRF token',
    });
  }
  
  // Check expiration
  if (Date.now() > tokenData.expiresAt) {
    tokenStore.delete(token);
    return res.status(403).json({
      data: null,
      error: 'CSRF_TOKEN_EXPIRED',
      message: 'CSRF token has expired',
    });
  }
  
  // Optional: Verify user agent matches (defense in depth)
  const currentUserAgent = req.get('user-agent');
  if (tokenData.userAgent && currentUserAgent !== tokenData.userAgent) {
    return res.status(403).json({
      data: null,
      error: 'CSRF_TOKEN_INVALID',
      message: 'CSRF token validation failed',
    });
  }
  
  // Token is valid, remove it (single use)
  tokenStore.delete(token);
  
  next();
}

/**
 * Simple CSRF protection that doesn't require token exchange
 * Uses custom header approach - if header is present, request is from SPA
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function simpleCsrfProtection(req, res, next) {
  // Skip verification for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Check for custom header (must be set by client)
  // Browsers don't allow cross-origin custom headers without CORS
  const customHeader = req.get('X-Requested-With');
  
  if (customHeader === 'XMLHttpRequest' || req.get('Content-Type')?.includes('application/json')) {
    // Request is from our SPA
    return next();
  }
  
  // No custom header - potential CSRF attack
  return res.status(403).json({
    data: null,
    error: 'FORBIDDEN',
    message: 'Invalid request origin',
  });
}

/**
 * Get CSRF token stats (for monitoring)
 * 
 * @returns {Object} Token statistics
 */
function getCsrfStats() {
  return {
    activeTokens: tokenStore.size,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  generateCsrfToken,
  verifyCsrfToken,
  simpleCsrfProtection,
  getCsrfStats,
};
