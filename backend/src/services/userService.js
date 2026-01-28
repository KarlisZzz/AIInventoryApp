/**
 * User Service
 * 
 * Business logic for user account management operations.
 * Implements safety checks, transactional operations, and audit logging.
 * 
 * Business Rules:
 * - Self-deletion prevention (FR-013): Admin cannot delete their own account
 * - Last admin prevention (FR-014): Cannot delete the last administrator
 * - Email uniqueness (FR-009): Email must be unique across all users
 * - Role validation: Must be 'administrator' or 'standard user'
 * - Password generation: Temporary passwords for new users (FR-011)
 * 
 * @see specs/004-admin-management/data-model.md
 * @see specs/004-admin-management/contracts/api-spec.yaml
 */

const { sequelize } = require('../config/database');
const User = require('../models/User');
const AdminAuditLog = require('../models/AdminAuditLog');
const emailService = require('./emailService');

/**
 * Get all users with optional role filter
 * 
 * @param {Object} options - Query options
 * @param {string} [options.roleFilter] - Filter by role ('administrator' or 'standard user')
 * @returns {Promise<User[]>} List of users
 * 
 * @example
 * const users = await getAllUsers();
 * const admins = await getAllUsers({ roleFilter: 'administrator' });
 */
async function getAllUsers(options = {}) {
  try {
    const { roleFilter } = options;
    
    const whereClause = {};
    if (roleFilter) {
      whereClause.role = roleFilter;
    }
    
    const users = await User.findAll({
      where: whereClause,
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
    });
    
    return users;
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    throw error;
  }
}

/**
 * Get user by ID
 * 
 * @param {string} userId - User UUID
 * @returns {Promise<User|null>} User object or null if not found
 * 
 * @example
 * const user = await getUserById('550e8400-e29b-41d4-a716-446655440000');
 */
async function getUserById(userId) {
  try {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
    });
    
    return user;
  } catch (error) {
    console.error('Error in getUserById:', error);
    throw error;
  }
}

/**
 * Create a new user account
 * 
 * Creates user with transaction and audit logging.
 * Generates temporary password and sends email notification.
 * 
 * @param {Object} data - User data
 * @param {string} data.name - User full name
 * @param {string} data.email - User email (must be unique)
 * @param {string} data.role - User role ('administrator' or 'standard user')
 * @param {string} adminUserId - ID of admin performing the action
 * @returns {Promise<Object>} Created user object with notification status
 * 
 * @throws {Error} If email already exists or validation fails
 * 
 * @example
 * const result = await createUser({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   role: 'standard user'
 * }, adminUserId);
 */
async function createUser(data, adminUserId) {
  const transaction = await sequelize.transaction();
  
  try {
    const { name, email, role } = data;
    
    // Validate required fields
    if (!name || !email || !role) {
      throw new Error('Name, email, and role are required');
    }
    
    // Check for duplicate email (case-insensitive)
    const existingUser = await User.findByEmail(email, { transaction });
    if (existingUser) {
      throw new Error('Email address already exists');
    }
    
    // Generate temporary password (in production, use crypto.randomBytes or similar)
    const temporaryPassword = `Temp${Math.random().toString(36).substring(2, 10)}!`;
    
    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role,
    }, { transaction });
    
    // Create audit log
    await AdminAuditLog.create({
      adminUserId,
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: user.id,
      details: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, { transaction });
    
    // Commit transaction
    await transaction.commit();
    
    // Send email notification (non-transactional - fire and forget)
    try {
      await emailService.sendUserCreatedEmail({
        email: user.email,
        name: user.name,
        role: user.role,
        temporaryPassword,
      });
    } catch (emailError) {
      console.error('Failed to send user creation email:', emailError);
      // Don't fail the operation if email fails
    }
    
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      emailSent: true,
      temporaryPassword, // Include in response for testing (remove in production)
    };
  } catch (error) {
    await transaction.rollback();
    console.error('Error in createUser:', error);
    throw error;
  }
}

