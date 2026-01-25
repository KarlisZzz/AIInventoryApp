/**
 * Dashboard Controller
 * 
 * Handles HTTP requests for dashboard analytics and overview data.
 * All routes are prefixed with /api/v1/dashboard.
 * 
 * @see specs/003-dashboard-improvements/spec.md (User Stories 1-4)
 * @see specs/003-dashboard-improvements/contracts/dashboard-analytics-api.yaml
 */

const dashboardService = require('../services/dashboardService');

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
 *     statusDistribution: { available: 10, out: 5, maintenance: 2 },
 *     categoryDistribution: { electronics: 8, tools: 7, books: 3 },
 *     topBorrower: { name: "John Doe", count: 3 } | null
 *   },
 *   message: string
 * }
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next middleware
 * 
 * @see T004 - Create getAnalytics controller method
 */
async function getAnalytics(req, res, next) {
  try {
    const analytics = await dashboardService.getAnalytics();
    
    return res.success(
      analytics,
      'Dashboard analytics retrieved successfully'
    );
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    next(error);
  }
}

module.exports = {
  getAnalytics,
};
