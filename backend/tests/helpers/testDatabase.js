/**
 * Test Database Helper
 * Creates isolated Sequelize instances for each test suite to avoid index conflicts
 */

const { Sequelize } = require('sequelize');

/**
 * Create a fresh Sequelize instance for testing
 * Uses in-memory SQLite to avoid file conflicts
 */
function createTestDatabase() {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true,
    },
  });

  return sequelize;
}

module.exports = { createTestDatabase };
