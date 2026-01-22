/**
 * EmptyState Component (T162)
 * 
 * Displays empty state illustrations with message when no data is available.
 * 
 * @see T162
 */

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state py-12">
      {icon && <div className="empty-state-icon mx-auto mb-4">{icon}</div>}
      
      {!icon && (
        <div className="empty-state-icon mx-auto mb-4">
          <svg
            className="w-full h-full text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
      )}
      
      <h3 className="empty-state-title">{title}</h3>
      
      {description && (
        <p className="empty-state-description max-w-md mx-auto mt-2">{description}</p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
