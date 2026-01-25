/**
 * useCarousel Hook Tests (T071)
 * 
 * Tests for the useCarousel custom hook covering:
 * - State management (currentIndex)
 * - Navigation functions (next, prev)
 * - Boundary conditions (canGoNext, canGoPrev)
 * - Keyboard event handling
 * - Edge cases (single item, empty, wrapping)
 * 
 * @see specs/003-dashboard-improvements/tasks.md (T071)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCarousel } from '../../hooks/useCarousel';

describe('useCarousel Hook', () => {
  describe('Initialization', () => {
    it('starts at index 0 by default', () => {
      const { result } = renderHook(() => useCarousel({ itemCount: 5 }));
      expect(result.current.currentIndex).toBe(0);
    });

    it('handles zero items', () => {
      const { result } = renderHook(() => useCarousel({ itemCount: 0 }));
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.canGoPrev).toBe(false);
    });

    it('handles single item', () => {
      const { result } = renderHook(() => useCarousel({ itemCount: 1 }));
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.canGoPrev).toBe(false);
    });
  });

  describe('Navigation - Next', () => {
    it('increments currentIndex when next() is called', () => {
      const { result } = renderHook(() => useCarousel({ itemCount: 5 }));
      
      act(() => {
        result.current.next();
      });
      
      expect(result.current.currentIndex).toBe(1);
    });

    it('can navigate through all items', () => {
      const { result } = renderHook(() => useCarousel({ itemCount: 3 }));
      
      act(() => {
        result.current.next(); // 0 -> 1
      });
      expect(result.current.currentIndex).toBe(1);
      
      act(() => {
        result.current.next(); // 1 -> 2
      });
      expect(result.current.currentIndex).toBe(2);
    });

    it('does not go beyond last item', () => {
      const { result } = renderHook(() => useCarousel({ itemCount: 3 }));
      
      act(() => {
        result.current.next(); // 0 -> 1
        result.current.next(); // 1 -> 2
        result.current.next(); // 2 -> 2 (stays)
      });
      
      expect(result.current.currentIndex).toBe(2);
    });
  });

  describe('Navigation - Previous', () => {
    it('decrements currentIndex when prev() is called', () => {
      const { result } = renderHook(() => useCarousel({ itemCount: 5 }));
      
      // Move to index 2 first
      act(() => {
        result.current.next();
        result.current.next();
      });
      expect(result.current.currentIndex).toBe(2);
      
      // Then go back
      act(() => {
        result.current.prev();
      });
      expect(result.current.currentIndex).toBe(1);
    });

    it('does not go below index 0', () => {
      const { result } = renderHook(() => useCarousel({ itemCount: 5 }));
      
      act(() => {
        result.current.prev(); // 0 -> 0 (stays)
        result.current.prev(); // 0 -> 0 (stays)
      });
      
      expect(result.current.currentIndex).toBe(0);
    });

    it('can navigate back to start', () => {
      const { result } = renderHook(() => useCarousel({ itemCount: 3 }));
      
      // Go to last item
      act(() => {
        result.current.next();
        result.current.next();
      });
      expect(result.current.currentIndex).toBe(2);
      
      // Navigate back to start
      act(() => {
        result.current.prev(); // 2 -> 1
        result.current.prev(); // 1 -> 0
      });
      expect(result.current.currentIndex).toBe(0);
    });
  });

  describe('Boundary Flags', () => {
    it('canGoNext is true when not at last item', () => {
      const { result } = renderHook(() => useCarousel({ itemCount: 5 }));
      expect(result.current.canGoNext).toBe(true);
    });

    it('canGoNext is false when at last item', () => {
      const { result } = renderHook(() => useCarousel({ itemCount: 3 }));
      
      act(() => {
        result.current.next();
        result.current.next();
      });
      
      expect(result.current.currentIndex).toBe(2);
      expect(result.current.canGoNext).toBe(false);
    });

    it('canGoPrev is false when at first item', () => {
      const { result } = renderHook(() => useCarousel({ itemCount: 5 }));
      expect(result.current.canGoPrev).toBe(false);
    });

    it('canGoPrev is true when not at first item', () => {
      const { result } = renderHook(() => useCarousel({ itemCount: 5 }));
      
      act(() => {
        result.current.next();
      });
      
      expect(result.current.currentIndex).toBe(1);
      expect(result.current.canGoPrev).toBe(true);
    });

    it('updates boundary flags dynamically', () => {
      const { result } = renderHook(() => useCarousel({ itemCount: 3 }));
      
      // Start: can go next, cannot go prev
      expect(result.current.canGoNext).toBe(true);
      expect(result.current.canGoPrev).toBe(false);
      
      // Middle: can go both ways
      act(() => {
        result.current.next();
      });
      expect(result.current.canGoNext).toBe(true);
      expect(result.current.canGoPrev).toBe(true);
      
      // End: cannot go next, can go prev
      act(() => {
        result.current.next();
      });
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.canGoPrev).toBe(true);
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      // Clear any existing event listeners
      vi.clearAllMocks();
    });

    it('responds to ArrowRight key', () => {
      const { result } = renderHook(() => useCarousel({ itemCount: 5 }));
      
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
        window.dispatchEvent(event);
      });
      
      expect(result.current.currentIndex).toBe(1);
    });

    it('responds to ArrowLeft key', () => {
      const { result } = renderHook(() => useCarousel({ itemCount: 5 }));
      
      // Move to index 2 first
      act(() => {
        result.current.next();
        result.current.next();
      });
      
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
        window.dispatchEvent(event);
      });
      
      expect(result.current.currentIndex).toBe(1);
    });

    it('ignores other keys', () => {
      const { result } = renderHook(() => useCarousel({ itemCount: 5 }));
      
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        window.dispatchEvent(event);
      });
      
      expect(result.current.currentIndex).toBe(0);
    });

    it('cleans up keyboard listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = renderHook(() => useCarousel({ itemCount: 5 }));
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid next() calls', () => {
      const { result } = renderHook(() => useCarousel({ itemCount: 5 }));
      
      act(() => {
        result.current.next();
        result.current.next();
        result.current.next();
        result.current.next();
        result.current.next();
        result.current.next(); // Beyond end
      });
      
      expect(result.current.currentIndex).toBe(4); // Last valid index
    });

    it('handles rapid prev() calls', () => {
      const { result } = renderHook(() => useCarousel({ itemCount: 5 }));
      
      act(() => {
        result.current.prev();
        result.current.prev();
        result.current.prev();
      });
      
      expect(result.current.currentIndex).toBe(0); // First index
    });

    it('handles alternating navigation', () => {
      const { result } = renderHook(() => useCarousel({ itemCount: 5 }));
      
      act(() => {
        result.current.next();  // 0 -> 1
      });
      expect(result.current.currentIndex).toBe(1);
      
      act(() => {
        result.current.next();  // 1 -> 2
      });
      expect(result.current.currentIndex).toBe(2);
      
      act(() => {
        result.current.prev();  // 2 -> 1
      });
      expect(result.current.currentIndex).toBe(1);
      
      act(() => {
        result.current.next();  // 1 -> 2
      });
      expect(result.current.currentIndex).toBe(2);
      
      act(() => {
        result.current.prev();  // 2 -> 1
      });
      expect(result.current.currentIndex).toBe(1);
      
      act(() => {
        result.current.prev();  // 1 -> 0
      });
      expect(result.current.currentIndex).toBe(0);
    });

    it('handles item count change', () => {
      const { result, rerender } = renderHook(
        ({ itemCount }) => useCarousel({ itemCount }),
        { initialProps: { itemCount: 5 } }
      );
      
      // Navigate to index 3
      act(() => {
        result.current.next();
        result.current.next();
        result.current.next();
      });
      expect(result.current.currentIndex).toBe(3);
      
      // Reduce item count to 2 (current index now out of bounds)
      rerender({ itemCount: 2 });
      
      // Hook should handle this gracefully
      expect(result.current.canGoNext).toBe(false);
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      let renderCount = 0;
      
      const { result } = renderHook(() => {
        renderCount++;
        return useCarousel({ itemCount: 5 });
      });
      
      const initialRenderCount = renderCount;
      
      // Multiple calls that don't change state
      act(() => {
        result.current.prev(); // Cannot go prev from index 0
        result.current.prev(); // Cannot go prev from index 0
      });
      
      // Should not cause re-renders since state didn't change
      expect(renderCount).toBe(initialRenderCount);
    });
  });

  describe('Integration', () => {
    it('full navigation cycle', () => {
      const { result } = renderHook(() => useCarousel({ itemCount: 4 }));
      
      // Forward through all items
      expect(result.current.currentIndex).toBe(0);
      
      act(() => result.current.next());
      expect(result.current.currentIndex).toBe(1);
      
      act(() => result.current.next());
      expect(result.current.currentIndex).toBe(2);
      
      act(() => result.current.next());
      expect(result.current.currentIndex).toBe(3);
      
      // At end
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.canGoPrev).toBe(true);
      
      // Backward through all items
      act(() => result.current.prev());
      expect(result.current.currentIndex).toBe(2);
      
      act(() => result.current.prev());
      expect(result.current.currentIndex).toBe(1);
      
      act(() => result.current.prev());
      expect(result.current.currentIndex).toBe(0);
      
      // At start
      expect(result.current.canGoNext).toBe(true);
      expect(result.current.canGoPrev).toBe(false);
    });
  });
});
