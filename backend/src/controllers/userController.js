/**
 * User Controller
 * 
 * HTTP request handlers for user operations.
 * Includes:
 * - READ-ONLY operations for user selection (FR-015 from 001-inventory-lending)
 * - ADMIN user management operations (004-admin-management)
 * 
 * @see specs/001-inventory-lending/spec.md (FR-015)
 * @see specs/004-admin-management/contracts/api-spec.yaml
 */

const User = require('../models/User');
const userService = require('../services/userService');

/**
 * Get all users (for user selection during lending)
 * 
 * GET /api/v1/users
 * 
 * Query params:
 *   - search: Optional search term for name or email filtering
 * 
 * Response (200):
 * {
 *   "data": [ ... users ... ],
 *   "error": null,
 *   "message": "Users retrieved successfully"
 * }
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response (with envelope helpers)
 * @param {Function} next - Express next middleware
 */
async function getAllUsers(req, res, next) {
  try {
    const { search } = req.query;
    const { Op } = require('sequelize');

    let whereClause = {};

    // Optional search filter
    if (search) {
      whereClause = {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'role'],
      order: [['name', 'ASC']],
    });

    return res.success(users, 'Users retrieved successfully');

  } catch (error) {
    next(error);
  }
}

/**
 * Get a specific user by ID
 * 
 * GET /api/v1/users/:id
 * 
 * Response (200):
 * {
 *   "data": { ... user ... },
 *   "error": null,
 *   "message": "User retrieved successfully"
 * }
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response (with envelope helpers)
 * @param {Function} next - Express next middleware
 */
async function getUserById(req, res, next) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.error('VALIDATION_ERROR', 'User ID is required', 400);
    }

    const user = await User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'role', 'createdAt'],
    });

    if (!user) {
      return res.error('USER_NOT_FOUND', 'User not found', 404);
    }

    return res.success(user, 'User retrieved successfully');

  } catch (error) {
    next(error);
  }
}

/**
 * ADMIN USER MANAGEMENT OPERATIONS
 * Below are admin-only endpoints for user account management (004-admin-management)
 */

/**
 * GET /api/v1/admin/users
 * List all users with optional role filter (ADMIN ONLY)
 * 
 * Query Parameters:
 * - role: Filter by role ('administrator' or 'standard user')
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function getUsers(req, res) {
  try {
    const { role } = req.query;
    
    // Validate role filter if provided
    if (role && !['administrator', 'standard user'].includes(role)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Role must be administrator or standard user',
      });
    }
    
    const users = await userService.getAllUsers({ roleFilter: role });
    
    return res.status(200).json({
      data: users,
      message: 'Users retrieved successfully',
    });
  } catch (error) {
    console.error('Error in getUsers controller:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to retrieve users',
    });
  }
}

/**
 * GET /api/v1/admin/users/:userId
 * Get user by ID (ADMIN ONLY)
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function getAdminUserById(req, res) {
  try {
    const { userId } = req.params;
    
    const user = await userService.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found',
      });
    }
    
    return res.status(200).json({
      data: user,
      message: 'User retrieved successfully',
    });
  } catch (error) {
    console.error('Error in getAdminUserById controller:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to retrieve user',
    });
  }
}

/**
 * POST /api/v1/admin/users
 * Create new user account (ADMIN ONLY)
 * 
 * Body:
 * - name: User full name (required)
 * - email: User email (required, unique)
 * - role: User role (required, 'administrator' or 'standard user')
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function createUser(req, res) {
  try {
    const { name, email, role } = req.body;
    
    // Validate required fields
    if (!name || !email || !role) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, email, and role are required',
      });
    }
    
    // Validate role
    if (!['administrator', 'standard user'].includes(role)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Role must be administrator or standard user',
      });
    }
    
    // Validate email format (basic check)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid email format',
      });
    }
    
    // Get admin user ID from request (set by auth middleware)
    const adminUserId = req.user?.id;
    if (!adminUserId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }
    
    const result = await userService.createUser({ name, email, role }, adminUserId);
    
    return res.status(201).json({
      data: result.user,
      message: `User created successfully. Notification sent to ${result.user.email}`,
    });
  } catch (error) {
    console.error('Error in createUser controller:', error);
    
    // Handle specific errors
    if (error.message === 'Email address already exists') {
      return res.status(400).json({
        error: 'Email already in use',
        message: error.message,
      });
    }
    
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to create user',
    });
  }
}

/**
 * PUT /api/v1/admin/users/:userId
 * Update user account (ADMIN ONLY)
 * 
 * Body (at least one required):
 * - name: Updated name
 * - email: Updated email (must remain unique)
 * - role: Updated role
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function updateUser(req, res) {
  try {
    const { userId } = req.params;
    const { name, email, role } = req.body;
    
    // Validate at least one field is provided
    if (!name && !email && !role) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'At least one field (name, email, or role) must be provided',
      });
    }
    
    // Validate role if provided
    if (role && !['administrator', 'standard user'].includes(role)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Role must be administrator or standard user',
      });
    }
    
    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid email format',
        });
      }
    }
    
    // Get admin user ID from request
    const adminUserId = req.user?.id;
    if (!adminUserId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }
    
    const user = await userService.updateUser(userId, { name, email, role }, adminUserId);
    
    return res.status(200).json({
      data: user,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error in updateUser controller:', error);
    
    // Handle specific errors
    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'Not found',
        message: error.message,
      });
    }
    
    if (error.message === 'Email address already exists') {
      return res.status(400).json({
        error: 'Email already in use',
        message: error.message,
      });
    }
    
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to update user',
    });
  }
}

/**
 * DELETE /api/v1/admin/users/:userId
 * Delete user account (ADMIN ONLY)
 * 
 * Safety Checks:
 * - Cannot delete own account (self-deletion prevention)
 * - Cannot delete last administrator (last admin prevention)
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function deleteUser(req, res) {
  try {
    const { userId } = req.params;
    
    // Get admin user ID from request
    const adminUserId = req.user?.id;
    if (!adminUserId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }
    
    const result = await userService.deleteUser(userId, adminUserId);
    
    return res.status(200).json({
      message: 'User account deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteUser controller:', error);
    
    // Handle specific errors
    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'Not found',
        message: error.message,
      });
    }
    
    if (error.message === 'Cannot delete your own account') {
      return res.status(400).json({
        error: 'Bad request',
        message: error.message,
      });
    }
    
    if (error.message === 'Cannot delete the last administrator') {
      return res.status(400).json({
        error: 'Bad request',
        message: error.message,
      });
    }
    
    if (error.message.includes('lending history')) {
      return res.status(403).json({
        error: 'Cannot delete user',
        message: error.message,
      });
    }
    
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to delete user',
    });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  // Admin user management operations
  getUsers,
  getAdminUserById,
  createUser,
  updateUser,
  deleteUser,
};
