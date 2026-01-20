/**
 * Lending Routes
 * 
 * Defines HTTP endpoints for lending operations.
 * All routes prefixed with /api/v1/lending
 * 
 * @see specs/001-inventory-lending/contracts/api.yaml
 */

const express = require('express');
const router = express.Router();
const lendingController = require('../controllers/lendingController');

/**
 * POST /api/v1/lending/lend
 * 
 * Lend an item to a user (atomic operation)
 * 
 * Body: { itemId, userId, conditionNotes? }
 * Response: { data: { item, log }, error, message }
 */
router.post('/lend', lendingController.lendItem);

/**
 * POST /api/v1/lending/return
 * 
 * Return a lent item (atomic operation)
 * 
 * Body: { itemId, returnConditionNotes? }
 * Response: { data: { item, log }, error, message }
 */
router.post('/return', lendingController.returnItem);

/**
 * GET /api/v1/lending/history/:itemId
 * 
 * Get lending history for a specific item
 * 
 * Response: { data: LendingLog[], error, message }
 */
router.get('/history/:itemId', lendingController.getItemHistory);

/**
 * GET /api/v1/lending/current
 * 
 * Get all currently lent items (status = "Lent")
 * 
 * Response: { data: Item[], error, message }
 */
router.get('/current', lendingController.getCurrentLendings);

/**
 * GET /api/v1/lending/active
 * 
 * Get all active lending logs (dateReturned = NULL)
 * 
 * Response: { data: LendingLog[], error, message }
 */
router.get('/active', lendingController.getActiveLendings);

module.exports = router;
