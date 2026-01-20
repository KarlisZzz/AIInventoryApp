/**
 * User Routes
 * 
 * Defines HTTP endpoints for user operations (READ-ONLY per FR-015).
 * All routes prefixed with /api/v1/users
 * 
 * Note: User CRUD operations are out of scope for this feature.
 * This implementation supports user selection during lending operations only.
 * 
 * @see specs/001-inventory-lending/spec.md (FR-015)
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

/**
 * GET /api/v1/users
 * 
 * Get all users with optional search filtering
 * 
 * Query params: ?search=term
 * Response: { data: User[], error, message }
 */
router.get('/', userController.getAllUsers);

/**
 * GET /api/v1/users/:id
 * 
 * Get a specific user by ID
 * 
 * Response: { data: User, error, message }
 */
router.get('/:id', userController.getUserById);

module.exports = router;
