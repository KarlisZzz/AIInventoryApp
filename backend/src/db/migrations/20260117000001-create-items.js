/**
 * Migration: Create Items Table
 * 
 * Creates the Items table with UUID primary key, status enum, and indexes
 * for optimized querying.
 * 
 * @see specs/001-inventory-lending/data-model.md
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Items table
    await queryInterface.createTable('Items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('Available', 'Lent', 'Maintenance'),
        allowNull: false,
        defaultValue: 'Available',
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

    // Add indexes for performance optimization
    await queryInterface.addIndex('Items', ['status'], {
      name: 'idx_items_status',
    });

    await queryInterface.addIndex('Items', ['category'], {
      name: 'idx_items_category',
    });

    await queryInterface.addIndex('Items', ['name'], {
      name: 'idx_items_name',
    });

    await queryInterface.addIndex('Items', ['status', 'category'], {
      name: 'idx_items_status_category',
    });

    console.log('✓ Items table created with indexes');
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Items');
    console.log('✓ Items table dropped');
  },
};
