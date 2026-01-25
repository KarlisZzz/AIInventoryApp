/**
 * ItemCarousel Component
 * 
 * Displays items currently lent out, 3 at a time, with prev/next navigation.
 * Shows borrower name and lent-out date, ordered chronologically.
 * Supports keyboard navigation (ArrowLeft/ArrowRight).
 * 
 * @see T034, T035, T036, T037, T038, T039, T040, T041, T044, T045, T046, T047, T048, T049
 */

import { useCarousel } from '../hooks/useCarousel';
import { useNavigate } from 'react-router-dom';
import type { Item } from '../services/itemService';

interface ItemCarouselProps {
  items: Item[];
  onReturn?: (item: Item) => void;
  onViewHistory?: (item: Item) => void;
}

export default function ItemCarousel({ 
  items, 
  onReturn, 
  onViewHistory 
}: ItemCarouselProps) {
  const navigate = useNavigate();
  const itemsPerPage = 3;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const { currentIndex: currentPage, canGoNext, canGoPrev, next, prev } = useCarousel({
    itemCount: totalPages,
  });

  // T045 - Empty state
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <svg 
          className="w-16 h-16 mx-auto text-slate-600 mb-4" 
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
        <p className="text-slate-400 text-lg">No items currently lent</p>
        <p className="text-slate-500 text-sm mt-2">All items are available in the inventory</p>
      </div>
    );
  }

  // Calculate visible items for current page
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, items.length);
  const visibleItems = items.slice(startIndex, endIndex);

  // Format date helper (T039)
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Calculate days out
  const getDaysOut = (dateString?: string) => {
    if (!dateString) return null;
    const lentDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lentDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper functions for individual items
  const getBorrowerName = (item: Item) => (item as any).currentLoan?.borrower || 'Unknown Borrower';
  const getLentDate = (item: Item) => (item as any).currentLoan?.lentAt;

  // Handle card click to navigate to item details (T026 from Phase 4)
  const handleCardClick = (itemId: string) => {
    navigate(`/items/${itemId}/edit`);
  };

  // Handle keyboard activation (T030 from Phase 4)
  const handleKeyDown = (event: React.KeyboardEvent, itemId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick(itemId);
    }
  };

  return (
    <div className="relative">
      {/* ARIA live region for screen readers (T040) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Page {currentPage + 1} of {totalPages}, showing {visibleItems.length} items
      </div>

      {/* Grid container for 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleItems.map((item) => {
          const borrowerName = getBorrowerName(item);
          const lentDate = getLentDate(item);
          const daysOut = getDaysOut(lentDate);
          
          return (
            <div 
              key={item.id}
              onClick={() => handleCardClick(item.id)}
              onKeyDown={(e) => handleKeyDown(e, item.id)}
              tabIndex={0}
              role="button"
              aria-label={`View details for ${item.name}. Currently lent to ${borrowerName}`}
              className="bg-slate-800/50 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-6
                       cursor-pointer hover:ring-2 ring-blue-500/50 transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {/* Header: Item name and status indicator */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-200 mb-2">
                    {item.name}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {item.category}
                  </p>
                </div>
                <span className="px-3 py-1 text-sm font-medium rounded border
                             bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  Lent Out
                </span>
              </div>

              {/* Description (if available) */}
              {item.description && (
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                  {item.description}
                </p>
              )}

              {/* Borrower and date information */}
              <div className="space-y-3 pt-4 border-t border-slate-700">
                {/* Borrower (T038) */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Borrowed by</p>
                    <p className="text-sm font-medium text-slate-200">
                      {borrowerName}
                    </p>
                  </div>
                </div>

                {/* Date lent (T039) */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Lent on</p>
                    <p className="text-sm font-medium text-slate-200">
                      {formatDate(lentDate)}
                      {daysOut !== null && (
                        <span className="ml-2 text-xs text-slate-400">
                          ({daysOut} {daysOut === 1 ? 'day' : 'days'} ago)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-6 pt-4 border-t border-slate-700">
                {onReturn && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReturn(item);
                    }}
                    className="flex-1 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg
                             hover:bg-green-500/30 transition-colors border border-green-500/30
                             font-medium text-sm"
                  >
                    Return Item
                  </button>
                )}
                {onViewHistory && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewHistory(item);
                    }}
                    className="flex-1 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg
                             hover:bg-slate-700 transition-colors border border-slate-600
                             font-medium text-sm"
                  >
                    View History
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Controls - T036, T037, T041, T044 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          {/* Previous button (T036, T041) */}
          <button
            onClick={prev}
            disabled={!canGoPrev}
            aria-label="Previous page"
            className={`
              p-3 rounded-lg transition-all duration-200
              ${canGoPrev 
                ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600 cursor-pointer' 
                : 'bg-slate-800/30 text-slate-600 border border-slate-700/30 cursor-not-allowed'
              }
            `}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page indicator */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">
              Page {currentPage + 1} of {totalPages}
            </span>
            <div className="flex gap-1 ml-2">
              {Array.from({ length: totalPages }, (_, index) => (
                <div
                  key={index}
                  className={`
                    w-2 h-2 rounded-full transition-all duration-200
                    ${index === currentPage 
                      ? 'bg-blue-400 w-6' 
                      : 'bg-slate-600'
                    }
                  `}
                />
              ))}
            </div>
          </div>

          {/* Next button (T037, T041) */}
          <button
            onClick={next}
            disabled={!canGoNext}
            aria-label="Next page"
            className={`
              p-3 rounded-lg transition-all duration-200
              ${canGoNext 
                ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600 cursor-pointer' 
                : 'bg-slate-800/30 text-slate-600 border border-slate-700/30 cursor-not-allowed'
              }
            `}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

