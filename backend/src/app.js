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
const config = require('./config/env');
const { enforceApiVersion } = require('./middleware/apiVersion');
const { attachResponseHelpers } = require('./middleware/responseEnvelope');
const { requestLogger, performanceMonitor, getMetrics } = require('./middleware/logger');
const { sanitizeInput } = require('./middleware/validator');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// ============================================================================
// Global Middleware
// ============================================================================

// Request logging and performance monitoring
app.use(requestLogger);
app.use(performanceMonitor);

// CORS - Allow cross-origin requests from frontend
app.use(cors(config.cors));

// Body parsing - JSON and URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization - Remove null bytes and trim whitespace
app.use(sanitizeInput);

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
    version: config.api.version,
    documentation: `${config.api.prefix}/docs`,
  }, 'Welcome to Inventory & Lending API');
});

// Metrics endpoint (development only)
if (config.isDevelopment) {
  app.get('/metrics', (req, res) => {
    res.success(getMetrics(), 'Performance metrics');
  });
}

// ============================================================================
// API Routes (Versioned - /api/v1/)
// ============================================================================

// Item routes (T041)
const itemRoutes = require('./routes/items');
app.use('/api/v1/items', itemRoutes);

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler - Route not found (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
