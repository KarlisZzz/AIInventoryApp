/**
 * Database Configuration
 * 
 * Sequelize configuration for SQLite database with foreign key enforcement
 * and optimized pragmas for performance and data integrity.
 * 
 * @see specs/001-inventory-lending/data-model.md
 */

const { Sequelize } = require('sequelize');
const path = require('path');

// Database file path - default to data/inventory.db
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../data/inventory.db');

// Sequelize instance configuration
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: DB_PATH,
  
  // Logging - enable in development, disable in production
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  // Connection pool configuration (SQLite uses single connection)
  pool: {
    max: 1,
    min: 1,
    acquire: 30000,  // 30 seconds max to acquire connection
    idle: 10000,     // 10 seconds before releasing idle connection
  },
  
  // Global model defaults
  define: {
    timestamps: true,        // Adds createdAt and updatedAt automatically
    underscored: false,      // Use camelCase (not snake_case)
    freezeTableName: true,   // Don't pluralize table names
  },
  
  // Retry configuration for transient errors
  retry: {
    max: 3,
    timeout: 5000,
  },
});

/**
 * Initialize database connection and set SQLite pragmas
 * 
 * Pragmas enforce:
 * - Foreign key constraints (required by Constitution Principle IV)
 * - Write-Ahead Logging for better concurrency
 * - Optimized cache and synchronization settings
 * 
 * @returns {Promise<void>}
 */
async function initializeDatabase() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');
    
    // Set SQLite pragmas for foreign keys and performance
    await sequelize.query('PRAGMA foreign_keys = ON');
    await sequelize.query('PRAGMA journal_mode = WAL');
    await sequelize.query('PRAGMA synchronous = NORMAL');
    await sequelize.query('PRAGMA temp_store = MEMORY');
    await sequelize.query('PRAGMA cache_size = -64000');  // 64MB cache
    
    console.log('✓ SQLite pragmas configured successfully');
    
    // Verify foreign keys are enabled
    const [results] = await sequelize.query('PRAGMA foreign_keys');
    if (results[0].foreign_keys !== 1) {
      throw new Error('Failed to enable foreign key constraints');
    }
    
    console.log('✓ Foreign key constraints verified: ENABLED');
    
  } catch (error) {
    console.error('✗ Database initialization failed:', error.message);
    throw error;
  }
}

/**
 * Close database connection gracefully
 * 
 * @returns {Promise<void>}
 */
async function closeDatabase() {
  try {
    await sequelize.close();
    console.log('✓ Database connection closed');
  } catch (error) {
    console.error('✗ Error closing database connection:', error.message);
    throw error;
  }
}

module.exports = {
  sequelize,
  initializeDatabase,
  closeDatabase,
  Sequelize,
};
