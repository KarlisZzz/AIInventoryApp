/**
 * Admin Controller
 * 
 * HTTP request handlers for admin dashboard endpoints.
 * Handles request validation, calls service layer, and formats responses.
 * 
 * All routes require administrator role (enforced by requireAdmin middleware).
 * 
 * @see specs/004-admin-management/contracts/api-spec.yaml
 * @see specs/004-admin-management/spec.md (FR-021, FR-022)
 */

const { User, Category, AdminAuditLog } = require('../models');

/**
 * GET /api/v1/admin/dashboard
 * Get admin dashboard statistics and recent audit logs
 * 
 * Returns:
 * - totalUsers: Total number of users
 * - totalCategories: Total number of categories
 * - totalAdministrators: Count of users with administrator role
 * - recentActions: Last 10 admin audit logs with admin user details
 * 
 * Response: 200 OK with dashboard data
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function getDashboard(req, res) {
  try {
    // Fetch all statistics in parallel
    const [totalUsers, totalCategories, totalAdministrators, recentActions] = await Promise.all([
      User.count(),
      Category.count(),
      User.count({ where: { role: 'administrator' } }),
      AdminAuditLog.findAll({
        limit: 10,
        order: [['timestamp', 'DESC']],
        include: [{
          model: User,
          as: 'admin',
          attributes: ['id', 'name', 'email'],
        }],
      }),
    ]);

    // Format the dashboard data
    const dashboardData = {
      totalUsers,
      totalCategories,
      totalAdministrators,
      recentActions: recentActions.map(log => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        admin: log.admin ? {
          id: log.admin.id,
          name: log.admin.name,
          email: log.admin.email,
        } : null,
        timestamp: log.timestamp,
      })),
    };

    return res.success(dashboardData, 'Dashboard data retrieved successfully');
  } catch (error) {
    console.error('Get dashboard error:', error);
    return res.error(
      'GET_DASHBOARD_ERROR',
      'Failed to retrieve dashboard data',
      500
    );
  }
}

module.exports = {
  getDashboard,
};
