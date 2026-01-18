/**
 * Response Envelope Middleware
 * 
 * Wraps all API responses in a consistent JSON envelope format:
 * { data: <payload>, error: <error_object_or_null>, message: <string_or_null> }
 * 
 * @see FR-002-API: System MUST return all responses in consistent envelope
 * @see FR-003-API: System MUST use semantic HTTP status codes
 * @see Constitution Principle II - API Design Standards
 */

/**
 * Success response helper
 * 
 * Creates a standardized success response envelope.
 * 
 * @param {Object} res - Express response object
 * @param {*} data - Response data payload
 * @param {string} [message=null] - Optional success message
 * @param {number} [statusCode=200] - HTTP status code
 */
function success(res, data, message = null, statusCode = 200) {
  return res.status(statusCode).json({
    data,
    error: null,
    message,
  });
}

/**
 * Error response helper
 * 
 * Creates a standardized error response envelope.
 * 
 * @param {Object} res - Express response object
 * @param {string} errorCode - Error code identifier
 * @param {string} errorMessage - Human-readable error message
 * @param {number} [statusCode=400] - HTTP status code
 * @param {Object} [details=null] - Additional error details
 */
function error(res, errorCode, errorMessage, statusCode = 400, details = null) {
  const errorObject = {
    code: errorCode,
    message: errorMessage,
  };
  
  if (details) {
    errorObject.details = details;
  }
  
  return res.status(statusCode).json({
    data: null,
    error: errorObject,
    message: errorMessage,
  });
}

/**
 * Created response helper (201)
 * 
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} [message='Resource created successfully'] - Success message
 */
function created(res, data, message = 'Resource created successfully') {
  return success(res, data, message, 201);
}

/**
 * No content response helper (204)
 * 
 * @param {Object} res - Express response object
 */
function noContent(res) {
  return res.status(204).end();
}

/**
 * Not found response helper (404)
 * 
 * @param {Object} res - Express response object
 * @param {string} [message='Resource not found'] - Error message
 * @param {Object} [details=null] - Additional details
 */
function notFound(res, message = 'Resource not found', details = null) {
  return error(res, 'NOT_FOUND', message, 404, details);
}

/**
 * Bad request response helper (400)
 * 
 * @param {Object} res - Express response object
 * @param {string} [message='Bad request'] - Error message
 * @param {Object} [details=null] - Validation errors or details
 */
function badRequest(res, message = 'Bad request', details = null) {
  return error(res, 'BAD_REQUEST', message, 400, details);
}

/**
 * Internal server error response helper (500)
 * 
 * @param {Object} res - Express response object
 * @param {string} [message='Internal server error'] - Error message
 * @param {Object} [details=null] - Error details (sanitized for production)
 */
function serverError(res, message = 'Internal server error', details = null) {
  // In production, don't expose internal error details
  const errorDetails = process.env.NODE_ENV === 'production' ? null : details;
  return error(res, 'INTERNAL_ERROR', message, 500, errorDetails);
}

/**
 * Unauthorized response helper (401)
 * 
 * @param {Object} res - Express response object
 * @param {string} [message='Unauthorized'] - Error message
 */
function unauthorized(res, message = 'Unauthorized') {
  return error(res, 'UNAUTHORIZED', message, 401);
}

/**
 * Forbidden response helper (403)
 * 
 * @param {Object} res - Express response object
 * @param {string} [message='Forbidden'] - Error message
 */
function forbidden(res, message = 'Forbidden') {
  return error(res, 'FORBIDDEN', message, 403);
}

/**
 * Conflict response helper (409)
 * 
 * @param {Object} res - Express response object
 * @param {string} [message='Conflict'] - Error message
 * @param {Object} [details=null] - Conflict details
 */
function conflict(res, message = 'Conflict', details = null) {
  return error(res, 'CONFLICT', message, 409, details);
}

/**
 * Middleware to attach response helpers to res object
 * 
 * Makes envelope helpers available as res.success(), res.error(), etc.
 */
function attachResponseHelpers(req, res, next) {
  res.success = (data, message = null, statusCode = 200) => 
    success(res, data, message, statusCode);
  
  res.error = (errorCode, errorMessage, statusCode = 400, details = null) => 
    error(res, errorCode, errorMessage, statusCode, details);
  
  res.created = (data, message = 'Resource created successfully') => 
    created(res, data, message);
  
  res.noContent = () => noContent(res);
  
  res.notFound = (message = 'Resource not found', details = null) => 
    notFound(res, message, details);
  
  res.badRequest = (message = 'Bad request', details = null) => 
    badRequest(res, message, details);
  
  res.serverError = (message = 'Internal server error', details = null) => 
    serverError(res, message, details);
  
  res.unauthorized = (message = 'Unauthorized') => 
    unauthorized(res, message);
  
  res.forbidden = (message = 'Forbidden') => 
    forbidden(res, message);
  
  res.conflict = (message = 'Conflict', details = null) => 
    conflict(res, message, details);
  
  next();
}

module.exports = {
  attachResponseHelpers,
  success,
  error,
  created,
  noContent,
  notFound,
  badRequest,
  serverError,
  unauthorized,
  forbidden,
  conflict,
};
