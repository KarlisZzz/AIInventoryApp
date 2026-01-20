/**
 * Dashboard Service
 * 
 * Service for making API calls to the dashboard endpoint.
 * Retrieves dashboard data including currently lent items and all inventory items.
 * 
 * @see specs/001-inventory-lending/spec.md (User Story 5)
 * @see T123
 */

import apiClient from './api';
import type { Item } from './itemService';

/**
 * Dashboard data interface
 */
export interface DashboardData {
  currentlyOut: Item[];
  allItems: Item[];
  stats: {
    totalItems: number;
    itemsOut: number;
    itemsAvailable: number;
  };
}

/**
 * Get dashboard data
 * 
 * @param filters - Optional filters { status, category, search }
 * @returns Promise<DashboardData>
 */
export async function getDashboardData(filters?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<DashboardData> {
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
  
  const queryString = params.toString();
  const url = queryString ? `/dashboard?${queryString}` : '/dashboard';
  
  const response = await apiClient.get<DashboardData>(url);
  return response.data;
}
