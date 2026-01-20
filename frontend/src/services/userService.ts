/**
 * User Service
 * 
 * API client for user operations (User Story 2)
 * Handles fetching users for selection during lending operations.
 * 
 * Note: Per FR-015, user CRUD operations are out of scope.
 * This service only supports READ operations for user selection.
 * 
 * @see specs/001-inventory-lending/spec.md (FR-015)
 */

import apiClient from './api';

/**
 * User model
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

/**
 * Get all users with optional search filtering
 * 
 * GET /api/v1/users?search=term
 * 
 * @param search - Optional search term to filter by name or email
 * @returns Promise with array of users
 */
export async function getUsers(search?: string): Promise<User[]> {
  const params = search ? { search } : {};
  const response = await apiClient.get<User[]>('/users', { params });
  return response.data;
}

/**
 * Get a specific user by ID
 * 
 * GET /api/v1/users/:id
 * 
 * @param id - UUID of the user
 * @returns Promise with user data
 */
export async function getUserById(id: string): Promise<User> {
  const response = await apiClient.get<User>(`/users/${id}`);
  return response.data;
}

export default {
  getUsers,
  getUserById,
};
