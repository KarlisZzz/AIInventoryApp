/**
 * Item Routes
 * 
 * Defines HTTP routes for inventory item management.
 * All routes are prefixed with /api/v1/items (enforced by app.js registration).
 * 
 * @see specs/001-inventory-lending/contracts/api.yaml
 * @see specs/001-inventory-lending/spec.md (FR-001 to FR-009)
 */

const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { performanceLoggers } = require('../middleware/performanceLogger');

// ============================================================================
// Item Routes
// ============================================================================

/**
 * GET /api/v1/items/categories
 * Get all unique categories
 * 
 * Response: 200 OK
 * Body: { data: string[], message: string }
 */
router.get('/categories', itemController.getCategories);

/**
 * GET /api/v1/items/search
 * Search items by keyword (name, description, category)
 * 
 * Query params:
 * - q: Search keyword
 * 
 * Response: 200 OK
 * Body: { data: Item[], message: string }
 */
router.get('/search', itemController.searchItems);

/**
 * POST /api/v1/items
 * Create a new inventory item
 * 
 * Body:
 * - name: string (required, max 100 chars)
 * - description: string (optional, max 500 chars)
 * - category: string (required, max 50 chars)
 * - status: 'Available' | 'Lent' | 'Maintenance' (optional, default: 'Available')
 * 
 * Response: 201 Created
 * Body: { data: Item, message: string }
 */
router.post('/', itemController.createItem);

/**
 * GET /api/v1/items
 * Get all items with optional filtering
 * 
 * Query params:
 * - status: 'Available' | 'Lent' | 'Maintenance'
 * - category: string
 * - search: string (searches name, description, category)
 * 
 * Response: 200 OK
 * Body: { data: Item[], message: string }
 */
router.get('/', performanceLoggers.search, itemController.getAllItems);

/**
 * GET /api/v1/items/:id
 * Get a single item by ID
 * 
 * Params:
 * - id: Item UUID
 * 
 * Response: 200 OK | 404 Not Found
 * Body: { data: Item, message: string }
 */
router.get('/:id', itemController.getItemById);

/**
 * PUT /api/v1/items/:id
 * Update an existing item
 * 
 * Params:
 * - id: Item UUID
 * 
 * Body (all optional):
 * - name: string (max 100 chars)
 * - description: string (max 500 chars)
 * - category: string (max 50 chars)
 * - status: 'Available' | 'Lent' | 'Maintenance'
 * 
 * Response: 200 OK | 404 Not Found
 * Body: { data: Item, message: string }
 */
router.put('/:id', itemController.updateItem);

/**
 * DELETE /api/v1/items/:id
 * Delete an item
 * 
 * Params:
 * - id: Item UUID
 * 
 * Business Rules:
 * - Cannot delete items with status "Lent" (FR-008)
 * - Cannot delete items with lending history (FR-009, audit trail protection)
 * 
 * Response: 200 OK | 400 Bad Request | 404 Not Found
 * Body: { data: null, message: string }
 */
router.delete('/:id', itemController.deleteItem);

module.exports = router;
