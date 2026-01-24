/**
 * ViewToggle Component
 * 
 * Toggle button for switching between grid and list views.
 * Displays appropriate icons and maintains active state styling.
 * 
 * @see T027 [US2]
 */

interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}

export default function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg border border-slate-700">
      {/* Grid View Button */}
      <button
        onClick={() => onViewChange('grid')}
        className={`
          p-2 rounded-md transition-colors
          ${
            viewMode === 'grid'
              ? 'bg-blue-500 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }
        `}
        aria-label="Grid view"
        aria-pressed={viewMode === 'grid'}
        title="Grid view"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      </button>

      {/* List View Button */}
      <button
        onClick={() => onViewChange('list')}
        className={`
          p-2 rounded-md transition-colors
          ${
            viewMode === 'list'
              ? 'bg-blue-500 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }
        `}
        aria-label="List view"
        aria-pressed={viewMode === 'list'}
        title="List view"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </div>
  );
}
