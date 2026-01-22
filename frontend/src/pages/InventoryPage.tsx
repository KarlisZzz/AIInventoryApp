/**
 * Inventory Page
 * 
 * Main inventory management page integrating all components:
 * - SearchBar for filtering items (T046, T050)
 * - ItemForm for creating/editing items (T043, T048)
 * - ItemList for displaying items (T044, T045)
 * - Real-time search filtering (T050)
 * 
 * @see T047, T050
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/ToastContainer';
import SearchBar from '../components/SearchBar';
import ItemForm from '../components/ItemForm';
import ItemList from '../components/ItemList';
import LendDialog from '../components/LendDialog';
import ReturnDialog from '../components/ReturnDialog';
import HistoryDialog from '../components/HistoryDialog';
import {
  getAllItems,
  createItem,
  updateItem,
  deleteItem,
  type Item,
  type CreateItemData,
  type UpdateItemData,
} from '../services/itemService';

export default function InventoryPage() {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [lendingItem, setLendingItem] = useState<Item | null>(null);
  const [showLendDialog, setShowLendDialog] = useState(false);
  const [returningItem, setReturningItem] = useState<Item | null>(null);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [historyItem, setHistoryItem] = useState<Item | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  // Load items on mount
  useEffect(() => {
    loadItems();
  }, []);

  // Real-time search filtering (T050)
  useEffect(() => {
    filterItems();
  }, [items, searchQuery, statusFilter, categoryFilter]);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllItems();
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load items');
      console.error('Error loading items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter items based on search query and filters (T050)
  const filterItems = useCallback(() => {
    let filtered = [...items];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    setFilteredItems(filtered);
  }, [items, searchQuery, statusFilter, categoryFilter]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: CreateItemData | UpdateItemData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (editingItem) {
        await updateItem(editingItem.id, data as UpdateItemData);
        showSuccess(`Item "${data.name}" updated successfully`);
      } else {
        await createItem(data as CreateItemData);
        showSuccess(`Item "${data.name}" created successfully`);
      }

      setShowForm(false);
      setEditingItem(null);
      await loadItems(); // Refresh the list
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to save item';
      setError(errorMsg);
      showError(errorMsg);
      throw err; // Re-throw to let form handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      setError(null);
      const item = items.find(i => i.id === itemId);
      await deleteItem(itemId);
      showSuccess(`Item "${item?.name || 'Item'}" deleted successfully`);
      await loadItems(); // Refresh the list
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete item';
      setError(errorMsg);
      showError(errorMsg);
      throw err; // Re-throw to let ItemCard handle it
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleLend = (item: Item) => {
    setLendingItem(item);
    setShowLendDialog(true);
  };

  const handleLendSuccess = async () => {
    // Refresh items list after successful lending (T075)
    showSuccess(`Item "${lendingItem?.name}" lent successfully`);
    await loadItems();
    setShowLendDialog(false);
    setLendingItem(null);
  };

  const handleLendClose = () => {
    setShowLendDialog(false);
    setLendingItem(null);
  };

  const handleReturn = (item: Item) => {
    setReturningItem(item);
    setShowReturnDialog(true);
  };

  const handleReturnSuccess = async () => {
    // Refresh items list after successful return (T094)
    showSuccess(`Item "${returningItem?.name}" returned successfully`);
    await loadItems();
    setShowReturnDialog(false);
    setReturningItem(null);
  };

  const handleReturnClose = () => {
    setShowReturnDialog(false);
    setReturningItem(null);
  };

  const handleViewHistory = (item: Item) => {
    setHistoryItem(item);
    setShowHistoryDialog(true);
  };

  const handleHistoryClose = () => {
    setShowHistoryDialog(false);
    setHistoryItem(null);
  };

  // Get unique categories for filter
  const uniqueCategories = Array.from(new Set(items.map((item) => item.category))).sort();

  return (
    <main id="main-content" className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-200 mb-2">Inventory Management</h1>
        <p className="text-slate-400">Manage your inventory items</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar onSearch={handleSearch} placeholder="Search by name, category, or description..." />
          </div>
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium
                       hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500
                       transition-colors whitespace-nowrap"
          >
            + Add Item
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm text-slate-400">
              Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-600 rounded-lg bg-slate-800/50
                         text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="Available">Available</option>
              <option value="Lent">Lent</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          {/* Category Filter */}
          {uniqueCategories.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="category-filter" className="text-sm text-slate-400">
                Category:
              </label>
              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-slate-600 rounded-lg bg-slate-800/50
                           text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                {uniqueCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Item Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => !isSubmitting && handleFormCancel()}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-slate-200 mb-6">
              {editingItem ? 'Edit Item' : 'Create New Item'}
            </h2>
            <ItemForm
              item={editingItem}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Items List */}
      <ItemList
        items={filteredItems}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onLend={handleLend}
        onReturn={handleReturn}
        onViewHistory={handleViewHistory}
        isLoading={isLoading}
      />

      {/* Lend Dialog (T070, T073, T074, T075, T076) */}
      {showLendDialog && lendingItem && (
        <LendDialog
          itemId={lendingItem.id}
          itemName={lendingItem.name}
          isOpen={showLendDialog}
          onClose={handleLendClose}
          onSuccess={handleLendSuccess}
        />
      )}

      {/* Return Dialog (T090, T092, T093, T094, T095) */}
      {showReturnDialog && returningItem && (
        <ReturnDialog
          itemId={returningItem.id}
          itemName={returningItem.name}
          isOpen={showReturnDialog}
          onClose={handleReturnClose}
          onSuccess={handleReturnSuccess}
        />
      )}

      {/* History Dialog (T107, T111, T112, T113) */}
      {showHistoryDialog && historyItem && (
        <HistoryDialog
          itemId={historyItem.id}
          itemName={historyItem.name}
          onClose={handleHistoryClose}
        />
      )}
    </main>
  );
}
