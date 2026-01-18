/**
 * Express Application Setup
 * 
 * Configures Express app with middleware, routing, and error handling.
 * Implements API versioning and response envelope standards.
 * 
 * @see FR-001-API: API versioning via /api/v1/ prefix
 * @see FR-002-API: Consistent JSON envelope format
 * @see FR-003-API: Semantic HTTP status codes
 * @see Constitution Principle II - API Design Standards
 */

const express = require('express');
const cors = require('cors');
const { enforceApiVersion } = require('./middleware/apiVersion');
const { attachResponseHelpers } = require('./middleware/responseEnvelope');

const app = express();

// ============================================================================
// Global Middleware
// ============================================================================

// CORS - Allow cross-origin requests from frontend
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing - JSON and URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Response envelope helpers - Attach before routes (FR-002-API)
app.use(attachResponseHelpers);

// API versioning enforcement - Must come before routes (FR-001-API)
app.use(enforceApiVersion);

// ============================================================================
// Health Check & Meta Endpoints (No versioning required)
// ============================================================================

app.get('/health', (req, res) => {
  res.success({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }, 'Service is running');
});

app.get('/ping', (req, res) => {
  res.success({ pong: true }, 'Pong!');
});

app.get('/', (req, res) => {
  res.success({
    name: 'Inventory & Lending API',
    version: process.env.API_VERSION || 'v1',
    documentation: '/api/v1/docs',
  }, 'Welcome to Inventory & Lending API');
});

// ============================================================================
// API Routes (Versioned - /api/v1/)
// ============================================================================

// TODO: Register route modules here as they are created
// Example:
// const itemRoutes = require('./routes/items');
// app.use('/api/v1/items', itemRoutes);

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler - Route not found
app.use((req, res) => {
  res.notFound(`Route not found: ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
  });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.badRequest('Validation failed', {
      errors: err.errors || err.message,
    });
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.conflict('Resource already exists', {
      fields: err.fields,
    });
  }
  
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.badRequest('Foreign key constraint violation', {
      fields: err.fields,
      table: err.table,
    });
  }
  
  // Default to 500 internal server error
  res.serverError(
    err.message || 'An unexpected error occurred',
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : null,
  );
});

module.exports = app;
