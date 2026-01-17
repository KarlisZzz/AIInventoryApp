/**
 * Item Model
 * 
 * Represents physical inventory assets that can be lent to users.
 * 
 * Business Rules:
 * - Name, Category, and Status are required fields (FR-001)
 * - Status must be one of: "Available", "Lent", "Maintenance" (FR-007)
 * - Items with status "Lent" cannot be deleted (FR-004, FR-005)
 * - Items with status "Lent" or "Maintenance" cannot be lent (FR-014)
 * 
 * @see specs/001-inventory-lending/data-model.md
 * @see specs/001-inventory-lending/spec.md (FR-001 to FR-007)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Item = sequelize.define('Item', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique identifier for the item',
  },
  
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Item name is required'
      },
      len: {
        args: [1, 100],
        msg: 'Item name must be between 1 and 100 characters'
      }
    },
    comment: 'Name of the item (e.g., "Dell Laptop", "Projector")',
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 500],
        msg: 'Description must not exceed 500 characters'
      }
    },
    comment: 'Detailed description of the item',
  },
  
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Category is required'
      },
      len: {
        args: [1, 50],
        msg: 'Category must be between 1 and 50 characters'
      }
    },
    comment: 'Item category (e.g., "Hardware", "Tools", "Kitchen")',
  },
  
  status: {
    type: DataTypes.ENUM('Available', 'Lent', 'Maintenance'),
    allowNull: false,
    defaultValue: 'Available',
    validate: {
      isIn: {
        args: [['Available', 'Lent', 'Maintenance']],
        msg: 'Status must be Available, Lent, or Maintenance'
      }
    },
    comment: 'Current state of the item',
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
  tableName: 'Items',
  timestamps: true,
  
  indexes: [
    {
      name: 'idx_items_status',
      fields: ['status'],
      comment: 'Fast filtering by status (dashboard queries)',
    },
    {
      name: 'idx_items_category',
      fields: ['category'],
      comment: 'Fast filtering by category',
    },
    {
      name: 'idx_items_name',
      fields: ['name'],
      comment: 'Fast text search by name',
    },
    {
      name: 'idx_items_status_category',
      fields: ['status', 'category'],
      comment: 'Combined queries for dashboard',
    },
  ],
  
  hooks: {
    /**
     * Before deletion, verify item is not currently lent
     * Prevents orphaned lending logs (FR-004, FR-005)
     */
    beforeDestroy: async (item, options) => {
      if (item.status === 'Lent') {
        throw new Error('Cannot delete item that is currently lent out');
      }
      
      // Check if lending logs exist (if models are loaded)
      const LendingLog = require('./LendingLog');
      const logCount = await LendingLog.count({
        where: { itemId: item.id },
        transaction: options.transaction,
      });
      
      if (logCount > 0) {
        throw new Error('Cannot delete item with existing lending history (audit trail protection)');
      }
    },
  },
});

/**
 * Instance method: Check if item can be lent
 * 
 * @returns {boolean} True if item status is "Available"
 */
Item.prototype.canBeLent = function() {
  return this.status === 'Available';
};

/**
 * Instance method: Check if item can be returned
 * 
 * @returns {boolean} True if item status is "Lent"
 */
Item.prototype.canBeReturned = function() {
  return this.status === 'Lent';
};

/**
 * Instance method: Get status display color for UI
 * 
 * @returns {string} Color code for status badge
 */
Item.prototype.getStatusColor = function() {
  const colors = {
    'Available': 'green',
    'Lent': 'yellow',
    'Maintenance': 'red',
  };
  return colors[this.status] || 'gray';
};

/**
 * Class method: Find all available items
 * 
 * @param {Object} options - Query options
 * @returns {Promise<Item[]>}
 */
Item.findAvailable = function(options = {}) {
  return this.findAll({
    where: { status: 'Available' },
    order: [['name', 'ASC']],
    ...options,
  });
};

/**
 * Class method: Find all lent items
 * 
 * @param {Object} options - Query options
 * @returns {Promise<Item[]>}
 */
Item.findLent = function(options = {}) {
  return this.findAll({
    where: { status: 'Lent' },
    order: [['name', 'ASC']],
    ...options,
  });
};

/**
 * Class method: Search items by name, category, or description
 * 
 * @param {string} searchTerm - Search term
 * @param {Object} options - Query options
 * @returns {Promise<Item[]>}
 */
Item.search = async function(searchTerm, options = {}) {
  const { Op } = require('sequelize');
  
  return this.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.like]: `%${searchTerm}%` } },
        { category: { [Op.like]: `%${searchTerm}%` } },
        { description: { [Op.like]: `%${searchTerm}%` } },
      ],
    },
    order: [['name', 'ASC']],
    ...options,
  });
};

module.exports = Item;
