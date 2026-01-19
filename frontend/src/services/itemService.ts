/**
 * Item Service
 * 
 * Service for making API calls to the items endpoint.
 * Handles all CRUD operations for inventory items.
 * 
 * @see specs/001-inventory-lending/contracts/api.yaml
 */

import apiClient from './api';

/**
 * Item interface matching backend model
 */
export interface Item {
  id: string;
  name: string;
  description: string | null;
  category: string;
  status: 'Available' | 'Lent' | 'Maintenance';
  createdAt: string;
  updatedAt: string;
}

/**
 * Create item request data
 */
export interface CreateItemData {
  name: string;
  description?: string;
  category: string;
  status?: 'Available' | 'Lent' | 'Maintenance';
}

/**
 * Update item request data
 */
export interface UpdateItemData {
  name?: string;
  description?: string;
  category?: string;
  status?: 'Available' | 'Lent' | 'Maintenance';
}

/**
 * Get all items with optional filters
 * 
 * @param filters - Optional filters { status, category, search }
 * @returns Promise<Item[]>
 */
export async function getAllItems(filters?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<Item[]> {
  const params = new URLSearchParams();
  
  if (filters?.status) {
    params.append('status', filters.status);
  }
  
  if (filters?.category) {
    params.append('category', filters.category);
  }
  
  if (filters?.search) {
    params.append('search', filters.search);
  }
  
  const response = await apiClient.get<Item[]>('/items', {
    params: params.toString() ? params : undefined,
  });
  
  return response.data;
}

/**
 * Get item by ID
 * 
 * @param id - Item UUID
 * @returns Promise<Item>
 */
export async function getItemById(id: string): Promise<Item> {
  const response = await apiClient.get<Item>(`/items/${id}`);
  return response.data;
}

/**
 * Create a new item
 * 
 * @param data - Item data
 * @returns Promise<Item>
 */
export async function createItem(data: CreateItemData): Promise<Item> {
  const response = await apiClient.post<Item>('/items', data);
  return response.data;
}

/**
 * Update an existing item
 * 
 * @param id - Item UUID
 * @param data - Fields to update
 * @returns Promise<Item>
 */
export async function updateItem(id: string, data: UpdateItemData): Promise<Item> {
  const response = await apiClient.put<Item>(`/items/${id}`, data);
  return response.data;
}

/**
 * Delete an item
 * 
 * @param id - Item UUID
 * @returns Promise<void>
 */
export async function deleteItem(id: string): Promise<void> {
  await apiClient.delete(`/items/${id}`);
}

/**
 * Search items by keyword
 * 
 * @param keyword - Search keyword
 * @returns Promise<Item[]>
 */
export async function searchItems(keyword: string): Promise<Item[]> {
  const response = await apiClient.get<Item[]>('/items/search', {
    params: { q: keyword },
  });
  return response.data;
}

/**
 * Get all unique categories
 * 
 * @returns Promise<string[]>
 */
export async function getCategories(): Promise<string[]> {
  const response = await apiClient.get<string[]>('/items/categories');
  return response.data;
}
