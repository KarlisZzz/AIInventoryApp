/**
 * Model Index
 * 
 * Initializes all Sequelize models and establishes associations between them.
 * This file serves as the single entry point for importing all models.
 * 
 * Associations:
 * - Item (1) ──── (N) LendingLog: One item can have many lending logs
 * - User (1) ──── (N) LendingLog: One user can have many lending logs
 * - LendingLog (N) ──── (1) Item: Each log references exactly one item
 * - LendingLog (N) ──── (1) User: Each log references exactly one user
 * 
 * Cascade Behavior:
 * - DELETE: RESTRICT (prevents deletion if logs exist - audit trail protection)
 * - UPDATE: CASCADE (updates foreign keys if parent ID changes)
 * 
 * @see specs/001-inventory-lending/data-model.md
 */

const { sequelize, initializeDatabase, closeDatabase } = require('../config/database');

// Import models
const Item = require('./Item');
const User = require('./User');
const LendingLog = require('./LendingLog');
const Category = require('./Category');
const AdminAuditLog = require('./AdminAuditLog');

/**
 * Define Associations
 * 
 * Associations must be defined after all models are loaded to avoid
 * circular dependency issues.
 */

// Category associations
Category.hasMany(Item, {
  foreignKey: 'categoryId',
  as: 'items',
  onDelete: 'RESTRICT',     // Cannot delete category if items reference it
  onUpdate: 'CASCADE',
});

// Item associations
Item.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

Item.hasMany(LendingLog, {
  foreignKey: 'itemId',
  as: 'lendingLogs',
  onDelete: 'RESTRICT',     // Cannot delete item if lending logs exist
  onUpdate: 'CASCADE',
});

// User associations
User.hasMany(LendingLog, {
  foreignKey: 'borrowerId',  // Updated to match database schema
  as: 'lendingLogs',
  onDelete: 'RESTRICT',     // Cannot delete user if lending logs exist
  onUpdate: 'CASCADE',
});

User.hasMany(AdminAuditLog, {
  foreignKey: 'adminUserId',
  as: 'auditLogs',
  onDelete: 'RESTRICT',     // Cannot delete admin if audit logs exist
  onUpdate: 'CASCADE',
});

// LendingLog associations
LendingLog.belongsTo(Item, {
  foreignKey: 'itemId',
  as: 'item',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

LendingLog.belongsTo(User, {
  foreignKey: 'borrowerId',  // Updated to match database schema
  as: 'user',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

// AdminAuditLog associations
AdminAuditLog.belongsTo(User, {
  foreignKey: 'adminUserId',
  as: 'admin',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

/**
 * Synchronize models with database
 * 
 * WARNING: Use migrations in production, not sync()
 * This method is for development/testing only
 * 
 * @param {Object} options - Sequelize sync options
 * @returns {Promise<void>}
 */
async function syncModels(options = {}) {
  try {
    await sequelize.sync(options);
    console.log('✓ Database models synchronized');
  } catch (error) {
    console.error('✗ Error synchronizing models:', error.message);
    throw error;
  }
}

/**
 * Drop all tables (DANGEROUS - development only)
 * 
 * @returns {Promise<void>}
 */
async function dropAllTables() {
  try {
    await sequelize.drop();
    console.log('✓ All tables dropped');
  } catch (error) {
    console.error('✗ Error dropping tables:', error.message);
    throw error;
  }
}

/**
 * Test database connection and model definitions
 * 
 * @returns {Promise<boolean>}
 */
async function testConnection() {
  try {
    await initializeDatabase();
    console.log('✓ All models loaded successfully');
    console.log('  - Item');
    console.log('  - User');
    console.log('  - LendingLog');
    console.log('  - Category');
    console.log('  - AdminAuditLog');
    console.log('✓ Associations configured');
    return true;
  } catch (error) {
    console.error('✗ Connection test failed:', error.message);
    return false;
  }
}

// Export all models and utilities
module.exports = {
  // Database connection
  sequelize,
  initializeDatabase,
  closeDatabase,
  
  // Models
  Item,
  User,
  LendingLog,
  Category,
  AdminAuditLog,
  
  // Utilities
  syncModels,
  dropAllTables,
  testConnection,
};
