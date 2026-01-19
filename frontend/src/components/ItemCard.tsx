/**
 * ItemCard Component
 * 
 * Displays individual item information in a card format.
 * Includes actions: Edit, Delete (with confirmation dialog - T049).
 * 
 * @see T045, T049
 */

import { useState } from 'react';
import type { Item } from '../services/itemService';

interface ItemCardProps {
  item: Item;
  onEdit: (item: Item) => void;
  onDelete: (itemId: string) => Promise<void>;
}

export default function ItemCard({ item, onEdit, onDelete }: ItemCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(item.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      setIsDeleting(false);
      // Error will be handled by parent component
    }
  };

  // Status badge colors
  const statusColors = {
    Available: 'bg-green-500/20 text-green-400 border-green-500/30',
    Lent: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Maintenance: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4
                      hover:border-slate-600 transition-colors">
        {/* Header: Name and Status */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-slate-200 flex-1 mr-2">
            {item.name}
          </h3>
          <span
            className={`px-2 py-1 text-xs font-medium rounded border ${statusColors[item.status]}`}
          >
            {item.status}
          </span>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-slate-400 mb-3 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Category */}
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="h-4 w-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          <span className="text-sm text-slate-400">{item.category}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-slate-700">
          <button
            onClick={() => onEdit(item)}
            className="flex-1 px-3 py-2 text-sm bg-blue-500/20 text-blue-400 rounded-lg
                       hover:bg-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500
                       transition-colors"
            aria-label={`Edit ${item.name}`}
          >
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 px-3 py-2 text-sm bg-red-500/20 text-red-400 rounded-lg
                       hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500
                       transition-colors"
            aria-label={`Delete ${item.name}`}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog (T049) */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => !isDeleting && setShowDeleteConfirm(false)}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-slate-200 mb-2">
              Delete Item
            </h3>
            <p className="text-slate-400 mb-6">
              Are you sure you want to delete <strong className="text-slate-200">"{item.name}"</strong>?
              This action cannot be undone.
            </p>

            {item.status === 'Lent' && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-400">
                  ⚠️ This item is currently lent out and cannot be deleted.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={isDeleting || item.status === 'Lent'}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium
                           hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg font-medium
                           hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
