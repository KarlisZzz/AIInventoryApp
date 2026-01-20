/**
 * User Controller
 * 
 * HTTP request handlers for user operations.
 * Per FR-015, this feature scope is limited to READ-ONLY operations for user selection.
 * User CRUD operations are out of scope.
 * 
 * @see specs/001-inventory-lending/spec.md (FR-015)
 */

const User = require('../models/User');

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

module.exports = {
  getAllUsers,
  getUserById,
};
