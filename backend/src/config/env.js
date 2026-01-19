/**
 * Environment Configuration Loader
 * 
 * Centralized configuration management with validation and defaults.
 * Loads environment variables with type conversion and fallbacks.
 * 
 * @see Constitution Principle V - Configuration Management
 */

require('dotenv').config();

/**
 * Get environment variable with type conversion
 * 
 * @param {string} key - Environment variable name
 * @param {*} defaultValue - Default value if not set
 * @param {string} type - Expected type: 'string' | 'number' | 'boolean'
 * @returns {*} Parsed environment variable value
 */
function getEnv(key, defaultValue, type = 'string') {
  const value = process.env[key];
  
  if (value === undefined) {
    return defaultValue;
  }
  
  switch (type) {
    case 'number':
      return parseInt(value, 10);
    case 'boolean':
      return value.toLowerCase() === 'true';
    case 'string':
    default:
      return value;
  }
}

/**
 * Application configuration object
 */
const config = {
  // Environment
  env: getEnv('NODE_ENV', 'development'),
  isDevelopment: getEnv('NODE_ENV', 'development') === 'development',
  isProduction: getEnv('NODE_ENV', 'development') === 'production',
  isTest: getEnv('NODE_ENV', 'development') === 'test',
  
  // Server
  server: {
    port: getEnv('PORT', 3001, 'number'),
    host: getEnv('HOST', '0.0.0.0'),
  },
  
  // API
  api: {
    version: getEnv('API_VERSION', 'v1'),
    prefix: `/api/${getEnv('API_VERSION', 'v1')}`,
  },
  
  // Database
  database: {
    path: getEnv('DB_PATH', './data/inventory.db'),
    cacheSize: getEnv('DB_CACHE_SIZE', -64000, 'number'),
    journalMode: getEnv('DB_JOURNAL_MODE', 'WAL'),
  },
  
  // CORS
  cors: {
    origin: getEnv('CORS_ORIGIN', 'http://localhost:5173'),
    credentials: true,
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: getEnv('RATE_LIMIT_WINDOW_MS', 60000, 'number'),
    maxRequests: getEnv('RATE_LIMIT_MAX_REQUESTS', 100, 'number'),
  },
  
  // Logging
  logging: {
    level: getEnv('LOG_LEVEL', 'info'),
    enableConsole: getEnv('LOG_ENABLE_CONSOLE', true, 'boolean'),
  },
};

/**
 * Validate required configuration
 * 
 * @throws {Error} If required configuration is missing
 */
function validateConfig() {
  const required = [
    { key: 'server.port', value: config.server.port },
    { key: 'database.path', value: config.database.path },
  ];
  
  const missing = required.filter(item => !item.value);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required configuration: ${missing.map(m => m.key).join(', ')}`,
    );
  }
}

// Validate on load
try {
  validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error.message);
  process.exit(1);
}

module.exports = config;
