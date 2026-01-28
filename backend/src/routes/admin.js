/**
 * Admin Routes
 * 
 * Handles all administrative operations:
 * - Category management (CRUD)
 * - User account management (CRUD)
 * - Admin dashboard (stats and recent actions)
 * 
 * All routes require administrator role (enforced by requireAdmin middleware).
 * 
 * @see specs/004-admin-management/contracts/api-spec.yaml
 * @see specs/004-admin-management/spec.md
 */

const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');
const userController = require('../controllers/userController');
const adminController = require('../controllers/adminController');

// Apply requireAdmin middleware to all routes in this router
router.use(requireAdmin);

/**
 * Category Routes
 * 
 * GET    /categories       - List all categories with item counts
 * POST   /categories       - Create a new category
 * GET    /categories/:id   - Get category details
 * PUT    /categories/:id   - Update category name
 * DELETE /categories/:id   - Delete category (if no items assigned)
 */

router.get('/categories', categoryController.getCategories);
router.post('/categories', categoryController.createCategory);
router.get('/categories/:id', categoryController.getCategoryById);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

/**
 * User Routes
 * 
 * GET    /users       - List all users (optional role filter)
 * POST   /users       - Create a new user
 * GET    /users/:userId   - Get user details
 * PUT    /users/:userId   - Update user information
 * DELETE /users/:userId   - Delete user (with safety checks)
 */

router.get('/users', userController.getUsers);
router.post('/users', userController.createUser);
router.get('/users/:userId', userController.getAdminUserById);
router.put('/users/:userId', userController.updateUser);
router.delete('/users/:userId', userController.deleteUser);

/**
 * Dashboard Route
 * 
 * GET /dashboard - Get admin dashboard statistics and recent actions
 */

router.get('/dashboard', adminController.getDashboard);

module.exports = router;
