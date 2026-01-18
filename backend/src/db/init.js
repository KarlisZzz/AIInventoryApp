/**
 * Database Initialization Script
 * 
 * Initializes the SQLite database connection, enables foreign key constraints,
 * and sets performance-optimized pragmas.
 * 
 * This script should be called before running migrations or starting the server.
 * 
 * @see specs/001-inventory-lending/data-model.md
 * @see Constitution Principle IV - Data Integrity
 */

const { sequelize, initializeDatabase } = require('../config/database');
const path = require('path');
const fs = require('fs');

/**
 * Initialize database and ensure data directory exists
 * 
 * @returns {Promise<void>}
 */
async function init() {
  try {
    console.log('🚀 Starting database initialization...\n');
    
    // Ensure data directory exists
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../../data/inventory.db');
    const dataDir = path.dirname(dbPath);
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`✓ Created data directory: ${dataDir}`);
    }
    
    // Initialize database connection and pragmas
    await initializeDatabase();
    
    console.log('\n✅ Database initialization complete\n');
    
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Close database connection gracefully
 * 
 * @returns {Promise<void>}
 */
async function closeConnection() {
  try {
    await sequelize.close();
    console.log('✓ Database connection closed');
  } catch (error) {
    console.error('✗ Error closing database:', error.message);
  }
}

// Run initialization if executed directly
if (require.main === module) {
  init()
    .then(() => {
      console.log('Database ready for migrations');
      return closeConnection();
    })
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  init,
  closeConnection,
};
