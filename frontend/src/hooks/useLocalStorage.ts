/**
 * useLocalStorage Hook
 * 
 * Custom hook for persisting state in localStorage with TypeScript support.
 * Automatically syncs state changes to localStorage and initializes from stored value.
 * 
 * @see T026 [US2]
 */

import { useState, useEffect } from 'react';

/**
 * Hook to persist state in localStorage
 * @param key - localStorage key
 * @param initialValue - fallback value if no stored value exists
 * @returns [storedValue, setValue] - tuple similar to useState
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Initialize state from localStorage or use initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage whenever storedValue changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
