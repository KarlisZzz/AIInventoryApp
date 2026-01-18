/**
 * Migration: Create Users Table
 * 
 * Creates the Users table with UUID primary key and unique email constraint.
 * 
 * @see specs/001-inventory-lending/data-model.md
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Users table
    await queryInterface.createTable('Users', {
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
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      role: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'Borrower',
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

    // Add unique index on email
    await queryInterface.addIndex('Users', ['email'], {
      name: 'idx_users_email',
      unique: true,
    });

    // Add index on name for search
    await queryInterface.addIndex('Users', ['name'], {
      name: 'idx_users_name',
    });

    // Add index on role for filtering
    await queryInterface.addIndex('Users', ['role'], {
      name: 'idx_users_role',
    });

    console.log('✓ Users table created with indexes');
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Users');
    console.log('✓ Users table dropped');
  },
};
