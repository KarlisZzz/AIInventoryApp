/**
 * Lending Controller
 * 
 * HTTP request handlers for lending operations.
 * Handles validation, delegates to lending service, and formats responses.
 * 
 * @see specs/001-inventory-lending/spec.md (User Story 2)
 */

const lendingService = require('../services/lendingService');

/**
 * Lend an item to a user
 * 
 * POST /api/v1/lending/lend
 * 
 * Request body:
 * {
 *   "itemId": "uuid",
 *   "userId": "uuid",
 *   "conditionNotes": "optional string"
 * }
 * 
 * Response (200):
 * {
 *   "data": {
 *     "item": { ... },
 *     "log": { ... }
 *   },
 *   "error": null,
 *   "message": "Item lent successfully"
 * }
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response (with envelope helpers)
 * @param {Function} next - Express next middleware
 */
async function lendItem(req, res, next) {
  try {
    const { itemId, userId, conditionNotes } = req.body;

    // Validate required fields
    if (!itemId) {
      return res.error('VALIDATION_ERROR', 'Item ID is required', 400);
    }

    if (!userId) {
      return res.error('VALIDATION_ERROR', 'User ID is required', 400);
    }

    // Call service
    const result = await lendingService.lendItem(itemId, userId, conditionNotes);

    return res.success(result, 'Item lent successfully');

  } catch (error) {
    // Handle known validation errors
    if (error.message === 'Item not found') {
      return res.error('ITEM_NOT_FOUND', 'Item not found', 404);
    }

    if (error.message === 'User not found') {
      return res.error('USER_NOT_FOUND', 'User not found', 404);
    }

    if (error.message.includes('Cannot lend')) {
      return res.error('LEND_FORBIDDEN', error.message, 400);
    }

    // Pass unexpected errors to global error handler
    next(error);
  }
}

/**
 * Get lending history for an item
 * 
 * GET /api/v1/lending/history/:itemId
 * 
 * Response (200):
 * {
 *   "data": [ ... lending logs ... ],
 *   "error": null,
 *   "message": "Lending history retrieved successfully"
 * }
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response (with envelope helpers)
 * @param {Function} next - Express next middleware
 */
async function getItemHistory(req, res, next) {
  try {
    const { itemId } = req.params;

    if (!itemId) {
      return res.error('VALIDATION_ERROR', 'Item ID is required', 400);
    }

    const history = await lendingService.getItemLendingHistory(itemId);

    return res.success(history, 'Lending history retrieved successfully');

  } catch (error) {
    next(error);
  }
}

/**
 * Get all currently lent items
 * 
 * GET /api/v1/lending/current
 * 
 * Response (200):
 * {
 *   "data": [ ... items with status "Lent" ... ],
 *   "error": null,
 *   "message": "Currently lent items retrieved successfully"
 * }
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response (with envelope helpers)
 * @param {Function} next - Express next middleware
 */
async function getCurrentLendings(req, res, next) {
  try {
    const items = await lendingService.getCurrentlyLentItems();

    return res.success(items, 'Currently lent items retrieved successfully');

  } catch (error) {
    next(error);
  }
}

/**
 * Get all active lending logs (items still out)
 * 
 * GET /api/v1/lending/active
 * 
 * Response (200):
 * {
 *   "data": [ ... lending logs with dateReturned = NULL ... ],
 *   "error": null,
 *   "message": "Active lendings retrieved successfully"
 * }
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response (with envelope helpers)
 * @param {Function} next - Express next middleware
 */
async function getActiveLendings(req, res, next) {
  try {
    const logs = await lendingService.getActiveLendings();

    return res.success(logs, 'Active lendings retrieved successfully');

  } catch (error) {
    next(error);
  }
}

/**
 * Return a lent item
 * 
 * POST /api/v1/lending/return
 * 
 * Request body:
 * {
 *   "itemId": "uuid",
 *   "returnConditionNotes": "optional string"
 * }
 * 
 * Response (200):
 * {
 *   "data": {
 *     "item": { ... },
 *     "log": { ... }
 *   },
 *   "error": null,
 *   "message": "Item returned successfully"
 * }
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response (with envelope helpers)
 * @param {Function} next - Express next middleware
 */
async function returnItem(req, res, next) {
  try {
    const fs = require('fs');
    fs.appendFileSync('debug-return.log', `[controller PRE] req.body: ${JSON.stringify(req.body)}\n`);
    
    const { itemId, returnConditionNotes } = req.body;

    fs.appendFileSync('debug-return.log', `[controller POST] itemId: ${itemId}, returnConditionNotes: ${JSON.stringify(returnConditionNotes)}, typeof: ${typeof returnConditionNotes}\n`);

    // Validate required fields
    if (!itemId) {
      return res.error('VALIDATION_ERROR', 'Item ID is required', 400);
    }

    // Call service
    const result = await lendingService.returnItem(itemId, returnConditionNotes);

    return res.success(result, 'Item returned successfully');

  } catch (error) {
    // Handle known validation errors
    if (error.message === 'Item not found') {
      return res.error('ITEM_NOT_FOUND', 'Item not found', 404);
    }

    if (error.message.includes('Cannot return')) {
      return res.error('RETURN_FORBIDDEN', error.message, 400);
    }

    if (error.message.includes('No active lending record')) {
      return res.error('NO_ACTIVE_LENDING', error.message, 400);
    }

    // Pass unexpected errors to global error handler
    next(error);
  }
}

module.exports = {
  lendItem,
  returnItem,
  getItemHistory,
  getCurrentLendings,
  getActiveLendings,
};
