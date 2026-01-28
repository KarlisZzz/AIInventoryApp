/**
 * Global teardown - runs once after all test files
 */
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  // Close database connection
  if (global.__SEQUELIZE__) {
    await global.__SEQUELIZE__.close();
  }
  
  // Clean up test database file
  const testDbPath = path.join(__dirname, '../data/test.db');
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
    } catch (error) {
      console.warn('Warning: Could not delete test database file:', error.message);
    }
  }
};
