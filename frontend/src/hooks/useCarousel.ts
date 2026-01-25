/**
 * useCarousel Hook
 * 
 * Custom hook for managing carousel navigation state.
 * Handles current index, next/prev navigation, keyboard controls.
 * 
 * @see T032, T033
 */

import { useState, useEffect, useCallback } from 'react';

interface UseCarouselOptions {
  itemCount: number;
  initialIndex?: number;
}

interface UseCarouselReturn {
  currentIndex: number;
  canGoNext: boolean;
  canGoPrev: boolean;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
}

export function useCarousel({ 
  itemCount, 
  initialIndex = 0 
}: UseCarouselOptions): UseCarouselReturn {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Ensure index is within bounds when itemCount changes
  useEffect(() => {
    if (currentIndex >= itemCount && itemCount > 0) {
      setCurrentIndex(itemCount - 1);
    }
  }, [itemCount, currentIndex]);

  // Computed values
  const canGoNext = currentIndex < itemCount - 1;
  const canGoPrev = currentIndex > 0;

  // Navigation functions
  const next = useCallback(() => {
    if (canGoNext) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [canGoNext]);

  const prev = useCallback(() => {
    if (canGoPrev) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [canGoPrev]);

  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < itemCount) {
      setCurrentIndex(index);
    }
  }, [itemCount]);

  // Keyboard event listener (T033)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        prev();
      } else if (event.key === 'ArrowRight') {
        next();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [next, prev]);

  return {
    currentIndex,
    canGoNext,
    canGoPrev,
    next,
    prev,
    goTo,
  };
}
