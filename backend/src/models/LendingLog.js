/**
 * LendingLog Model
 * 
 * Tracks the complete history of lending transactions. Each log entry represents
 * one borrow-return cycle for a specific item and user.
 * 
 * Business Rules:
 * - LendingLog creation must be atomic with Item status update (FR-012)
 * - dateLent is set to current timestamp when item is lent (FR-013)
 * - Must reference valid Item ID and User ID via foreign keys (FR-015)
 * - dateReturned update must be atomic with Item status change (FR-017)
 * - dateReturned is set to current timestamp when item is returned (FR-018)
 * - All lending logs for an item must be retrievable (FR-020)
 * - Logs displayed in chronological order, most recent first (FR-021)
 * - Immutable audit trail - logs should not be deleted (FR-030)
 * 
 * @see specs/001-inventory-lending/data-model.md
 * @see specs/001-inventory-lending/spec.md (FR-012 to FR-022)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LendingLog = sequelize.define('LendingLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique identifier for the log entry',
  },
  
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Items',
      key: 'id'
    },
    onDelete: 'RESTRICT',        // Prevent item deletion if logs exist
    onUpdate: 'CASCADE',
    comment: 'Reference to the borrowed item',
  },
  
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'RESTRICT',        // Prevent user deletion if logs exist
    onUpdate: 'CASCADE',
    comment: 'Reference to the borrower',
  },
  
  dateLent: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    validate: {
      isDate: {
        msg: 'Date lent must be a valid date'
      },
      notNull: {
        msg: 'Date lent is required'
      }
    },
    comment: 'When the item was lent out',
  },
  
  dateReturned: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: {
        msg: 'Date returned must be a valid date'
      },
      isAfterLendDate(value) {
        if (value && this.dateLent && value < this.dateLent) {
          throw new Error('Date returned cannot be before date lent');
        }
      }
    },
    comment: 'When the item was returned (NULL if still out)',
  },
  
  conditionNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 1000],
        msg: 'Condition notes must not exceed 1000 characters'
      }
    },
    comment: 'Notes on item condition (at lend or return)',
  },
  
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Record creation timestamp',
  },
  
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Last update timestamp',
  }
}, {
  tableName: 'LendingLogs',
  timestamps: true,
  
  indexes: [
    {
      name: 'idx_lending_logs_item_id',
      fields: ['itemId'],
      comment: 'Fast history lookup by item',
    },
    {
      name: 'idx_lending_logs_user_id',
      fields: ['userId'],
      comment: 'Fast lookup by borrower',
    },
    {
      name: 'idx_lending_logs_date_lent',
      fields: ['dateLent'],
      comment: 'Chronological sorting',
    },
    {
      name: 'idx_lending_logs_date_returned',
      fields: ['dateReturned'],
      comment: 'Filter active loans (NULL check)',
    },
    {
      name: 'idx_lending_logs_item_date_returned',
      fields: ['itemId', 'dateReturned'],
      comment: 'Active loans per item',
    },
  ],
  
  hooks: {
    /**
     * Prevent deletion of lending logs (audit trail protection)
     */
    beforeDestroy: () => {
      throw new Error('Lending logs cannot be deleted (immutable audit trail)');
    },
  },
});

/**
 * Instance method: Check if loan is active (not returned yet)
 * 
 * @returns {boolean} True if dateReturned is null
 */
LendingLog.prototype.isActive = function() {
  return this.dateReturned === null;
};

/**
 * Instance method: Get loan duration in days
 * 
 * @returns {number} Duration in days (null if not returned yet)
 */
LendingLog.prototype.getDurationDays = function() {
  if (!this.dateReturned) {
    return null;
  }
  const diffMs = this.dateReturned - this.dateLent;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Instance method: Get current loan duration in days (for active loans)
 * 
 * @returns {number} Days since item was lent
 */
LendingLog.prototype.getCurrentDurationDays = function() {
  const endDate = this.dateReturned || new Date();
  const diffMs = endDate - this.dateLent;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Instance method: Format dates for display
 * 
 * @returns {Object} Formatted date strings
 */
LendingLog.prototype.getFormattedDates = function() {
  return {
    lent: this.dateLent.toLocaleDateString(),
    returned: this.dateReturned ? this.dateReturned.toLocaleDateString() : 'Not returned',
  };
};

/**
 * Class method: Find active lending log for an item
 * 
 * @param {string} itemId - Item UUID
 * @param {Object} options - Query options
 * @returns {Promise<LendingLog|null>}
 */
LendingLog.findActiveByItem = function(itemId, options = {}) {
  return this.findOne({
    where: {
      itemId,
      dateReturned: null,
    },
    ...options,
  });
};

/**
 * Class method: Find all active lending logs
 * 
 * @param {Object} options - Query options
 * @returns {Promise<LendingLog[]>}
 */
LendingLog.findAllActive = function(options = {}) {
  return this.findAll({
    where: {
      dateReturned: null,
    },
    order: [['dateLent', 'DESC']],
    ...options,
  });
};

/**
 * Class method: Find lending history for an item
 * 
 * @param {string} itemId - Item UUID
 * @param {Object} options - Query options
 * @returns {Promise<LendingLog[]>}
 */
LendingLog.findHistoryByItem = function(itemId, options = {}) {
  return this.findAll({
    where: { itemId },
    order: [['dateLent', 'DESC']],  // Most recent first (FR-021)
    ...options,
  });
};

/**
 * Class method: Find lending history for a user
 * 
 * @param {string} userId - User UUID
 * @param {Object} options - Query options
 * @returns {Promise<LendingLog[]>}
 */
LendingLog.findHistoryByUser = function(userId, options = {}) {
  return this.findAll({
    where: { userId },
    order: [['dateLent', 'DESC']],  // Most recent first
    ...options,
  });
};

/**
 * Class method: Find logs within date range
 * 
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Object} options - Query options
 * @returns {Promise<LendingLog[]>}
 */
LendingLog.findByDateRange = function(startDate, endDate, options = {}) {
  const { Op } = require('sequelize');
  
  return this.findAll({
    where: {
      dateLent: {
        [Op.between]: [startDate, endDate],
      },
    },
    order: [['dateLent', 'DESC']],
    ...options,
  });
};

module.exports = LendingLog;
