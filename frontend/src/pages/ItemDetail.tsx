import { useParams, Link } from 'react-router-dom';

/**
 * Item Detail Page
 * Shows detailed information about a specific item including lending history
 * TODO: Implement full item detail functionality in Phase 3
 */
const ItemDetail = () => {
  const { itemId } = useParams<{ itemId: string }>();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/inventory" className="text-blue-500 hover:text-blue-400 inline-flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Inventory
        </Link>
      </div>
      
      <h1 className="text-4xl font-bold mb-6">Item Details</h1>
      
      <div className="glass-card p-6">
        <p className="text-slate-400">
          Loading details for item ID: {itemId}
        </p>
        <p className="text-slate-500 text-sm mt-2">
          Full item details and lending history coming soon.
        </p>
      </div>
    </div>
  );
};

export default ItemDetail;
