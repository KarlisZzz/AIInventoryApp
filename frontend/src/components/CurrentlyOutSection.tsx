/**
 * CurrentlyOutSection Component
 * 
 * Displays items that are currently lent out with borrower information.
 * Shows empty state when no items are currently out.
 * 
 * @see T124, T129
 */

import type { Item } from '../services/itemService';
import LentItemCard from './LentItemCard';

interface CurrentlyOutSectionProps {
  items: Item[];
  onReturn?: (item: Item) => void;
  onViewHistory?: (item: Item) => void;
  isLoading?: boolean;
}

export default function CurrentlyOutSection({ 
  items, 
  onReturn, 
  onViewHistory,
  isLoading = false 
}: CurrentlyOutSectionProps) {
  
  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-slate-200 mb-4">Items Currently Out</h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Empty state - T129
  if (items.length === 0) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-slate-200 mb-4">Items Currently Out</h2>
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-8 text-center">
          <svg 
            className="mx-auto h-12 w-12 text-slate-600 mb-3" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-lg text-slate-400 mb-1">No items currently lent</p>
          <p className="text-sm text-slate-500">All items are available in the inventory</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-200">Items Currently Out</h2>
        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm font-medium rounded-full border border-yellow-500/30">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Grid of lent items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <LentItemCard
            key={item.id}
            item={item}
            onReturn={onReturn}
            onViewHistory={onViewHistory}
          />
        ))}
      </div>
    </div>
  );
}
