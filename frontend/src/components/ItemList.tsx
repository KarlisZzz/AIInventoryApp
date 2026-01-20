/**
 * ItemList Component
 * 
 * Displays items in a grid layout with sorting capabilities.
 * Shows empty state when no items match filters.
 * 
 * @see T044
 */

import { useState } from 'react';
import type { Item } from '../services/itemService';
import ItemCard from './ItemCard';

interface ItemListProps {
  items: Item[];
  onEdit: (item: Item) => void;
  onDelete: (itemId: string) => Promise<void>;
  onLend?: (item: Item) => void;
  onReturn?: (item: Item) => void;
  onViewHistory?: (item: Item) => void;
  isLoading?: boolean;
}

type SortField = 'name' | 'category' | 'status' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function ItemList({ items, onEdit, onDelete, onLend, onReturn, onViewHistory, isLoading = false }: ItemListProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Sort items
  const sortedItems = [...items].sort((a, b) => {
    let aVal: string | Date = a[sortField];
    let bVal: string | Date = b[sortField];

    // Handle date fields
    if (sortField === 'createdAt') {
      aVal = new Date(a.createdAt);
      bVal = new Date(b.createdAt);
    }

    // String comparison
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const comparison = aVal.localeCompare(bVal);
      return sortOrder === 'asc' ? comparison : -comparison;
    }

    // Date comparison
    if (aVal instanceof Date && bVal instanceof Date) {
      const comparison = aVal.getTime() - bVal.getTime();
      return sortOrder === 'asc' ? comparison : -comparison;
    }

    return 0;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 px-3 py-1 text-sm text-slate-400 hover:text-slate-200
                 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600
                 transition-colors"
    >
      {label}
      {sortField === field && (
        <svg
          className={`h-4 w-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
      )}
    </button>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-slate-600 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <h3 className="text-lg font-medium text-slate-300 mb-1">No items found</h3>
        <p className="text-slate-400">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-slate-400">Sort by:</span>
        <SortButton field="name" label="Name" />
        <SortButton field="category" label="Category" />
        <SortButton field="status" label="Status" />
        <SortButton field="createdAt" label="Date Added" />
      </div>

      {/* Items Count */}
      <p className="text-sm text-slate-400">
        Showing {sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''}
      </p>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onEdit={onEdit}
            onDelete={onDelete}
            onLend={onLend}
            onReturn={onReturn}
            onViewHistory={onViewHistory}
          />
        ))}
      </div>
    </div>
  );
}
