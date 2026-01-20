/**
 * Lending Service
 * 
 * API client for lending operations (User Story 2)
 * Handles lending items to users and retrieving lending history.
 * 
 * @see specs/001-inventory-lending/spec.md (User Story 2)
 */

import apiClient from './api';

/**
 * Item model (simplified for frontend)
 */
export interface Item {
  id: string;
  name: string;
  description?: string;
  category: string;
  status: 'Available' | 'Lent' | 'Maintenance';
  createdAt: string;
  updatedAt: string;
}

/**
 * User model (simplified for frontend)
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Lending Log model
 */
export interface LendingLog {
  id: string;
  itemId: string;
  userId: string;
  borrowerName: string;
  borrowerEmail: string;
  dateLent: string;
  dateReturned?: string | null;
  conditionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  item?: Item;
}

/**
 * Request payload for lending an item
 */
export interface LendItemRequest {
  itemId: string;
  userId: string;
  conditionNotes?: string;
}

/**
 * Response from lending an item
 */
export interface LendItemResponse {
  item: Item;
  log: LendingLog;
}

/**
 * Lend an item to a user
 * 
 * POST /api/v1/lending/lend
 * 
 * @param request - Item ID, User ID, and optional condition notes
 * @returns Promise with updated item and new lending log
 */
export async function lendItem(request: LendItemRequest): Promise<LendItemResponse> {
  const response = await apiClient.post<LendItemResponse>('/lending/lend', request);
  return response.data;
}

/**
 * Get lending history for a specific item
 * 
 * GET /api/v1/lending/history/:itemId
 * 
 * @param itemId - UUID of the item
 * @returns Promise with array of lending logs
 */
export async function getItemLendingHistory(itemId: string): Promise<LendingLog[]> {
  const response = await apiClient.get<LendingLog[]>(`/lending/history/${itemId}`);
  return response.data;
}

/**
 * Get all currently lent items
 * 
 * GET /api/v1/lending/current
 * 
 * @returns Promise with array of items with status "Lent"
 */
export async function getCurrentlyLentItems(): Promise<Item[]> {
  const response = await apiClient.get<Item[]>('/lending/current');
  return response.data;
}

/**
 * Get all active lending logs (items still out)
 * 
 * GET /api/v1/lending/active
 * 
 * @returns Promise with array of lending logs where dateReturned is NULL
 */
export async function getActiveLendings(): Promise<LendingLog[]> {
  const response = await apiClient.get<LendingLog[]>('/lending/active');
  return response.data;
}

/**
 * Request payload for returning an item
 */
export interface ReturnItemRequest {
  itemId: string;
  returnConditionNotes?: string;
}

/**
 * Response from returning an item
 */
export interface ReturnItemResponse {
  item: Item;
  log: LendingLog;
}

/**
 * Return a lent item (User Story 3)
 * 
 * POST /api/v1/lending/return
 * 
 * @param request - Item ID and optional return condition notes
 * @returns Promise with updated item and lending log
 */
export async function returnItem(request: ReturnItemRequest): Promise<ReturnItemResponse> {
  const response = await apiClient.post<ReturnItemResponse>('/lending/return', request);
  return response.data;
}

export default {
  lendItem,
  returnItem,
  getItemLendingHistory,
  getCurrentlyLentItems,
  getActiveLendings,
};
