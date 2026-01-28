/**
 * Category Controller
 * 
 * HTTP request handlers for category management endpoints.
 * Handles request validation, calls service layer, and formats responses.
 * 
 * All routes require administrator role (enforced by requireAdmin middleware).
 * 
 * @see specs/004-admin-management/contracts/api-spec.yaml
 * @see specs/004-admin-management/spec.md (FR-001 to FR-007)
 */

const categoryService = require('../services/categoryService');

/**
 * GET /api/v1/admin/categories
 * List all categories with item counts
 * 
 * Response: 200 OK with array of categories
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function getCategories(req, res) {
  try {
    const categories = await categoryService.getAllCategories();

    return res.success(categories, 'Categories retrieved successfully');
  } catch (error) {
    console.error('Get categories error:', error);
    return res.error(
      'GET_CATEGORIES_ERROR',
      'Failed to retrieve categories',
      500
    );
  }
}

/**
 * POST /api/v1/admin/categories
 * Create a new category
 * 
 * Request body: { name: string }
 * Response: 201 Created with new category
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function createCategory(req, res) {
  try {
    const { name } = req.body;
    const adminUserId = req.adminUserId;

    // Validate request body
    if (!name) {
      return res.error('VALIDATION_ERROR', 'Category name is required', 400);
    }

    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.error('VALIDATION_ERROR', 'Category name must be a non-empty string', 400);
    }

    if (name.trim().length > 50) {
      return res.error('VALIDATION_ERROR', 'Category name must not exceed 50 characters', 400);
    }

    // Create category
    const category = await categoryService.createCategory(name, adminUserId);

    return res.status(201).json({
      data: category,
      error: null,
      message: 'Category created successfully',
    });
  } catch (error) {
    console.error('Create category error:', error);

    // Handle specific errors
    if (error.message === 'Category name already exists') {
      return res.error('DUPLICATE_CATEGORY', 'Category name already exists', 409);
    }

    if (error.message.includes('must be between')) {
      return res.error('VALIDATION_ERROR', error.message, 400);
    }

    return res.error(
      'CREATE_CATEGORY_ERROR',
      'Failed to create category',
      500
    );
  }
}

/**
 * GET /api/v1/admin/categories/:id
 * Get category details by ID
 * 
 * Response: 200 OK with category details, or 404 if not found
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function getCategoryById(req, res) {
  try {
    const { id } = req.params;

    // Validate UUID format (basic check)
    if (!id || typeof id !== 'string') {
      return res.error('INVALID_ID', 'Invalid category ID', 400);
    }

    const category = await categoryService.getCategoryById(id);

    if (!category) {
      return res.error('NOT_FOUND', 'Category not found', 404);
    }

    return res.success(category, 'Category retrieved successfully');
  } catch (error) {
    console.error('Get category by ID error:', error);
    return res.error(
      'GET_CATEGORY_ERROR',
      'Failed to retrieve category',
      500
    );
  }
}

/**
 * PUT /api/v1/admin/categories/:id
 * Update category name
 * 
 * Request body: { name: string }
 * Response: 200 OK with updated category
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const adminUserId = req.adminUserId;

    // Validate ID
    if (!id || typeof id !== 'string') {
      return res.error('INVALID_ID', 'Invalid category ID', 400);
    }

    // Validate name
    if (!name) {
      return res.error('VALIDATION_ERROR', 'Category name is required', 400);
    }

    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.error('VALIDATION_ERROR', 'Category name must be a non-empty string', 400);
    }

    if (name.trim().length > 50) {
      return res.error('VALIDATION_ERROR', 'Category name must not exceed 50 characters', 400);
    }

    // Update category
    const category = await categoryService.updateCategory(id, name, adminUserId);

    return res.success(category, 'Category updated successfully');
  } catch (error) {
    console.error('Update category error:', error);

    // Handle specific errors
    if (error.message === 'Category not found') {
      return res.error('NOT_FOUND', 'Category not found', 404);
    }

    if (error.message === 'Category name already exists') {
      return res.error('DUPLICATE_CATEGORY', 'Category name already exists', 409);
    }

    if (error.message.includes('must be between')) {
      return res.error('VALIDATION_ERROR', error.message, 400);
    }

    return res.error(
      'UPDATE_CATEGORY_ERROR',
      'Failed to update category',
      500
    );
  }
}

/**
 * DELETE /api/v1/admin/categories/:id
 * Delete category (only if no items assigned)
 * 
 * Response: 200 OK with success message, or 409 if items assigned
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const adminUserId = req.adminUserId;

    // Validate ID
    if (!id || typeof id !== 'string') {
      return res.error('INVALID_ID', 'Invalid category ID', 400);
    }

    // Delete category
    const result = await categoryService.deleteCategory(id, adminUserId);

    return res.success(result, result.message);
  } catch (error) {
    console.error('Delete category error:', error);

    // Handle specific errors
    if (error.message === 'Category not found') {
      return res.error('NOT_FOUND', 'Category not found', 404);
    }

    if (error.message.includes('Cannot delete category with')) {
      return res.error('CATEGORY_HAS_ITEMS', error.message, 409);
    }

    return res.error(
      'DELETE_CATEGORY_ERROR',
      'Failed to delete category',
      500
    );
  }
}

module.exports = {
  getCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
