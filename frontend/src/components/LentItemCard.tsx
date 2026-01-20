/**
 * LentItemCard Component
 * 
 * Displays a lent item with borrower information and lending date.
 * Used in the "Items Currently Out" section of the dashboard.
 * 
 * @see T125
 */

import type { Item } from '../services/itemService';

interface LentItemCardProps {
  item: Item;
  borrowerName?: string;
  dateLent?: string;
  onReturn?: (item: Item) => void;
  onViewHistory?: (item: Item) => void;
}

export default function LentItemCard({ 
  item, 
  borrowerName, 
  dateLent, 
  onReturn, 
  onViewHistory 
}: LentItemCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getDaysOut = (dateString?: string) => {
    if (!dateString) return null;
    const lentDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lentDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysOut = getDaysOut(dateLent);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-4
                    hover:border-yellow-500/30 transition-colors">
      {/* Header: Item name and status indicator */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-200 mb-1">
            {item.name}
          </h3>
          <p className="text-sm text-slate-400">
            {item.category}
          </p>
        </div>
        <span className="px-2 py-1 text-xs font-medium rounded border
                       bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          Lent
        </span>
      </div>

      {/* Description (if available) */}
      {item.description && (
        <p className="text-sm text-slate-400 mb-3 line-clamp-2">
          {item.description}
        </p>
      )}

      {/* Borrower and date information */}
      <div className="space-y-2 mb-4 pt-3 border-t border-slate-700">
        {/* Borrower */}
        <div className="flex items-center gap-2 text-sm">
          <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-slate-300">
            {borrowerName || 'Unknown Borrower'}
          </span>
        </div>

        {/* Date lent */}
        <div className="flex items-center gap-2 text-sm">
          <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-slate-400">
            Lent on {formatDate(dateLent)}
            {daysOut !== null && (
              <span className="ml-2 text-xs text-slate-500">
                ({daysOut} {daysOut === 1 ? 'day' : 'days'} ago)
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {onReturn && (
          <button
            onClick={() => onReturn(item)}
            className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium 
                     rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Return
          </button>
        )}
        
        {onViewHistory && (
          <button
            onClick={() => onViewHistory(item)}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium 
                     rounded-lg transition-colors flex items-center justify-center gap-2"
            title="View lending history"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </button>
        )}
      </div>
    </div>
  );
}
