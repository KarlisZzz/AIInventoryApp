/**
 * Item Controller
 * 
 * HTTP request handlers for inventory item management endpoints.
 * Validates input, delegates to service layer, and formats responses.
 * 
 * @see specs/001-inventory-lending/spec.md (FR-001 to FR-009)
 * @see specs/001-inventory-lending/contracts/api.yaml
 */

const itemService = require('../services/itemService');
const dashboardService = require('../services/dashboardService');

/**
 * Create a new item
 * POST /api/v1/items
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next middleware
 */
async function createItem(req, res, next) {
  try {
    const { name, description, category, status } = req.body;
    
    // Input validation (T038)
    if (!name || name.trim() === '') {
      return res.error('Item name is required', 400);
    }
    
    if (!category || category.trim() === '') {
      return res.error('Category is required', 400);
    }
    
    // Validate status enum if provided
    if (status) {
      const validStatuses = ['Available', 'Lent', 'Maintenance'];
      if (!validStatuses.includes(status)) {
        return res.error(
          `Status must be one of: ${validStatuses.join(', ')}`,
          400
        );
      }
    }
    
    // Validate field lengths
    if (name.length > 100) {
      return res.error('Item name must not exceed 100 characters', 400);
    }
    
    if (description && description.length > 500) {
      return res.error('Description must not exceed 500 characters', 400);
    }
    
    if (category.length > 50) {
      return res.error('Category must not exceed 50 characters', 400);
    }
    
    const item = await itemService.createItem({
      name,
      description,
      category,
      status,
    });
    
    return res.success(item, 'Item created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Get all items with optional filtering
 * GET /api/v1/items
 * Query params: ?status=Available&category=Hardware&search=laptop
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next middleware
 */
async function getAllItems(req, res, next) {
  try {
    const { status, category, search } = req.query;
    
    const filters = {};
    
    if (status) {
      filters.status = status;
    }
    
    if (category) {
      filters.category = category;
    }
    
    if (search) {
      filters.search = search;
    }
    
    const items = await itemService.getAllItems(filters);
    
    return res.success(
      items,
      `Retrieved ${items.length} item${items.length !== 1 ? 's' : ''}`
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Get item by ID
 * GET /api/v1/items/:id
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next middleware
 */
async function getItemById(req, res, next) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.error('Item ID is required', 400);
    }
    
    const item = await itemService.getItemById(id);
    
    return res.success(item, 'Item retrieved successfully');
  } catch (error) {
    if (error.message === 'Item not found') {
      return res.error('ITEM_NOT_FOUND', 'Item not found', 404);
    }
    next(error);
  }
}

/**
 * Update an item
 * PUT /api/v1/items/:id
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next middleware
 */
async function updateItem(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, category, status } = req.body;
    
    if (!id) {
      return res.error('Item ID is required', 400);
    }
    
    // Validate inputs if provided
    if (name !== undefined) {
      if (name.trim() === '') {
        return res.error('Item name cannot be empty', 400);
      }
      if (name.length > 100) {
        return res.error('Item name must not exceed 100 characters', 400);
      }
    }
    
    if (description !== undefined && description !== null && description.length > 500) {
      return res.error('Description must not exceed 500 characters', 400);
    }
    
    if (category !== undefined) {
      if (category.trim() === '') {
        return res.error('Category cannot be empty', 400);
      }
      if (category.length > 50) {
        return res.error('Category must not exceed 50 characters', 400);
      }
    }
    
    if (status !== undefined) {
      const validStatuses = ['Available', 'Lent', 'Maintenance'];
      if (!validStatuses.includes(status)) {
        return res.error(
          `Status must be one of: ${validStatuses.join(', ')}`,
          400
        );
      }
    }
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;
    
    if (Object.keys(updateData).length === 0) {
      return res.error('No fields to update', 400);
    }
    
    const item = await itemService.updateItem(id, updateData);
    
    return res.success(item, 'Item updated successfully');
  } catch (error) {
    if (error.message === 'Item not found') {
      return res.error('Item not found', 404);
    }
    next(error);
  }
}

/**
 * Delete an item
 * DELETE /api/v1/items/:id
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next middleware
 */
async function deleteItem(req, res, next) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.error('Item ID is required', 400);
    }
    
    await itemService.deleteItem(id);
    
    return res.success(null, 'Item deleted successfully');
  } catch (error) {
    if (error.message === 'Item not found') {
      return res.error('ITEM_NOT_FOUND', 'Item not found', 404);
    }
    
    // Handle specific deletion errors (T039)
    if (error.message.includes('Cannot delete')) {
      return res.error('DELETE_FORBIDDEN', error.message, 400);
    }
    
    next(error);
  }
}

