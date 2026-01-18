/**
 * Database Connection Manager
 * 
 * Manages async database connections with proper error handling,
 * health checks, and graceful shutdown.
 * 
 * @see specs/001-inventory-lending/data-model.md
 * @see Constitution Principle IV - Data Integrity
 */

const { sequelize, initializeDatabase, closeDatabase } = require('../config/database');

// Connection state management
let isConnected = false;
let connectionPromise = null;

/**
 * Get database connection
 * Establishes connection if not already connected
 * 
 * @returns {Promise<Sequelize>} Sequelize instance
 */
async function getConnection() {
  if (isConnected) {
    return sequelize;
  }
  
  // If connection is already in progress, wait for it
  if (connectionPromise) {
    await connectionPromise;
    return sequelize;
  }
  
  // Initialize new connection
  connectionPromise = initializeDatabase();
  
  try {
    await connectionPromise;
    isConnected = true;
    connectionPromise = null;
    return sequelize;
  } catch (error) {
    connectionPromise = null;
    throw error;
  }
}

/**
 * Check if database connection is healthy
 * 
 * @returns {Promise<boolean>} True if connection is healthy
 */
async function isHealthy() {
  try {
    if (!isConnected) {
      return false;
    }
    
    // Test connection with simple query
    await sequelize.authenticate();
    
    // Verify foreign keys are still enabled
    const [results] = await sequelize.query('PRAGMA foreign_keys');
    if (results[0].foreign_keys !== 1) {
      console.error('⚠️ Foreign key constraints are not enabled');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
    return false;
  }
}

/**
 * Close database connection gracefully
 * 
 * @returns {Promise<void>}
 */
async function close() {
  if (!isConnected) {
    return;
  }
  
  try {
    await closeDatabase();
    isConnected = false;
    connectionPromise = null;
  } catch (error) {
    console.error('Error closing database connection:', error.message);
    throw error;
  }
}

/**
 * Reconnect to database
 * Closes existing connection and establishes new one
 * 
 * @returns {Promise<Sequelize>} Sequelize instance
 */
async function reconnect() {
  console.log('🔄 Reconnecting to database...');
  
  if (isConnected) {
    await close();
  }
  
  return getConnection();
}

/**
 * Execute a function with automatic connection management
 * 
 * @param {Function} fn - Async function to execute
 * @returns {Promise<*>} Result of the function
 */
async function withConnection(fn) {
  await getConnection();
  return fn(sequelize);
}

// Graceful shutdown on process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, closing database connection...');
  await close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, closing database connection...');
  await close();
  process.exit(0);
});

module.exports = {
  getConnection,
  isHealthy,
  close,
  reconnect,
  withConnection,
  sequelize,
};
