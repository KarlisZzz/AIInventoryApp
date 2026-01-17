/**
 * Migration: Create LendingLogs Table
 * 
 * Creates the LendingLogs table with foreign key constraints to Items and Users.
 * Enforces RESTRICT on delete to preserve audit trail.
 * 
 * @see specs/001-inventory-lending/data-model.md
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create LendingLogs table
    await queryInterface.createTable('LendingLogs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      itemId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Items',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      dateLent: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      dateReturned: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      conditionNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
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
    await queryInterface.addIndex('LendingLogs', ['itemId'], {
      name: 'idx_lending_logs_item_id',
    });

    await queryInterface.addIndex('LendingLogs', ['userId'], {
      name: 'idx_lending_logs_user_id',
    });

    await queryInterface.addIndex('LendingLogs', ['dateLent'], {
      name: 'idx_lending_logs_date_lent',
    });

    await queryInterface.addIndex('LendingLogs', ['dateReturned'], {
      name: 'idx_lending_logs_date_returned',
    });

    await queryInterface.addIndex('LendingLogs', ['itemId', 'dateReturned'], {
      name: 'idx_lending_logs_item_date_returned',
    });

    console.log('✓ LendingLogs table created with foreign keys and indexes');
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('LendingLogs');
    console.log('✓ LendingLogs table dropped');
  }
};