/**
 * Update user account
 * 
 * Updates user information with transaction and audit logging.
 * Tracks changes for audit trail.
 * 
 * @param {string} userId - User UUID
 * @param {Object} data - Updated user data
 * @param {string} [data.name] - Updated name
 * @param {string} [data.email] - Updated email (must remain unique)
 * @param {string} [data.role] - Updated role
 * @param {string} adminUserId - ID of admin performing the action
 * @returns {Promise<User>} Updated user object
 * 
 * @throws {Error} If user not found, email already exists, or validation fails
 * 
 * @example
 * const user = await updateUser(userId, {
 *   name: 'John Smith',
 *   role: 'administrator'
 * }, adminUserId);
 */
async function updateUser(userId, data, adminUserId) {
  const transaction = await sequelize.transaction();
  
  try {
    const { name, email, role } = data;
    
    // Find existing user
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      throw new Error('User not found');
    }
    
    // Track changes for audit log
    const changes = {};
    
    // Update name if provided
    if (name !== undefined && name !== user.name) {
      changes.name = { from: user.name, to: name.trim() };
      user.name = name.trim();
    }
    
    // Update email if provided
    if (email !== undefined && email.toLowerCase().trim() !== user.email) {
      const newEmail = email.toLowerCase().trim();
      
      // Check for duplicate email
      const existingUser = await User.findByEmail(newEmail, { transaction });
      if (existingUser && existingUser.id !== userId) {
        throw new Error('Email address already exists');
      }
      
      changes.email = { from: user.email, to: newEmail };
      user.email = newEmail;
    }
    
    // Update role if provided
    if (role !== undefined && role !== user.role) {
      changes.role = { from: user.role, to: role };
      user.role = role;
    }
    
    // Save changes
    if (Object.keys(changes).length > 0) {
      await user.save({ transaction });
      
      // Create audit log
      await AdminAuditLog.create({
        adminUserId,
        action: 'UPDATE_USER',
        entityType: 'User',
        entityId: user.id,
        details: {
          changes,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      }, { transaction });
    }
    
    await transaction.commit();
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    await transaction.rollback();
    console.error('Error in updateUser:', error);
    throw error;
  }
}

/**
 * Delete user account
 * 
 * Deletes user with safety checks, transaction, and audit logging.
 * 
 * Safety Checks:
 * - Self-deletion prevention (FR-013): Cannot delete own account
 * - Last admin prevention (FR-014): Cannot delete last administrator
 * 
 * @param {string} userId - User UUID to delete
 * @param {string} adminUserId - ID of admin performing the action
 * @returns {Promise<Object>} Deletion result with deleted user info
 * 
 * @throws {Error} If safety checks fail or user not found
 * 
 * @example
 * const result = await deleteUser(userId, adminUserId);
 */
async function deleteUser(userId, adminUserId) {
  const transaction = await sequelize.transaction();
  
  try {
    // Safety Check 1: Prevent self-deletion (FR-013)
    if (userId === adminUserId) {
      throw new Error('Cannot delete your own account');
    }
    
    // Find user
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      throw new Error('User not found');
    }
    
    // Safety Check 2: Prevent last admin deletion (FR-014)
    if (user.role === 'administrator') {
      const canDeleteResult = await User.canDeleteAdmin(userId, { transaction });
      if (!canDeleteResult.canDelete) {
        throw new Error(canDeleteResult.reason);
      }
    }
    
    // Store user info for audit log before deletion
    const userInfo = {
      name: user.name,
      email: user.email,
      role: user.role,
    };
    
    // Soft delete: Set user as inactive instead of hard delete
    // This preserves audit trail and referential integrity
    await user.update({ active: false }, { transaction });
    
    // Create audit log
    await AdminAuditLog.create({
      adminUserId,
      action: 'DELETE_USER',
      entityType: 'User',
      entityId: userId,
      details: userInfo,
    }, { transaction });
    
    await transaction.commit();
    
    return {
      deleted: true,
      user: userInfo,
    };
  } catch (error) {
    await transaction.rollback();
    console.error('Error in deleteUser:', error);
    throw error;
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
