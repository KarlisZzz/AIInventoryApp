/**
 * Authorization Middleware
 * 
 * Provides role-based access control for administrative routes.
 * 
 * @see specs/004-admin-management/data-model.md
 * @see specs/004-admin-management/spec.md (FR-017, FR-018)
 */

const { User } = require('../models');

/**
 * Middleware: Require administrator role
 * 
 * Validates that the authenticated user has administrator privileges.
 * Returns 401 if not authenticated, 403 if not an administrator.
 * 
 * Prerequisites:
 * - User authentication middleware must run before this middleware
 * - req.user or req.userId must be populated by auth middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 * 
 * @example
 * router.get('/admin/users', requireAdmin, userController.getUsers);
 */
async function requireAdmin(req, res, next) {
  try {
    // Check if user is authenticated (populated by upstream auth middleware)
    // For now, we'll use a simple userId from headers for demo/testing
    const userId = req.headers['x-user-id'] || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate to access this resource',
      });
    }

    // Fetch user from database
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'The authenticated user no longer exists',
      });
    }

    // Check if user has administrator role
    if (!user.isAdmin()) {
      return res.status(403).json({
        error: 'Administrator access required',
        message: 'Insufficient permissions: administrator role required for this resource',
      });
    }

    // Attach user to request for downstream use
    req.user = user;
    req.adminUserId = user.id;

    next();
  } catch (error) {
    console.error('Authorization middleware error:', error);
    return res.status(500).json({
      error: 'Authorization failed',
      message: 'An error occurred while checking permissions',
    });
  }
}

/**
 * Middleware: Optional admin check
 * 
 * Checks if the user is an admin but doesn't block the request.
 * Useful for endpoints that have different behavior for admins vs regular users.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
async function optionalAdmin(req, res, next) {
  try {
    const userId = req.headers['x-user-id'] || req.user?.id;
    
    if (userId) {
      const user = await User.findByPk(userId);
      if (user && user.isAdmin()) {
        req.user = user;
        req.isAdmin = true;
      }
    }

    next();
  } catch (error) {
    console.error('Optional admin check error:', error);
    // Don't block the request, just continue without admin privileges
    next();
  }
}

/**
 * Middleware: Require any authenticated user
 * 
 * Validates that a user is authenticated (any role).
 * Returns 401 if not authenticated.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
async function requireAuth(req, res, next) {
  try {
    const userId = req.headers['x-user-id'] || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate to access this resource',
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'The authenticated user no longer exists',
      });
    }

    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'An error occurred while authenticating',
    });
  }
}

module.exports = {
  requireAdmin,
  optionalAdmin,
  requireAuth,
};
