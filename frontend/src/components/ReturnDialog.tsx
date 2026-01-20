/**
 * ReturnDialog Component
 * 
 * Modal dialog for returning a lent item (User Story 3).
 * Includes optional return condition notes and error handling.
 * 
 * Features:
 * - Optional return condition notes field (T093)
 * - Error handling for invalid return attempts (T095)
 * - Form validation and submission handling (T092)
 * 
 * @see specs/001-inventory-lending/spec.md (User Story 3)
 */

import { useState } from 'react';
import { returnItem, type ReturnItemRequest } from '../services/lendingService';

interface ReturnDialogProps {
  itemId: string;
  itemName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReturnDialog({
  itemId,
  itemName,
  isOpen,
  onClose,
  onSuccess,
}: ReturnDialogProps) {
  const [returnConditionNotes, setReturnConditionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError(null);
    setIsSubmitting(true);

    try {
      const request: ReturnItemRequest = {
        itemId,
        returnConditionNotes: returnConditionNotes.trim() || undefined,
      };

      await returnItem(request);
      
      // Success - reset form and close dialog
      setReturnConditionNotes('');
      onSuccess();
      onClose();
      
    } catch (err: any) {
      console.error('Failed to return item:', err);
      
      // Handle specific error cases (T095)
      if (err.response?.status === 400) {
        // Item not lent or invalid status
        setError(
          err.apiError?.error || 
          'This item cannot be returned. It may not be currently lent out.'
        );
      } else if (err.response?.status === 404) {
        setError('Item not found. Please refresh and try again.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Please check your connection and try again.');
      } else if (!err.response) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.message || 'Failed to return item. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReturnConditionNotes('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleClose}
      role="dialog"
      aria-labelledby="return-dialog-title"
      aria-modal="true"
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4">
          <h2 id="return-dialog-title" className="text-xl font-semibold text-slate-200 mb-1">
            Return Item
          </h2>
          <p className="text-sm text-slate-400">
            Return <span className="font-medium text-slate-300">"{itemName}"</span>
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Return Condition Notes (T093) */}
          <div className="mb-6">
            <label
              htmlFor="returnConditionNotes"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Condition Notes (Optional)
            </label>
            <textarea
              id="returnConditionNotes"
              value={returnConditionNotes}
              onChange={(e) => setReturnConditionNotes(e.target.value)}
              placeholder="Note the condition of the item upon return..."
              rows={3}
              maxLength={500}
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg
                         text-slate-200 placeholder-slate-500
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            />
            <p className="mt-1 text-xs text-slate-500">
              {returnConditionNotes.length}/500 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium
                         hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Returning...' : 'Return Item'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg font-medium
                         hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
