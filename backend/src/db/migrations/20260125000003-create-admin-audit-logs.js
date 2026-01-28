/**
 * Migration: Create AdminAuditLogs Table
 * 
 * Creates the AdminAuditLogs table for tracking all administrative actions.
 * Includes foreign key to Users table and indexes for efficient querying.
 * 
 * @see specs/004-admin-management/data-model.md
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create AdminAuditLogs table
    await queryInterface.createTable('AdminAuditLogs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      adminUserId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      action: {
        type: Sequelize.ENUM(
          'CREATE_CATEGORY',
          'UPDATE_CATEGORY',
          'DELETE_CATEGORY',
          'CREATE_USER',
          'UPDATE_USER',
          'DELETE_USER'
        ),
        allowNull: false,
      },
      entityType: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      entityId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      details: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes for performance optimization
    await queryInterface.addIndex('AdminAuditLogs', ['adminUserId'], {
      name: 'idx_audit_admin_user',
    });

    await queryInterface.addIndex('AdminAuditLogs', ['timestamp'], {
      name: 'idx_audit_timestamp',
    });

    await queryInterface.addIndex('AdminAuditLogs', ['entityType', 'entityId'], {
      name: 'idx_audit_entity',
    });

    await queryInterface.addIndex('AdminAuditLogs', ['action'], {
      name: 'idx_audit_action',
    });

    console.log('✓ AdminAuditLogs table created with indexes');
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('AdminAuditLogs');
    console.log('✓ AdminAuditLogs table dropped');
  },
};
