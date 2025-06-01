// frontend/src/hooks/useDebounce.ts
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * A hook that debounces a value with a specified delay
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * A hook that returns a debounced callback function
 * @param callback The callback function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref on each render
  callbackRef.current = callback;

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * A hook that provides debounced search functionality
 * @param searchFn The search function to call
 * @param delay The debounce delay in milliseconds
 * @returns An object with search state and handlers
 */
export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T>,
  delay: number = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const debouncedQuery = useDebounce(query, delay);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults(null);
      return;
    }

    const search = async () => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setIsSearching(true);
      setError(null);

      try {
        const searchResults = await searchFn(debouncedQuery);
        
        // Only update if not aborted
        if (!abortControllerRef.current.signal.aborted) {
          setResults(searchResults);
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err);
        }
      } finally {
        if (!abortControllerRef.current.signal.aborted) {
          setIsSearching(false);
        }
      }
    };

    search();

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery, searchFn]);

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(null);
    setError(null);
  }, []);

  return {
    query,
    debouncedQuery,
    results,
    isSearching,
    error,
    handleQueryChange,
    clearSearch
  };
}