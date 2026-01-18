/**
 * User Model
 * 
 * Represents staff members and borrowers who can interact with inventory items.
 * 
 * Business Rules:
 * - Name, Email, and Role are required fields (FR-008)
 * - Email must be valid format and unique across all users (FR-009)
 * - Users are selectable during lending operations (FR-010)
 * 
 * @see specs/001-inventory-lending/data-model.md
 * @see specs/001-inventory-lending/spec.md (FR-008 to FR-010)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique identifier for the user',
  },
  
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'User name is required',
      },
      len: {
        args: [1, 100],
        msg: 'User name must be between 1 and 100 characters',
      },
    },
    comment: "User's full name",
  },
  
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: {
      name: 'unique_email',
      msg: 'Email address already exists',
    },
    validate: {
      isEmail: {
        msg: 'Must be a valid email address',
      },
      notEmpty: {
        msg: 'Email is required',
      },
    },
    comment: "User's email address (unique identifier)",
  },
  
  role: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Borrower',
    validate: {
      notEmpty: {
        msg: 'Role is required',
      },
      len: {
        args: [1, 50],
        msg: 'Role must be between 1 and 50 characters',
      },
    },
    comment: 'User role (e.g., "Staff", "Admin", "Borrower")',
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
  },
}, {
  tableName: 'Users',
  timestamps: true,
  
  indexes: [
    {
      name: 'idx_users_email',
      unique: true,
      fields: ['email'],
      comment: 'Unique email constraint and fast lookup',
    },
    {
      name: 'idx_users_name',
      fields: ['name'],
      comment: 'Fast search by name',
    },
    {
      name: 'idx_users_role',
      fields: ['role'],
      comment: 'Filter by role',
    },
  ],
  
  hooks: {
    /**
     * Before deletion, verify user has no lending history
     * Prevents orphaned lending logs (audit trail protection)
     */
    beforeDestroy: async (user, options) => {
      // Check if lending logs exist (if models are loaded)
      const LendingLog = require('./LendingLog');
      const logCount = await LendingLog.count({
        where: { userId: user.id },
        transaction: options.transaction,
      });
      
      if (logCount > 0) {
        throw new Error('Cannot delete user with existing lending history (audit trail protection)');
      }
    },
    
    /**
     * Before save, normalize email to lowercase
     */
    beforeSave: (user) => {
      if (user.email) {
        user.email = user.email.toLowerCase().trim();
      }
    },
  },
});

/**
 * Instance method: Get user display name
 * 
 * @returns {string} User name with role
 */
User.prototype.getDisplayName = function() {
  return `${this.name} (${this.role})`;
};

/**
 * Instance method: Check if user is admin
 * 
 * @returns {boolean} True if user role is "Admin"
 */
User.prototype.isAdmin = function() {
  return this.role.toLowerCase() === 'admin';
};

/**
 * Instance method: Check if user is staff
 * 
 * @returns {boolean} True if user role is "Staff" or "Admin"
 */
User.prototype.isStaff = function() {
  const staffRoles = ['staff', 'admin'];
  return staffRoles.includes(this.role.toLowerCase());
};

/**
 * Class method: Find user by email
 * 
 * @param {string} email - User email
 * @param {Object} options - Query options
 * @returns {Promise<User|null>}
 */
User.findByEmail = function(email, options = {}) {
  return this.findOne({
    where: { email: email.toLowerCase().trim() },
    ...options,
  });
};

/**
 * Class method: Find users by role
 * 
 * @param {string} role - User role
 * @param {Object} options - Query options
 * @returns {Promise<User[]>}
 */
User.findByRole = function(role, options = {}) {
  return this.findAll({
    where: { role },
    order: [['name', 'ASC']],
    ...options,
  });
};

/**
 * Class method: Search users by name or email
 * 
 * @param {string} searchTerm - Search term
 * @param {Object} options - Query options
 * @returns {Promise<User[]>}
 */
User.search = async function(searchTerm, options = {}) {
  const { Op } = require('sequelize');
  
  return this.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.like]: `%${searchTerm}%` } },
        { email: { [Op.like]: `%${searchTerm}%` } },
      ],
    },
    order: [['name', 'ASC']],
    ...options,
  });
};

module.exports = User;
