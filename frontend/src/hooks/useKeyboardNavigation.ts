/**
 * useKeyboardNavigation Hook (T160)
 * 
 * Provides keyboard navigation support for dialogs and modals.
 * - ESC key to close
 * - Tab key trapping (keeps focus within dialog)
 * 
 * @see T160
 */

import { useEffect, useCallback } from 'react';

interface UseKeyboardNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  closeOnEscape?: boolean;
}

export function useKeyboardNavigation({
  isOpen,
  onClose,
  closeOnEscape = true,
}: UseKeyboardNavigationProps) {
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Close on ESC key
    if (closeOnEscape && event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }, [closeOnEscape, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Store the currently focused element
    const previouslyFocused = document.activeElement as HTMLElement;

    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to previously focused element
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, handleKeyDown]);
}

/**
 * useFocusTrap Hook (T160)
 * 
 * Traps focus within a modal/dialog element.
 * Prevents tabbing outside of the modal.
 */
export function useFocusTrap(isOpen: boolean, containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    
    // Get all focusable elements
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Focus first element
    if (firstFocusable) {
      firstFocusable.focus();
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      // Shift + Tab (going backwards)
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } 
      // Tab (going forwards)
      else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen, containerRef]);
}
