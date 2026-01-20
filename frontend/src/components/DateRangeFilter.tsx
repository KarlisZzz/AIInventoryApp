/**
 * DateRangeFilter Component
 * 
 * Provides date range filtering for lending history.
 * Optional component for filtering transactions by date range.
 * 
 * @see T109 - User Story 4
 */

import { useState } from 'react';

interface DateRangeFilterProps {
  onFilter: (startDate: string | null, endDate: string | null) => void;
  onClear: () => void;
}

export default function DateRangeFilter({ onFilter, onClear }: DateRangeFilterProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleApply = () => {
    if (startDate || endDate) {
      onFilter(startDate || null, endDate || null);
    }
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    onClear();
  };

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="startDate" className="block text-sm font-medium text-slate-400 mb-1">
          Start Date
        </label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg
                     text-slate-200 placeholder-slate-500
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-colors"
        />
      </div>

      <div className="flex-1 min-w-[200px]">
        <label htmlFor="endDate" className="block text-sm font-medium text-slate-400 mb-1">
          End Date
        </label>
        <input
          type="date"
          id="endDate"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg
                     text-slate-200 placeholder-slate-500
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-colors"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleApply}
          disabled={!startDate && !endDate}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium
                     hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Apply
        </button>
        <button
          onClick={handleClear}
          disabled={!startDate && !endDate}
          className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg font-medium
                     hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
