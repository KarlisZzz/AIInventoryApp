/**
 * LendDialog Component
 * 
 * Modal dialog for lending an item to a user (User Story 2).
 * Includes user selection, optional condition notes, and error handling.
 * 
 * Features:
 * - User selection via searchable dropdown (T071)
 * - Optional condition notes field (T074)
 * - Error handling for concurrent lending attempts (T076)
 * - Keyboard navigation support (T160)
 * - ARIA labels for accessibility (T159)
 * 
 * @see specs/001-inventory-lending/spec.md (User Story 2)
 */

import { useState, useRef } from 'react';
import { useKeyboardNavigation, useFocusTrap } from '../hooks/useKeyboardNavigation';
import UserSelect from './UserSelect';
import { lendItem, type LendItemRequest } from '../services/lendingService';

interface LendDialogProps {
  itemId: string;
  itemName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LendDialog({
  itemId,
  itemName,
  isOpen,
  onClose,
  onSuccess,
}: LendDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [conditionNotes, setConditionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSelectError, setUserSelectError] = useState<string | null>(null);

  // Keyboard navigation support (T160)
  useKeyboardNavigation({ isOpen, onClose, closeOnEscape: !isSubmitting });
  useFocusTrap(isOpen, dialogRef);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!selectedUserId) {
      setUserSelectError('Please select a user');
      return;
    }
    
    setUserSelectError(null);
    setError(null);
    setIsSubmitting(true);

    try {
      const request: LendItemRequest = {
        itemId,
        userId: selectedUserId,
        conditionNotes: conditionNotes.trim() || undefined,
      };

      await lendItem(request);
      
      // Success - reset form and close dialog
      setSelectedUserId(null);
      setConditionNotes('');
      onSuccess();
      onClose();
      
    } catch (err: any) {
      console.error('Failed to lend item:', err);
      
      // Handle specific error cases (T076)
      if (err.response?.status === 400) {
        // Item already lent or not available (concurrent lending attempt)
        setError(
          err.apiError?.error || 
          'This item cannot be lent. It may already be lent to someone else or is under maintenance.'
        );
      } else if (err.response?.status === 404) {
        setError('Item or user not found. Please refresh and try again.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Please check your connection and try again.');
      } else if (!err.response) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.message || 'Failed to lend item. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedUserId(null);
      setConditionNotes('');
      setError(null);
      setUserSelectError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 modal-backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div 
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lend-dialog-title"
      >
        <div
          ref={dialogRef}
          className="bg-white rounded-lg shadow-xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 id="lend-dialog-title" className="text-xl font-semibold text-gray-900">Lend Item</h2>
            <p className="mt-1 text-sm text-gray-600">
              Lending: <span className="font-medium">{itemName}</span>
            </p>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-4">
            {/* Error banner */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <svg
                    className="w-5 h-5 text-red-400 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* User selection */}
            <div className="mb-4">
              <UserSelect
                value={selectedUserId}
                onChange={setSelectedUserId}
                error={userSelectError || undefined}
                disabled={isSubmitting}
              />
            </div>

            {/* Condition notes */}
            <div className="mb-4">
              <label
                htmlFor="conditionNotes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Condition Notes (Optional)
              </label>
              <textarea
                id="conditionNotes"
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                disabled={isSubmitting}
                rows={3}
                maxLength={1000}
                placeholder="Note any existing damage or condition concerns..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                {conditionNotes.length}/1000 characters
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Lending...
                  </>
                ) : (
                  'Lend Item'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
