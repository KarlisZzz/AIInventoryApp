/**
 * ItemCard Component
 * 
 * Displays individual item information in a card format.
 * Includes image display with fallback and placeholder (T023-T025).
 * Includes three-dots dropdown menu for actions (T038-T042 [US3]).
 * 
 * @see T023, T024, T025, T038, T039, T040, T041, T042
 */

import { useState } from 'react';
import type { Item } from '../services/itemService';
import DropdownMenu, { type MenuItem } from './DropdownMenu';

interface ItemCardProps {
  item: Item;
  onEdit: (item: Item) => void;
  onDelete: (itemId: string) => Promise<void>;
  onLend?: (item: Item) => void;
  onReturn?: (item: Item) => void;
  onViewHistory?: (item: Item) => void;
}

export default function ItemCard({ item, onEdit, onDelete, onLend, onReturn, onViewHistory }: ItemCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // T039 [US3]

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

  const handleImageError = () => {
    setImageError(true);
  };

  // Construct full image URL (images are served from /uploads, not /api/v1)
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
  const SERVER_BASE = API_BASE.replace(/\/api\/v1$/, '');
  const imageUrl = item.imageUrl ? `${SERVER_BASE}${item.imageUrl}` : null;

  // T046 [US4]: Handle card click to open edit dialog (except when menu is open)
  const handleCardClick = () => {
    if (!menuOpen) {
      onEdit(item);
    }
  };

  // T040, T041, T042 [US3]: Build menuItems array with all actions
  const menuItems: MenuItem[] = [
    {
      label: 'Edit',
      onClick: () => onEdit(item),
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
  ];

  // Add Lend/Return action based on status
  if (item.status === 'Available' && onLend) {
    menuItems.push({
      label: 'Lend',
      onClick: () => onLend(item),
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    });
  } else if (item.status === 'Lent' && onReturn) {
    menuItems.push({
      label: 'Return',
      onClick: () => onReturn(item),
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
    });
  }

  // Add View History action
  if (onViewHistory) {
    menuItems.push({
      label: 'View History',
      onClick: () => onViewHistory(item),
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    });
  }

  // T042 [US3]: Add Delete action with conditional disabled state for Lent items
  menuItems.push({
    label: 'Delete',
    onClick: () => setShowDeleteConfirm(true),
    disabled: item.status === 'Lent',
    tooltip: item.status === 'Lent' ? 'Cannot delete lent item' : 'Delete item',
    variant: 'danger',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  });

  // Status badge colors
  const statusColors = {
    Available: 'bg-green-500/20 text-green-400 border-green-500/30',
    Lent: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Maintenance: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden
                      hover:border-slate-600 hover:ring-2 hover:ring-blue-500/50 transition-all cursor-pointer">
        {/* Item Image Section (T023, T024, T025) */}
        <div className="aspect-square bg-slate-900/50 relative">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={item.name}
              onError={handleImageError}
              className="w-full h-full object-cover"
            />
          ) : (
            /* Placeholder SVG when no image or error (T024, T025) */
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="h-20 w-20 text-slate-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Status badge overlay */}
          <div className="absolute top-2 left-2">
            <span
              className={`px-2 py-1 text-xs font-medium rounded border backdrop-blur-sm ${statusColors[item.status]}`}
            >
              {item.status}
            </span>
          </div>

          {/* T039, T041 [US3]: Three-dots menu button in top-right corner */}
          <div className="absolute top-2 right-2">
            <DropdownMenu
              items={menuItems}
              isOpen={menuOpen}
              onClose={() => setMenuOpen(false)}
              position="bottom-right"
              triggerElement={
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // T050 [US4]: Prevent card click when opening menu
                    setMenuOpen(!menuOpen);
                  }}
                  className="p-1.5 bg-slate-800/80 backdrop-blur-sm border border-slate-700
                             rounded-lg hover:bg-slate-700/80 focus:outline-none focus:ring-2 
                             focus:ring-blue-500 transition-colors"
                  aria-label="Item actions menu"
                  title="Item actions"
                >
                  <svg
                    className="h-5 w-5 text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>
              }
            />
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4">
          {/* Name */}
          <h3 className="text-lg font-semibold text-slate-200 mb-2">
            {item.name}
          </h3>

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

          {/* T038 [US3]: Actions removed - now in three-dots menu */}
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
