/**
 * Global setup - runs once before all test files
 */
const { sequelize, Category, User, Item, LendingLog, AdminAuditLog } = require('../src/models');

module.exports = async () => {
  try {
    // Force sync all models to create fresh tables
    // This ensures all tables including AdminAuditLog are created
    await sequelize.sync({ force: true });
    
    // Verify tables were created
    await sequelize.authenticate();
    
    console.log('✓ Test database initialized successfully');
    console.log('  Tables created: Users, Items, Categories, LendingLogs, AdminAuditLogs');
    
    // Store sequelize instance globally
    global.__SEQUELIZE__ = sequelize;
  } catch (error) {
    console.error('✗ Failed to initialize test database:', error);
    throw error;
  }
};
