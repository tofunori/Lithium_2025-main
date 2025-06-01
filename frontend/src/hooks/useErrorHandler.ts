// frontend/src/hooks/useErrorHandler.ts
import { useCallback, useState } from 'react';
import { useToastContext } from '../context/ToastContext';
import { ServiceError } from '../services/errorHandling';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  fallbackMessage?: string;
  retryable?: boolean;
  context?: string;
}

export interface ErrorState {
  error: Error | null;
  isError: boolean;
  errorMessage: string;
  errorContext?: string;
  canRetry: boolean;
}

export interface UseErrorHandlerReturn {
  errorState: ErrorState;
  handleError: (error: unknown, options?: ErrorHandlerOptions) => void;
  clearError: () => void;
  retry: (() => void) | null;
}

const DEFAULT_OPTIONS: ErrorHandlerOptions = {
  showToast: true,
  logToConsole: true,
  fallbackMessage: 'An unexpected error occurred',
  retryable: false
};

export function useErrorHandler(
  defaultOptions: ErrorHandlerOptions = {}
): UseErrorHandlerReturn {
  const { showError } = useToastContext();
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    errorMessage: '',
    canRetry: false
  });
  const [retryCallback, setRetryCallback] = useState<(() => void) | null>(null);

  const handleError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...defaultOptions, ...options };
    
    let errorInstance: Error;
    let errorMessage: string;
    let errorContext: string | undefined;
    
    // Parse different error types
    if (error instanceof ServiceError) {
      errorInstance = error;
      errorMessage = error.message;
      errorContext = error.context;
    } else if (error instanceof Error) {
      errorInstance = error;
      errorMessage = error.message;
      errorContext = mergedOptions.context;
    } else if (typeof error === 'string') {
      errorInstance = new Error(error);
      errorMessage = error;
      errorContext = mergedOptions.context;
    } else {
      errorInstance = new Error(mergedOptions.fallbackMessage || 'Unknown error');
      errorMessage = mergedOptions.fallbackMessage || 'Unknown error';
      errorContext = mergedOptions.context;
    }
    
    // Log to console if enabled
    if (mergedOptions.logToConsole) {
      console.error(`[Error${errorContext ? ` in ${errorContext}` : ''}]:`, errorInstance);
    }
    
    // Show toast if enabled
    if (mergedOptions.showToast) {
      showError(
        errorContext || 'Error',
        errorMessage
      );
    }
    
    // Update error state
    setErrorState({
      error: errorInstance,
      isError: true,
      errorMessage,
      errorContext,
      canRetry: mergedOptions.retryable || false
    });
  }, [showError, defaultOptions]);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      errorMessage: '',
      canRetry: false
    });
    setRetryCallback(null);
  }, []);

  const setRetry = useCallback((callback: () => void) => {
    setRetryCallback(() => callback);
  }, []);

  return {
    errorState,
    handleError,
    clearError,
    retry: retryCallback
  };
}

// Standardized error types
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'You do not have permission to perform this action') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

// Error type guards
export const isValidationError = (error: unknown): error is ValidationError => {
  return error instanceof ValidationError;
};

export const isNetworkError = (error: unknown): error is NetworkError => {
  return error instanceof NetworkError;
};

export const isAuthenticationError = (error: unknown): error is AuthenticationError => {
  return error instanceof AuthenticationError;
};

export const isAuthorizationError = (error: unknown): error is AuthorizationError => {
  return error instanceof AuthorizationError;
};

export const isNotFoundError = (error: unknown): error is NotFoundError => {
  return error instanceof NotFoundError;
};

// Error mapping utility
export function mapErrorToUserMessage(error: unknown): string {
  if (isValidationError(error)) {
    return error.field 
      ? `Invalid ${error.field}: ${error.message}`
      : error.message;
  }
  
  if (isNetworkError(error)) {
    if (error.statusCode === 0) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    if (error.statusCode === 404) {
      return 'The requested resource was not found.';
    }
    if (error.statusCode === 500) {
      return 'A server error occurred. Please try again later.';
    }
    return error.message;
  }
  
  if (isAuthenticationError(error)) {
    return 'Please log in to continue.';
  }
  
  if (isAuthorizationError(error)) {
    return error.message;
  }
  
  if (isNotFoundError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}