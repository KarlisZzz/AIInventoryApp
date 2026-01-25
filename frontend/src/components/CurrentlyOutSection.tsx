/**
 * CurrentlyOutSection Component
 * 
 * Displays items that are currently lent out with carousel navigation.
 * Shows one item at a time with prev/next controls.
 * 
 * @see T042, T043, T124, T129
 */

import type { Item } from '../services/itemService';
import ItemCarousel from './ItemCarousel';
import LoadingSpinner from './LoadingSpinner';

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
        <LoadingSpinner size="md" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-200">Items Currently Out</h2>
        {items.length > 0 && (
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm font-medium rounded-full border border-yellow-500/30">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {/* T042, T043 - Use ItemCarousel instead of grid list */}
      <ItemCarousel
        items={items}
        onReturn={onReturn}
        onViewHistory={onViewHistory}
      />
    </div>
  );
}
