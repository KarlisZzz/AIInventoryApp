/**
 * Item Service
 * 
 * Business logic layer for inventory item management.
 * Handles validation, data transformation, and coordination between controllers and models.
 * 
 * @see specs/001-inventory-lending/spec.md (FR-001 to FR-009)
 * @see specs/001-inventory-lending/data-model.md
 */

const Item = require('../models/Item');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

/**
 * Create a new inventory item
 * 
 * @param {Object} itemData - Item data {name, description, category, status}
 * @returns {Promise<Item>} Created item
 * @throws {Error} If validation fails
 */
async function createItem(itemData) {
  const { name, description, category, status } = itemData;
  
  // Validate required fields
  if (!name || name.trim() === '') {
    throw new Error('Item name is required');
  }
  
  if (!category || category.trim() === '') {
    throw new Error('Category is required');
  }
  
  // Validate status if provided
  const validStatuses = ['Available', 'Lent', 'Maintenance'];
  if (status && !validStatuses.includes(status)) {
    throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
  }
  
  try {
    const item = await Item.create({
      name: name.trim(),
      description: description ? description.trim() : null,
      category: category.trim(),
      status: status || 'Available',
    });
    
    return item;
  } catch (error) {
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      throw new Error(error.errors.map(e => e.message).join(', '));
    }
    throw error;
  }
}

/**
 * Get all items with optional filtering
 * 
 * @param {Object} filters - Filter options {status, category, search}
 * @returns {Promise<Item[]>} List of items
 */
async function getAllItems(filters = {}) {
  const whereClause = {};
  
  // Filter by status
  if (filters.status) {
    whereClause.status = filters.status;
  }
  
  // Filter by category
  if (filters.category) {
    whereClause.category = filters.category;
  }
  
  // Search by name, description, or category
  if (filters.search && filters.search.trim() !== '') {
    const searchTerm = filters.search.trim();
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${searchTerm}%` } },
      { description: { [Op.like]: `%${searchTerm}%` } },
      { category: { [Op.like]: `%${searchTerm}%` } },
    ];
  }
  
  try {
    const items = await Item.findAll({
      where: whereClause,
      order: [['name', 'ASC']],
    });
    
    return items;
  } catch (error) {
    throw new Error(`Failed to fetch items: ${error.message}`);
  }
}

/**
 * Get item by ID
 * 
 * @param {string} id - Item UUID
 * @returns {Promise<Item>} Item
 * @throws {Error} If item not found
 */
async function getItemById(id) {
  if (!id) {
    throw new Error('Item ID is required');
  }
  
  try {
    const item = await Item.findByPk(id);
    
    if (!item) {
      throw new Error('Item not found');
    }
    
    return item;
  } catch (error) {
    if (error.message === 'Item not found') {
      throw error;
    }
    throw new Error(`Failed to fetch item: ${error.message}`);
  }
}

/**
 * Update an existing item
 * 
 * @param {string} id - Item UUID
 * @param {Object} updateData - Fields to update {name, description, category, status}
 * @returns {Promise<Item>} Updated item
 * @throws {Error} If item not found or validation fails
 */
async function updateItem(id, updateData) {
  if (!id) {
    throw new Error('Item ID is required');
  }
  
  try {
    const item = await Item.findByPk(id);
    
    if (!item) {
      throw new Error('Item not found');
    }
    
    // Validate status if being updated
    if (updateData.status) {
      const validStatuses = ['Available', 'Lent', 'Maintenance'];
      if (!validStatuses.includes(updateData.status)) {
        throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
      }
    }
    
    // Update allowed fields
    const allowedFields = ['name', 'description', 'category', 'status'];
    const fieldsToUpdate = {};
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        fieldsToUpdate[field] = typeof updateData[field] === 'string' 
          ? updateData[field].trim() 
          : updateData[field];
      }
    });
    
    await item.update(fieldsToUpdate);
    
    return item;
  } catch (error) {
    if (error.message === 'Item not found') {
      throw error;
    }
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      throw new Error(error.errors.map(e => e.message).join(', '));
    }
    
    throw new Error(`Failed to update item: ${error.message}`);
  }
}

/**
 * Delete an item
 * 
 * @param {string} id - Item UUID
 * @returns {Promise<void>}
 * @throws {Error} If item not found, currently lent, or has lending history (FR-008/FR-009)
 */
async function deleteItem(id) {
  if (!id) {
    throw new Error('Item ID is required');
  }
  
  const transaction = await sequelize.transaction();
  
  try {
    const item = await Item.findByPk(id, { transaction });
    
    if (!item) {
      await transaction.rollback();
      throw new Error('Item not found');
    }
    
    // FR-008: Prevent deletion of items with status "Lent"
    if (item.status === 'Lent') {
      await transaction.rollback();
      throw new Error('Cannot delete item that is currently lent out');
    }
    
    // FR-009: Prevent deletion of items with lending history (audit trail protection)
    const LendingLog = require('../models/LendingLog');
    const lendingHistoryCount = await LendingLog.count({
      where: { itemId: id },
      transaction,
    });
    
    if (lendingHistoryCount > 0) {
      await transaction.rollback();
      throw new Error('Cannot delete item with existing lending history (audit trail protection)');
    }
    
    // Safe to delete
    await item.destroy({ transaction });
    await transaction.commit();
  } catch (error) {
    // Only rollback if not already rolled back or committed
    if (!transaction.finished || transaction.finished === 'rollback') {
      // Transaction already rolled back in validation checks, skip
    } else if (transaction.finished !== 'commit') {
      await transaction.rollback();
    }
    
    // Re-throw known errors
    if (error.message.includes('Cannot delete') || error.message === 'Item not found') {
      throw error;
    }
    
    throw new Error(`Failed to delete item: ${error.message}`);
  }
}

/**
 * Search items by keyword (name, description, or category)
 * 
 * @param {string} keyword - Search keyword
 * @returns {Promise<Item[]>} Matching items
 */
async function searchItems(keyword) {
  if (!keyword || keyword.trim() === '') {
    return getAllItems();
  }
  
  const searchTerm = keyword.trim();
  
  try {
    const items = await Item.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${searchTerm}%` } },
          { description: { [Op.like]: `%${searchTerm}%` } },
          { category: { [Op.like]: `%${searchTerm}%` } },
        ],
      },
      order: [['name', 'ASC']],
    });
    
    return items;
  } catch (error) {
    throw new Error(`Failed to search items: ${error.message}`);
  }
}

