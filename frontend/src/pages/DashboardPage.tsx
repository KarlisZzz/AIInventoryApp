/**
 * Dashboard Page
 * 
 * Main landing page showing:
 * - Items currently out with borrower information
 * - Searchable inventory table
 * - Quick statistics
 * 
 * Implements User Story 5 - Dashboard Overview
 * 
 * @see T126, T127, T128
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/ToastContainer';
import { getDashboardData, type DashboardData } from '../services/dashboardService';
import { updateItem, deleteItem, type UpdateItemData } from '../services/itemService';
import CurrentlyOutSection from '../components/CurrentlyOutSection';
import SearchBar from '../components/SearchBar';
import ItemList from '../components/ItemList';
import ReturnDialog from '../components/ReturnDialog';
import HistoryDialog from '../components/HistoryDialog';
import LendDialog from '../components/LendDialog';
import ItemForm from '../components/ItemForm';
import type { Item } from '../services/itemService';

const DashboardPage = () => {
  const { showSuccess, showError } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [returnDialogItem, setReturnDialogItem] = useState<Item | null>(null);
  const [historyDialogItem, setHistoryDialogItem] = useState<Item | null>(null);
  const [lendDialogItem, setLendDialogItem] = useState<Item | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load dashboard data
  const loadDashboard = useCallback(async (search?: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const filters = search ? { search } : undefined;
      const data = await getDashboardData(filters);
      
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Handle search with debouncing (handled by SearchBar component)
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    loadDashboard(query);
  }, [loadDashboard]);

  // Handle return item
  const handleReturn = async (item: Item) => {
    setReturnDialogItem(item);
  };

  const handleReturnSuccess = async () => {
    showSuccess(`Item "${returnDialogItem?.name}" returned successfully`);
    setReturnDialogItem(null);
    // Reload dashboard to reflect changes (T128)
    await loadDashboard(searchQuery);
  };

  // Handle view history
  const handleViewHistory = (item: Item) => {
    setHistoryDialogItem(item);
  };

  // Handle lend item (for items in the all items section)
  const handleLend = (item: Item) => {
    setLendDialogItem(item);
  };

  const handleLendSuccess = async () => {
    showSuccess(`Item "${lendDialogItem?.name}" lent successfully`);
    setLendDialogItem(null);
    // Reload dashboard to reflect changes (T128)
    await loadDashboard(searchQuery);
  };

  // Handle delete
  const handleDelete = async (itemId: string) => {
    try {
      await deleteItem(itemId);
      showSuccess('Item deleted successfully');
      await loadDashboard(searchQuery);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete item';
      showError(errorMsg);
    }
  };

  // Handle edit
  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setShowEditForm(true);
  };

  // Handle edit form submission
  const handleEditFormSubmit = async (data: UpdateItemData): Promise<Item | void> => {
    try {
      setIsSubmitting(true);
      setError(null);

      const result = await updateItem(editingItem!.id, data);
      showSuccess(`Item "${data.name || editingItem!.name}" updated successfully`);

      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update item';
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit form completion
  const handleEditFormComplete = async () => {
    await loadDashboard(searchQuery);
    setShowEditForm(false);
    setEditingItem(null);
  };

  return (
    <main id="main-content" className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-200 mb-2">Dashboard</h1>
        <p className="text-slate-400">
          Overview of your inventory and lending activity
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Items</p>
                <p className="text-3xl font-bold text-slate-200">
                  {dashboardData.stats.totalItems}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Currently Out</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {dashboardData.stats.itemsOut}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Available</p>
                <p className="text-3xl font-bold text-green-400">
                  {dashboardData.stats.itemsAvailable}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items Currently Out Section */}
      <div className="mb-8">
        <CurrentlyOutSection
          items={dashboardData?.currentlyOut || []}
          onReturn={handleReturn}
          onViewHistory={handleViewHistory}
          isLoading={isLoading}
        />
      </div>

      {/* All Items Section with Search */}
      <div className="glass-card p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-200 mb-4">All Inventory Items</h2>
          <SearchBar 
            onSearch={handleSearch}
            placeholder="Search by name, description, or category..."
          />
        </div>

        <ItemList
          items={dashboardData?.allItems || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onLend={handleLend}
          onReturn={handleReturn}
          onViewHistory={handleViewHistory}
          isLoading={isLoading}
        />
      </div>

      {/* Dialogs */}
      {returnDialogItem && (
        <ReturnDialog
          itemId={returnDialogItem.id}
          itemName={returnDialogItem.name}
          isOpen={true}
          onClose={() => setReturnDialogItem(null)}
          onSuccess={handleReturnSuccess}
        />
      )}

      {historyDialogItem && (
        <HistoryDialog
          itemId={historyDialogItem.id}
          itemName={historyDialogItem.name}
          onClose={() => setHistoryDialogItem(null)}
        />
      )}

      {lendDialogItem && (
        <LendDialog
          itemId={lendDialogItem.id}
          itemName={lendDialogItem.name}
          isOpen={true}
          onClose={() => setLendDialogItem(null)}
          onSuccess={handleLendSuccess}
        />
      )}

      {/* Edit Item Dialog */}
      {showEditForm && editingItem && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => {
            if (!isSubmitting) {
              setShowEditForm(false);
              setEditingItem(null);
            }
          }}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-slate-200 mb-6">
              Edit Item
            </h2>
            <ItemForm
              item={editingItem}
              onSubmit={handleEditFormSubmit}
              onCancel={() => {
                if (!isSubmitting) {
                  setShowEditForm(false);
                  setEditingItem(null);
                }
              }}
              onComplete={handleEditFormComplete}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      )}
    </main>
  );
};

export default DashboardPage;
