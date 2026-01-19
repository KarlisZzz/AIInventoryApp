/**
 * Global Error Handler Middleware
 * 
 * Centralized error handling with proper logging and client-safe responses.
 * Maps common error types to appropriate HTTP status codes.
 * 
 * @see FR-003-API: Semantic HTTP status codes
 * @see Constitution Principle II - API Design Standards
 */

const config = require('../config/env');

/**
 * Application error class for custom errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Map Sequelize errors to HTTP status codes and error codes
 */
function mapSequelizeError(err) {
  const errorMap = {
    SequelizeValidationError: {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
    },
    SequelizeUniqueConstraintError: {
      statusCode: 409,
      code: 'DUPLICATE_ENTRY',
      message: 'Resource already exists',
    },
    SequelizeForeignKeyConstraintError: {
      statusCode: 400,
      code: 'FOREIGN_KEY_VIOLATION',
      message: 'Foreign key constraint violation',
    },
    SequelizeDatabaseError: {
      statusCode: 500,
      code: 'DATABASE_ERROR',
      message: 'Database operation failed',
    },
    SequelizeConnectionError: {
      statusCode: 503,
      code: 'DATABASE_UNAVAILABLE',
      message: 'Database connection failed',
    },
  };
  
  const mapping = errorMap[err.name];
  if (mapping) {
    return {
      statusCode: mapping.statusCode,
      code: mapping.code,
      message: mapping.message,
      details: config.isDevelopment ? {
        fields: err.fields,
        table: err.table,
        constraint: err.constraint,
      } : null,
    };
  }
  
  return null;
}

/**
 * Global error handler middleware
 * 
 * Must be registered AFTER all routes.
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  // Log error details (sanitized in production)
  if (config.isDevelopment) {
    console.error('=== ERROR START ===');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Request:', req.method, req.path);
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    console.error('=== ERROR END ===\n');
  } else {
    // Production: Log only essential info
    console.error({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      error: err.message,
      code: err.code || 'UNKNOWN',
    });
  }
  
  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }
  
  // Handle custom AppError
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      data: null,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      message: err.message,
    });
  }
  
  // Handle Sequelize errors
  const sequelizeError = mapSequelizeError(err);
  if (sequelizeError) {
    return res.status(sequelizeError.statusCode).json({
      data: null,
      error: {
        code: sequelizeError.code,
        message: sequelizeError.message,
        details: sequelizeError.details,
      },
      message: sequelizeError.message,
    });
  }
  
  // Handle validation errors (generic)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: config.isDevelopment ? err.errors : null,
      },
      message: 'Validation failed',
    });
  }
  
  // Handle JWT errors (if using authentication later)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      data: null,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
      message: 'Invalid authentication token',
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      data: null,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token expired',
      },
      message: 'Authentication token expired',
    });
  }
  
  // Default: Internal server error
  // Never expose internal error details in production
  const message = config.isDevelopment 
    ? err.message 
    : 'An unexpected error occurred';
  
  const details = config.isDevelopment 
    ? { stack: err.stack } 
    : null;
  
  return res.status(500).json({
    data: null,
    error: {
      code: 'INTERNAL_ERROR',
      message,
      details,
    },
    message,
  });
}

/**
 * Handle 404 - Route not found
 * 
 * Should be registered BEFORE error handler but AFTER all routes.
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    data: null,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.path}`,
      details: {
        method: req.method,
        path: req.path,
      },
    },
    message: 'Route not found',
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
  AppError,
};
