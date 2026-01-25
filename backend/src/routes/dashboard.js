/**
 * Dashboard Routes
 * 
 * Defines HTTP routes for dashboard data retrieval.
 * All routes are prefixed with /api/v1/dashboard (enforced by app.js registration).
 * 
 * @see specs/001-inventory-lending/spec.md (User Story 5 - Dashboard Overview)
 */

const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const dashboardController = require('../controllers/dashboardController');
const { performanceLoggers } = require('../middleware/performanceLogger');

// ============================================================================
// Dashboard Routes
// ============================================================================

/**
 * GET /api/v1/dashboard/analytics
 * Get aggregated analytics for dashboard visualization
 * 
 * Returns:
 * - statusDistribution: Count of items by status
 * - categoryDistribution: Count of items by category  
 * - topBorrower: User with most items currently borrowed
 * 
 * Response: 200 OK
 * Body: {
 *   data: {
 *     statusDistribution: { Available: 10, Lent: 5, Maintenance: 2 },
 *     categoryDistribution: { electronics: 8, tools: 7, books: 3 },
 *     topBorrower: { name: "John Doe", count: 3 } | null
 *   },
 *   message: string
 * }
 * 
 * @see specs/003-dashboard-improvements/contracts/dashboard-analytics-api.yaml
 * @see T006 - Register analytics route
 */
router.get('/analytics', performanceLoggers.dashboard, dashboardController.getAnalytics);

/**
 * GET /api/v1/dashboard
 * Get dashboard overview data
 * 
 * Returns:
 * - currentlyOut: Items currently lent (status = "Lent")
 * - allItems: All items with optional filtering
 * - stats: Summary statistics
 * 
 * Query params (optional):
 * - status: Filter items by status
 * - category: Filter items by category
 * - search: Search items by keyword
 * 
 * Response: 200 OK
 * Body: {
 *   data: {
 *     currentlyOut: Item[],
 *     allItems: Item[],
 *     stats: {
 *       totalItems: number,
 *       itemsOut: number,
 *       itemsAvailable: number
 *     }
 *   },
 *   message: string
 * }
 * 
 * @see T120 - getDashboardData controller method
 * @see T119 - getCurrentlyLentItems service method
 */
router.get('/', performanceLoggers.dashboard, itemController.getDashboardData);

module.exports = router;
