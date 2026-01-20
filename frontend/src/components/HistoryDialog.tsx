/**
 * HistoryDialog Component
 * 
 * Modal dialog displaying lending history for a specific item.
 * Includes date range filtering and handles empty history state.
 * 
 * @see T107, T111, T112, T113 - User Story 4
 */

import { useState, useEffect } from 'react';
import { getItemLendingHistory, type LendingLog } from '../services/lendingService';
import HistoryTable from './HistoryTable';
import DateRangeFilter from './DateRangeFilter';
import Loading from './Loading';

interface HistoryDialogProps {
  itemId: string;
  itemName: string;
  onClose: () => void;
}

export default function HistoryDialog({ itemId, itemName, onClose }: HistoryDialogProps) {
  const [history, setHistory] = useState<LendingLog[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<LendingLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  // T111: Load history when dialog opens
  useEffect(() => {
    loadHistory();
  }, [itemId]);

  // Apply date filtering when history or filter changes
  useEffect(() => {
    applyDateFilter();
  }, [history, dateFilter]);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getItemLendingHistory(itemId);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lending history');
    } finally {
      setIsLoading(false);
    }
  };

  // T112: Date range filtering
  const applyDateFilter = () => {
    if (!dateFilter.start && !dateFilter.end) {
      setFilteredHistory(history);
      return;
    }

    const filtered = history.filter((log) => {
      const lentDate = new Date(log.dateLent);

      if (dateFilter.start) {
        const startDate = new Date(dateFilter.start);
        if (lentDate < startDate) return false;
      }

      if (dateFilter.end) {
        const endDate = new Date(dateFilter.end);
        endDate.setHours(23, 59, 59, 999); // Include entire end date
        if (lentDate > endDate) return false;
      }

      return true;
    });

    setFilteredHistory(filtered);
  };

  const handleFilter = (startDate: string | null, endDate: string | null) => {
    setDateFilter({ start: startDate, end: endDate });
  };

  const handleClearFilter = () => {
    setDateFilter({ start: null, end: null });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-semibold text-slate-200">Lending History</h2>
            <p className="text-slate-400 mt-1">Item: <span className="text-slate-200">{itemName}</span></p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close dialog"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loading />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
                <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-400 mb-4">{error}</p>
              <button
                onClick={loadHistory}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium
                           hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500
                           transition-colors"
              >
                Retry
              </button>
            </div>
          ) : history.length === 0 ? (
            // T113: Handle empty history case
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700/50 mb-4">
                <svg className="h-8 w-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">No Lending History</h3>
              <p className="text-slate-500">This item has never been lent out.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Date Range Filter */}
              <DateRangeFilter onFilter={handleFilter} onClear={handleClearFilter} />

              {/* History Summary */}
              <div className="flex items-center justify-between text-sm">
                <p className="text-slate-400">
                  Showing <span className="font-medium text-slate-200">{filteredHistory.length}</span> of{' '}
                  <span className="font-medium text-slate-200">{history.length}</span> transactions
                </p>
                {(dateFilter.start || dateFilter.end) && (
                  <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                    Filtered by date
                  </span>
                )}
              </div>

              {/* History Table */}
              {filteredHistory.length > 0 ? (
                <HistoryTable history={filteredHistory} />
              ) : (
                <div className="text-center py-8 bg-slate-800/30 rounded-lg border border-slate-700">
                  <p className="text-slate-400">No transactions found for the selected date range.</p>
                  <button
                    onClick={handleClearFilter}
                    className="mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Clear filter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 text-slate-200 rounded-lg font-medium
                       hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500
                       transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