/**
 * Get items currently lent out
 * 
 * @returns {Promise<Item[]>} Lent items
 */
async function getCurrentlyLentItems() {
  try {
    return await Item.findLent();
  } catch (error) {
    throw new Error(`Failed to fetch lent items: ${error.message}`);
  }
}

/**
 * Get items available for lending
 * 
 * @returns {Promise<Item[]>} Available items
 */
async function getAvailableItems() {
  try {
    return await Item.findAvailable();
  } catch (error) {
    throw new Error(`Failed to fetch available items: ${error.message}`);
  }
}

/**
 * Get items by category
 * 
 * @param {string} category - Category name
 * @returns {Promise<Item[]>} Items in category
 */
async function getItemsByCategory(category) {
  if (!category || category.trim() === '') {
    throw new Error('Category is required');
  }
  
  try {
    const items = await Item.findAll({
      where: { category: category.trim() },
      order: [['name', 'ASC']],
    });
    
    return items;
  } catch (error) {
    throw new Error(`Failed to fetch items by category: ${error.message}`);
  }
}

/**
 * Get all unique categories
 * 
 * @returns {Promise<string[]>} List of unique categories
 */
async function getAllCategories() {
  try {
    const items = await Item.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('category')), 'category']],
      order: [['category', 'ASC']],
      raw: true,
    });
    
    return items.map(item => item.category);
  } catch (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }
}

module.exports = {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
  searchItems,
  getCurrentlyLentItems,
  getAvailableItems,
  getItemsByCategory,
  getAllCategories,
};
