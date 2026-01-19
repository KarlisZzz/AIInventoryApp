/**
 * Inventory Page
 * Displays list of all inventory items with search, filter, and CRUD operations
 * TODO: Implement full inventory functionality in Phase 3 (User Story 1)
 */
const Inventory = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Inventory</h1>
        <button className="btn-primary">
          Add Item
        </button>
      </div>
      <div className="glass-card p-6">
        <p className="text-slate-400">
          Inventory list coming soon. This will show all items with search, filter, and management capabilities.
        </p>
      </div>
    </div>
  );
};

export default Inventory;
