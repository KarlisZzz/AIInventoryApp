/**
 * API Versioning Middleware
 * 
 * Enforces API versioning via URL path prefix /api/v1/ for all endpoints.
 * Rejects requests that don't use the versioned API prefix.
 * 
 * @see FR-001-API: System MUST implement API versioning via URL path prefix
 * @see Constitution Principle II - API Design Standards
 */

const API_VERSION = process.env.API_VERSION || 'v1';
const API_PREFIX = `/api/${API_VERSION}`;

/**
 * Middleware to enforce API versioning
 * 
 * Validates that all API requests use the correct versioned prefix.
 * Allows health check and other meta endpoints to bypass versioning.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function enforceApiVersion(req, res, next) {
  const { path } = req;
  
  // Allow health check and meta endpoints without versioning
  const allowedPaths = ['/health', '/ping', '/metrics', '/'];
  if (allowedPaths.includes(path)) {
    return next();
  }
  
  // Check if request uses versioned API prefix
  if (!path.startsWith(API_PREFIX)) {
    return res.status(400).json({
      data: null,
      error: {
        code: 'INVALID_API_VERSION',
        message: `API version prefix required. Use ${API_PREFIX} for all endpoints.`,
        details: {
          requestedPath: path,
          expectedPrefix: API_PREFIX,
        },
      },
      message: 'Invalid API version',
    });
  }
  
  // Add API version to request for logging/tracking
  req.apiVersion = API_VERSION;
  
  next();
}

/**
 * Get the current API version prefix
 * 
 * @returns {string} API version prefix (e.g., '/api/v1')
 */
function getApiPrefix() {
  return API_PREFIX;
}

/**
 * Get the current API version
 * 
 * @returns {string} API version (e.g., 'v1')
 */
function getApiVersion() {
  return API_VERSION;
}

module.exports = {
  enforceApiVersion,
  getApiPrefix,
  getApiVersion,
  API_PREFIX,
  API_VERSION,
};
