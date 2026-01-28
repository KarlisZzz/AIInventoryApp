/**
 * CategoryManagement Page
 * User Story 1: Manage Item Categories
 * Allows administrators to create, edit, and delete categories
 */

import React, { useState, useEffect } from 'react';
import { AdminCard } from '../../components/admin/AdminCard';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { TableSkeleton } from '../../components/admin/SkeletonLoader';
import { FolderIcon, PlusIcon } from '@heroicons/react/24/outline';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../../services/adminApi';
import type { CategoryWithCount, CreateCategoryRequest } from '../../types/admin';

export const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Create form state
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    categoryId: string | null;
    categoryName: string;
    itemCount: number;
  }>({
    isOpen: false,
    categoryId: null,
    categoryName: '',
    itemCount: 0,
  });

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      setCreateError('Category name is required');
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);
      
      const data: CreateCategoryRequest = {
        name: newCategoryName.trim(),
      };
      
      await createCategory(data);
      setSuccessMessage(`Category "${newCategoryName}" created successfully`);
      setNewCategoryName('');
      await loadCategories();
    } catch (err: any) {
      setCreateError(err.response?.data?.error || 'Failed to create category');
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (category: CategoryWithCount) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditError(null);
  };

  const handleEdit = async (categoryId: string) => {
    if (!editName.trim()) {
      setEditError('Category name is required');
      return;
    }

    try {
      setEditError(null);
      await updateCategory(categoryId, { name: editName.trim() });
      setSuccessMessage(`Category updated successfully`);
      setEditingId(null);
      await loadCategories();
    } catch (err: any) {
      setEditError(err.response?.data?.error || 'Failed to update category');
    }
  };

  const confirmDelete = (category: CategoryWithCount) => {
    setDeleteConfirm({
      isOpen: true,
      categoryId: category.id,
      categoryName: category.name,
      itemCount: category.itemCount,
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirm.categoryId) return;

    try {
      await deleteCategory(deleteConfirm.categoryId);
      setSuccessMessage(`Category "${deleteConfirm.categoryName}" deleted successfully`);
      setDeleteConfirm({ isOpen: false, categoryId: null, categoryName: '', itemCount: 0 });
      await loadCategories();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete category');
      setDeleteConfirm({ isOpen: false, categoryId: null, categoryName: '', itemCount: 0 });
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
          <p className="mt-2 text-gray-600">Create, edit, and delete item categories</p>
        </div>
        <AdminCard title="Create New Category">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded w-40"></div>
          </div>
        </AdminCard>
        <AdminCard title="Categories">
          <TableSkeleton rows={5} cols={4} />
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
        <p className="mt-2 text-gray-600">Create, edit, and delete item categories</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Create Category Form */}
      <AdminCard title="Create New Category">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <input
              type="text"
              id="categoryName"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Electronics, Books, Furniture"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isCreating}
            />
            {createError && (
              <p className="mt-1 text-sm text-red-600">{createError}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isCreating || !newCategoryName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Category'}
          </button>
        </form>
      </AdminCard>

      {/* Categories List */}
      <AdminCard title="Categories">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No categories yet. Create your first category above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === category.id ? (
                        <div>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          {editError && (
                            <p className="text-xs text-red-600 mt-1">{editError}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{category.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" role="cell">
                      <span className="text-sm text-gray-500">{category.itemCount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" role="cell">
                      <span className="text-sm text-gray-500">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" role="cell">
                      {editingId === category.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(category.id)}
                            className="text-green-600 hover:text-green-900"
                            aria-label="Save category changes"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-900"
                            aria-label="Cancel editing"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(category)}
                            className="text-blue-600 hover:text-blue-900"
                            aria-label={`Edit category ${category.name}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDelete(category)}
                            className="text-red-600 hover:text-red-900"
                            aria-label={`Delete category ${category.name}`}
                            disabled={category.itemCount > 0}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, categoryId: null, categoryName: '', itemCount: 0 })}
        onConfirm={handleDelete}
        title="Delete Category"
        message={
          deleteConfirm.itemCount > 0
            ? `This category has ${deleteConfirm.itemCount} item(s) assigned. You cannot delete it until all items are reassigned or deleted.`
            : `Are you sure you want to delete "${deleteConfirm.categoryName}"? This action cannot be undone.`
        }
        confirmText={deleteConfirm.itemCount > 0 ? 'OK' : 'Delete'}
        variant={deleteConfirm.itemCount > 0 ? 'warning' : 'danger'}
      />
    </div>
  );
};

export default CategoryManagement;
