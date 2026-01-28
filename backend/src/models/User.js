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
    type: DataTypes.ENUM('administrator', 'standard user'),
    allowNull: false,
    defaultValue: 'standard user',
    validate: {
      isIn: {
        args: [['administrator', 'standard user']],
        msg: 'Role must be administrator or standard user',
      },
    },
    comment: 'User role: administrator (full access) or standard user (basic access)',
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
      unique: true,
      fields: ['email'],
      comment: 'Unique email constraint and fast lookup',
    },
    {
      fields: ['name'],
      comment: 'Fast search by name',
    },
    {
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
 * @returns {boolean} True if user role is "administrator"
 */
User.prototype.isAdmin = function() {
  return this.role === 'administrator';
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

/**
 * Class method: Count administrators in the system
 * 
 * @param {Object} options - Query options
 * @returns {Promise<number>} Number of administrators
 */
User.countAdministrators = async function(options = {}) {
  return this.count({
    where: { role: 'administrator' },
    ...options,
  });
};

/**
 * Class method: Check if an admin user can be deleted
 * Prevents deletion of the last administrator
 * 
 * @param {string} userId - User ID to check
 * @param {Object} options - Query options (include transaction)
 * @returns {Promise<{ canDelete: boolean, reason: string|null }>}
 */
User.canDeleteAdmin = async function(userId, options = {}) {
  const user = await this.findByPk(userId, options);
  
  if (!user) {
    return { canDelete: false, reason: 'User not found' };
  }
  
  if (user.role !== 'administrator') {
    return { canDelete: true, reason: null };
  }
  
  // Count total administrators
  const adminCount = await this.countAdministrators(options);
  
  if (adminCount <= 1) {
    return { canDelete: false, reason: 'Cannot delete the last administrator' };
  }
  
  return { canDelete: true, reason: null };
};

module.exports = User;