/**
 * Search items
 * GET /api/v1/items/search
 * Query params: ?q=keyword
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next middleware
 */
async function searchItems(req, res, next) {
  try {
    const { q } = req.query;
    
    const items = await itemService.searchItems(q || '');
    
    return res.success(
      items,
      `Found ${items.length} matching item${items.length !== 1 ? 's' : ''}`
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Get all categories
 * GET /api/v1/items/categories
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next middleware
 */
async function getCategories(req, res, next) {
  try {
    const categories = await itemService.getAllCategories();
    
    return res.success(
      categories,
      `Retrieved ${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'}`
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Get dashboard data
 * GET /api/v1/dashboard
 * 
 * Returns items currently out and all items for dashboard overview.
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next middleware
 * 
 * @see specs/001-inventory-lending/spec.md (User Story 5)
 */
async function getDashboardData(req, res, next) {
  try {
    // Get items currently lent out with borrower information (T007)
    const currentlyOut = await dashboardService.getItemsCurrentlyOut();
    
    // Get all items with optional filtering
    const { status, category, search } = req.query;
    const filters = {};
    
    if (status) {
      filters.status = status;
    }
    
    if (category) {
      filters.category = category;
    }
    
    if (search) {
      filters.search = search;
    }
    
    const allItems = await itemService.getAllItems(filters);
    
    return res.success(
      {
        currentlyOut,
        allItems,
        stats: {
          totalItems: allItems.length,
          itemsOut: currentlyOut.length,
          itemsAvailable: allItems.filter(item => item.status === 'Available').length,
        },
      },
      'Dashboard data retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Upload image for an item
 * POST /api/v1/items/:id/image
 * 
 * Expects multipart/form-data with 'image' field.
 * File is processed by multer middleware before this controller.
 * 
 * @param {Request} req - Express request with req.file (from multer)
 * @param {Response} res - Express response
 * @param {Function} next - Express next middleware
 * 
 * @see specs/002-item-ui-enhancements/contracts/POST-items-id-image.md
 */
async function uploadImage(req, res, next) {
  try {
    const { id } = req.params;
    
    console.log(`🎯 uploadImage controller called for item: ${id}`);
    
    if (!id) {
      return res.error('Item ID is required', 400);
    }
    
    // Check if file was uploaded
    if (!req.file) {
      console.log('❌ No file in request');
      return res.error('Image file is required', 400);
    }
    
    console.log(`📁 File received: ${req.file.filename}`);
    
    // Update item with image URL
    const item = await itemService.uploadItemImage(id, req.file.filename);
    
    console.log(`✅ Item updated, imageUrl: ${item.imageUrl}`);
    
    return res.success(
      { 
        imageUrl: item.imageUrl,
        item: item 
      },
      'Image uploaded successfully',
      201
    );
  } catch (error) {
    console.log(`❌ Error in uploadImage: ${error.message}`);
    if (error.message === 'Item not found') {
      return res.error('ITEM_NOT_FOUND', 'Item not found', 404);
    }
    next(error);
  }
}

/**
 * Delete image from an item
 * DELETE /api/v1/items/:id/image
 * 
 * Removes the image file and clears the imageUrl field.
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next middleware
 * 
 * @see specs/002-item-ui-enhancements/contracts/DELETE-items-id-image.md
 */
async function deleteImage(req, res, next) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.error('Item ID is required', 400);
    }
    
    const item = await itemService.deleteItemImage(id);
    
    return res.success(
      { item: item },
      'Image deleted successfully'
    );
  } catch (error) {
    if (error.message === 'Item not found') {
      return res.error('ITEM_NOT_FOUND', 'Item not found', 404);
    }
    
    if (error.message === 'Item does not have an image') {
      return res.error('NO_IMAGE', 'Item does not have an image', 400);
    }
    
    next(error);
  }
}

module.exports = {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
  searchItems,
  getCategories,
  getDashboardData,
  uploadImage,
  deleteImage,
};
