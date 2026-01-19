/**
 * SearchBar Component
 * 
 * Reusable search input for filtering inventory items.
 * Provides real-time search with debouncing for performance.
 * 
 * @see T046
 */

import { useState, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export default function SearchBar({ 
  onSearch, 
  placeholder = 'Search items...', 
  debounceMs = 300 
}: SearchBarProps) {
  const [query, setQuery] = useState('');

  // Debounce search to avoid excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, onSearch, debounceMs]);

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-lg
                   bg-slate-800/50 text-slate-200 placeholder-slate-400
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   transition-colors"
        aria-label="Search items"
      />
      
      {query && (
        <button
          onClick={() => setQuery('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
          aria-label="Clear search"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
