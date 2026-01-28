/**
 * Admin API functions for the Admin Management feature
 * Handles all admin-related API calls
 */

import apiClient from './api';
import type { 
  Category, 
  CategoryWithCount, 
  CreateCategoryRequest, 
  UpdateCategoryRequest,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  AdminDashboardData
} from '../types/admin';

/**
 * Category API functions (User Story 1)
 */

/**
 * Get all categories
 * @returns Promise resolving to array of categories with item counts
 */
export const getCategories = async (): Promise<CategoryWithCount[]> => {
  const response = await apiClient.get<CategoryWithCount[]>('/admin/categories');
  return response.data;
};

/**
 * Get a single category by ID
 * @param id - Category ID
 * @returns Promise resolving to category
 */
export const getCategoryById = async (id: string): Promise<Category> => {
  const response = await apiClient.get<Category>(`/admin/categories/${id}`);
  return response.data;
};

/**
 * Create a new category
 * @param data - Category creation data
 * @returns Promise resolving to created category
 */
export const createCategory = async (data: CreateCategoryRequest): Promise<Category> => {
  const response = await apiClient.post<Category>('/admin/categories', data);
  return response.data;
};

/**
 * Update an existing category
 * @param id - Category ID
 * @param data - Category update data
 * @returns Promise resolving to updated category
 */
export const updateCategory = async (id: string, data: UpdateCategoryRequest): Promise<Category> => {
  const response = await apiClient.put<Category>(`/admin/categories/${id}`, data);
  return response.data;
};

/**
 * Delete a category
 * @param id - Category ID
 * @returns Promise resolving when deletion is complete
 */
export const deleteCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/categories/${id}`);
};

/**
 * User API functions (User Story 2)
 */

/**
 * Get all users with optional role filter
 * @param roleFilter - Optional role filter ('administrator' | 'standard user')
 * @returns Promise resolving to array of users
 */
export const getUsers = async (roleFilter?: 'administrator' | 'standard user'): Promise<User[]> => {
  const params = roleFilter ? { role: roleFilter } : {};
  const response = await apiClient.get<User[]>('/admin/users', { params });
  return response.data;
};

/**
 * Get a single user by ID
 * @param id - User ID
 * @returns Promise resolving to user
 */
export const getUserById = async (id: string): Promise<User> => {
  const response = await apiClient.get<User>(`/admin/users/${id}`);
  return response.data;
};

/**
 * Create a new user
 * @param data - User creation data
 * @returns Promise resolving to created user
 */
export const createUser = async (data: CreateUserRequest): Promise<User> => {
  const response = await apiClient.post<User>('/admin/users', data);
  return response.data;
};

/**
 * Update an existing user
 * @param id - User ID
 * @param data - User update data
 * @returns Promise resolving to updated user
 */
export const updateUser = async (id: string, data: UpdateUserRequest): Promise<User> => {
  const response = await apiClient.put<User>(`/admin/users/${id}`, data);
  return response.data;
};

/**
 * Delete (deactivate) a user
 * @param id - User ID
 * @returns Promise resolving when deletion is complete
 */
export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/users/${id}`);
};

/**
 * Dashboard API functions (User Story 3)
 */

/**
 * Get admin dashboard data
 * @returns Promise resolving to dashboard statistics and recent actions
 */
export const getAdminDashboard = async (): Promise<AdminDashboardData> => {
  const response = await apiClient.get<AdminDashboardData>('/admin/dashboard');
  return response.data;
};
