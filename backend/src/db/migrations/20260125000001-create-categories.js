/**
 * Migration: Create Categories Table
 * 
 * Creates the Categories table with UUID primary key and case-insensitive
 * unique constraint on category names.
 * 
 * @see specs/004-admin-management/data-model.md
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Categories table
    await queryInterface.createTable('Categories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add index for case-insensitive uniqueness (SQLite doesn't support functional indexes in all versions)
    // So we'll enforce this at the application level in the model
    await queryInterface.addIndex('Categories', ['name'], {
      name: 'idx_categories_name',
      unique: true,
    });

    console.log('✓ Categories table created with indexes');
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Categories');
    console.log('✓ Categories table dropped');
  },
};
