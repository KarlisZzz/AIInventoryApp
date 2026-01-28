const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AdminAuditLog = sequelize.define('AdminAuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique identifier for the audit log entry',
  },
  
  adminUserId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
    comment: 'Administrator who performed the action',
  },
  
  action: {
    type: DataTypes.ENUM(
      'CREATE_CATEGORY',
      'UPDATE_CATEGORY',
      'DELETE_CATEGORY',
      'CREATE_USER',
      'UPDATE_USER',
      'DELETE_USER'
    ),
    allowNull: false,
    comment: 'Type of administrative action performed',
  },
  
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: {
        args: [['Category', 'User']],
        msg: 'Entity type must be Category or User',
      },
    },
    comment: 'Type of entity affected by the action',
  },
  
  entityId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'ID of the entity affected (not enforced FK due to soft deletes)',
  },
  
  details: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional context about the action (before/after states, etc.)',
  },
  
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When the action occurred',
  },
}, {
  tableName: 'AdminAuditLogs',
  timestamps: false, // Using custom timestamp field
  indexes: [
    {
      fields: ['adminUserId'],
      comment: 'Query logs by administrator',
    },
    {
      fields: ['timestamp'],
      comment: 'Query logs by time range',
    },
    {
      fields: ['entityType', 'entityId'],
      comment: 'Query history of specific entity',
    },
  ],
});

/**
 * Class method: Log an admin action
 * @param {Object} params - Action details
 * @returns {Promise<AdminAuditLog>}
 */
AdminAuditLog.logAction = async function({ adminUserId, action, entityType, entityId, details }) {
  return await AdminAuditLog.create({
    adminUserId,
    action,
    entityType,
    entityId,
    details,
    timestamp: new Date(),
  });
};

/**
 * Class method: Get recent actions by admin
 * @param {string} adminUserId - Admin user UUID
 * @param {number} limit - Max results (default 100)
 * @returns {Promise<Array>}
 */
AdminAuditLog.getRecentByAdmin = async function(adminUserId, limit = 100) {
  return await AdminAuditLog.findAll({
    where: { adminUserId },
    order: [['timestamp', 'DESC']],
    limit,
    include: [{
      model: require('./User'),
      as: 'admin',
      attributes: ['name', 'email'],
    }],
  });
};

/**
 * Class method: Get recent actions for dashboard
 * @param {number} limit - Max results (default 10)
 * @returns {Promise<Array>}
 */
AdminAuditLog.getRecentActions = async function(limit = 10) {
  return await AdminAuditLog.findAll({
    order: [['timestamp', 'DESC']],
    limit,
    include: [{
      model: require('./User'),
      as: 'admin',
      attributes: ['name', 'email'],
    }],
  });
};

module.exports = AdminAuditLog;
