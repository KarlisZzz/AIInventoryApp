/**
 * ItemList Component
 * 
 * Displays items in either grid or list view with sorting capabilities.
 * Shows empty state when no items match filters.
 * Includes three-dots menu for list view actions (T043 [US3]).
 * 
 * @see T044, T029-T032 [US2], T043 [US3]
 */

import { useState } from 'react';
import type { Item } from '../services/itemService';
import ItemCard from './ItemCard';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import DropdownMenu, { type MenuItem } from './DropdownMenu';

interface ItemListProps {
  items: Item[];
  onEdit: (item: Item) => void;
  onDelete: (itemId: string) => Promise<void>;
  onLend?: (item: Item) => void;
  onReturn?: (item: Item) => void;
  onViewHistory?: (item: Item) => void;
  isLoading?: boolean;
  viewMode?: 'grid' | 'list'; // T029 [US2]
}

type SortField = 'name' | 'category' | 'status' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function ItemList({ items, onEdit, onDelete, onLend, onReturn, onViewHistory, isLoading = false, viewMode = 'grid' }: ItemListProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null); // T043 [US3]: Track which dropdown is open

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
      aria-label={`Sort by ${label}${sortField === field ? `, currently ${sortOrder === 'asc' ? 'ascending' : 'descending'}` : ''}`}
    >
      {label}
      {sortField === field && (
        <svg
          className={`h-4 w-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
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

  // Loading state (T155)
  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading items..." />;
  }

  // Empty state (T162)
  if (items.length === 0) {
    return (
      <EmptyState
        title="No items found"
        description="Try adjusting your search or filters, or add a new item to get started."
      />
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

      {/* Grid View (T030 [US2]) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
      )}

      {/* List View (T031, T032 [US2]) */}
      {viewMode === 'list' && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-16">
                  Image
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-28">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {sortedItems.map((item) => {
                const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
                const SERVER_BASE = API_BASE.replace(/\/api\/v1$/, '');
                const imageUrl = item.imageUrl ? `${SERVER_BASE}${item.imageUrl}` : null;
                
                // T043 [US3]: Build menuItems array for each row (same as ItemCard)
                const menuItems: MenuItem[] = [
                  {
                    label: 'Edit',
                    onClick: () => onEdit(item),
                    icon: (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    ),
                  },
                ];

                // Add Lend/Return based on status
                if (item.status === 'Available' && onLend) {
                  menuItems.push({
                    label: 'Lend',
                    onClick: () => onLend(item),
                    icon: (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    ),
                  });
                } else if (item.status === 'Lent' && onReturn) {
                  menuItems.push({
                    label: 'Return',
                    onClick: () => onReturn(item),
                    icon: (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    ),
                  });
                }

                // Add View History
                if (onViewHistory) {
                  menuItems.push({
                    label: 'View History',
                    onClick: () => onViewHistory(item),
                    icon: (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                  });
                }

                // Add Delete with conditional disabled state
                menuItems.push({
                  label: 'Delete',
                  onClick: () => onDelete(item.id),
                  disabled: item.status === 'Lent',
                  tooltip: item.status === 'Lent' ? 'Cannot delete lent item' : 'Delete item',
                  variant: 'danger',
                  icon: (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  ),
                });
                
                return (
                  <tr
                    key={item.id}
                    onClick={() => onEdit(item)}
                    className="hover:bg-slate-700/30 transition-colors cursor-pointer"
                  >
                    {/* Image Thumbnail (T032 [US2]) */}
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-700/50 flex items-center justify-center">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = `
                                <svg class="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              `;
                            }}
                          />
                        ) : (
                          <svg
                            className="h-6 w-6 text-slate-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3 text-sm font-medium text-slate-200">
                      {item.name}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {item.category}
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3 text-sm text-slate-400">
                      <div className="max-w-xs truncate">
                        {item.description || '-'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`
                          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            item.status === 'Available'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : item.status === 'Lent'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }
                        `}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {/* T043 [US3]: Three-dots menu in list view Actions column */}
                      <DropdownMenu
                        items={menuItems}
                        isOpen={openMenuId === item.id}
                        onClose={() => setOpenMenuId(null)}
                        position="bottom-right"
                        triggerElement={
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === item.id ? null : item.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 
                                       rounded transition-colors"
                            aria-label="Item actions menu"
                            title="Item actions"
                          >
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                              />
                            </svg>
                          </button>
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
