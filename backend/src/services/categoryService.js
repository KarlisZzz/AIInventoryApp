/**
 * Category Service
 * 
 * Business logic for category management operations.
 * Implements CRUD operations with transaction support and audit logging.
 * 
 * Business Rules:
 * - Category names must be unique (case-insensitive) (FR-005)
 * - Cannot delete category if items are assigned to it (FR-004)
 * - All operations must be logged to AdminAuditLogs (FR-019)
 * - All state-changing operations must use transactions (Constitution Principle III)
 * 
 * @see specs/004-admin-management/data-model.md
 * @see specs/004-admin-management/spec.md (FR-001 to FR-007)
 */

const { Category, Item, AdminAuditLog, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all categories with item counts
 * 
 * Returns all categories ordered by name, with count of items in each category.
 * Used for category list display with usage statistics.
 * 
 * @returns {Promise<Array>} Array of categories with itemCount
 * @throws {Error} Database query errors
 * 
 * @example
 * const categories = await getAllCategories();
 * // [{ id: '...', name: 'Electronics', itemCount: 5, createdAt: '...', updatedAt: '...' }]
 */
async function getAllCategories() {
  try {
    const categories = await Category.findAll({
      attributes: [
        'id',
        'name',
        'createdAt',
        'updatedAt',
        [sequelize.fn('COUNT', sequelize.col('items.id')), 'itemCount'],
      ],
      include: [{
        model: Item,
        as: 'items',
        attributes: [],
        required: false,
      }],
      group: ['Category.id', 'Category.name', 'Category.createdAt', 'Category.updatedAt'],
      order: [['name', 'ASC']],
      raw: true,
    });

    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Failed to fetch categories');
  }
}

/**
 * Get category by ID
 * 
 * Retrieves a single category with its item count.
 * 
 * @param {string} id - Category UUID
 * @returns {Promise<Object|null>} Category with itemCount or null if not found
 * @throws {Error} Database query errors
 * 
 * @example
 * const category = await getCategoryById('123e4567-e89b-12d3-a456-426614174000');
 */
async function getCategoryById(id) {
  try {
    const category = await Category.findByPk(id, {
      attributes: [
        'id',
        'name',
        'createdAt',
        'updatedAt',
      ],
      include: [{
        model: Item,
        as: 'items',
        attributes: ['id'],
      }],
    });

    if (!category) {
      return null;
    }

    // Convert to plain object and add item count
    const plainCategory = category.toJSON();
    plainCategory.itemCount = plainCategory.items ? plainCategory.items.length : 0;
    delete plainCategory.items; // Remove items array, just keep count

    return plainCategory;
  } catch (error) {
    console.error('Error fetching category by ID:', error);
    throw new Error('Failed to fetch category');
  }
}

/**
 * Create new category
 * 
 * Creates a category with transaction support and audit logging.
 * Validates name uniqueness (case-insensitive) before creation.
 * 
 * @param {string} name - Category name (1-50 characters)
 * @param {string} adminUserId - Admin user performing the operation
 * @returns {Promise<Object>} Created category
 * @throws {Error} Validation errors or database errors
 * 
 * @example
 * const category = await createCategory('Electronics', 'admin-user-id');
 */
async function createCategory(name, adminUserId) {
  const transaction = await sequelize.transaction();

  try {
    // Validate name
    if (!name || typeof name !== 'string') {
      throw new Error('Category name is required');
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0 || trimmedName.length > 50) {
      throw new Error('Category name must be between 1 and 50 characters');
    }

    // Check for duplicate name (case-insensitive)
    const existingCategory = await Category.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('name')),
        sequelize.fn('LOWER', trimmedName)
      ),
      transaction,
    });

    if (existingCategory) {
      throw new Error('Category name already exists');
    }

    // Create category
    const category = await Category.create({
      name: trimmedName,
    }, { transaction });

    // Log action to audit log
    await AdminAuditLog.create({
      adminUserId,
      action: 'CREATE_CATEGORY',
      entityType: 'Category',
      entityId: category.id,
      details: {
        name: category.name,
      },
    }, { transaction });

    await transaction.commit();

    return category.toJSON();
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating category:', error);
    throw error;
  }
}

/**
 * Update category name
 * 
 * Updates category name with uniqueness validation and audit logging.
 * Uses transaction to ensure atomicity.
 * 
 * @param {string} id - Category UUID
 * @param {string} name - New category name
 * @param {string} adminUserId - Admin user performing the operation
 * @returns {Promise<Object>} Updated category
 * @throws {Error} Validation errors, not found, or database errors
 * 
 * @example
 * const updated = await updateCategory('category-id', 'Electronic Devices', 'admin-id');
 */
async function updateCategory(id, name, adminUserId) {
  const transaction = await sequelize.transaction();

  try {
    // Validate name
    if (!name || typeof name !== 'string') {
      throw new Error('Category name is required');
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0 || trimmedName.length > 50) {
      throw new Error('Category name must be between 1 and 50 characters');
    }

    // Find existing category
    const category = await Category.findByPk(id, { transaction });
    if (!category) {
      throw new Error('Category not found');
    }

    const oldName = category.name;

    // Check if name is actually changing
    if (oldName.toLowerCase() === trimmedName.toLowerCase()) {
      await transaction.rollback();
      return category.toJSON();
    }

    // Check for duplicate name (case-insensitive)
    const existingCategory = await Category.findOne({
      where: {
        id: { [Op.ne]: id },
        [Op.and]: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('name')),
          sequelize.fn('LOWER', trimmedName)
        ),
      },
      transaction,
    });

    if (existingCategory) {
      throw new Error('Category name already exists');
    }

    // Update category
    category.name = trimmedName;
    await category.save({ transaction });

    // Log action to audit log
    await AdminAuditLog.create({
      adminUserId,
      action: 'UPDATE_CATEGORY',
      entityType: 'Category',
      entityId: category.id,
      details: {
        oldName,
        newName: category.name,
      },
    }, { transaction });

    await transaction.commit();

    return category.toJSON();
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating category:', error);
    throw error;
  }
}

/**
 * Delete category
 * 
 * Deletes a category if no items are assigned to it.
 * Uses transaction and logs to audit trail.
 * 
 * @param {string} id - Category UUID
 * @param {string} adminUserId - Admin user performing the operation
 * @returns {Promise<Object>} Result with success status
 * @throws {Error} If category has items assigned or database errors
 * 
 * @example
 * const result = await deleteCategory('category-id', 'admin-id');
 * // { success: true, message: 'Category deleted successfully' }
 */
async function deleteCategory(id, adminUserId) {
  const transaction = await sequelize.transaction();

  try {
    // Find category with items
    const category = await Category.findByPk(id, {
      include: [{
        model: Item,
        as: 'items',
        attributes: ['id'],
      }],
      transaction,
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Check if category has items assigned
    const itemCount = category.items ? category.items.length : 0;
    if (itemCount > 0) {
      throw new Error(`Cannot delete category with ${itemCount} assigned item(s). Please reassign or delete the items first.`);
    }

    const categoryName = category.name;

    // Delete category
    await category.destroy({ transaction });

    // Log action to audit log
    await AdminAuditLog.create({
      adminUserId,
      action: 'DELETE_CATEGORY',
      entityType: 'Category',
      entityId: id,
      details: {
        name: categoryName,
        itemCount: 0,
      },
    }, { transaction });

    await transaction.commit();

    return {
      success: true,
      message: 'Category deleted successfully',
    };
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting category:', error);
    throw error;
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
