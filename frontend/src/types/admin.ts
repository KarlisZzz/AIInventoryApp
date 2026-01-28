/**
 * Admin type definitions for the Admin Management feature
 * User Story 1: Manage Item Categories
 */

/**
 * Category represents an item category in the system
 */
export interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * CategoryWithCount extends Category with item count information
 * Used for displaying categories with assigned item counts
 */
export interface CategoryWithCount extends Category {
  itemCount: number;
}

/**
 * User represents a user account in the system
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'administrator' | 'standard user';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * AuditLogSummary represents a recent admin action
 */
export interface AuditLogSummary {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  admin: {
    id: string;
    name: string;
    email: string;
  } | null;
  timestamp: string;
  details?: Record<string, unknown>;
}

/**
 * AdminDashboardData represents the admin dashboard statistics and recent actions
 */
export interface AdminDashboardData {
  totalUsers: number;
  totalCategories: number;
  totalAdministrators: number;
  recentActions: AuditLogSummary[];
}

/**
 * CreateCategoryRequest represents the payload for creating a category
 */
export interface CreateCategoryRequest {
  name: string;
}

/**
 * UpdateCategoryRequest represents the payload for updating a category
 */
export interface UpdateCategoryRequest {
  name: string;
}

/**
 * CreateUserRequest represents the payload for creating a user
 */
export interface CreateUserRequest {
  email: string;
  name: string;
  role: 'administrator' | 'standard user';
}

/**
 * UpdateUserRequest represents the payload for updating a user
 */
export interface UpdateUserRequest {
  email?: string;
  name?: string;
  role?: 'administrator' | 'standard user';
}
