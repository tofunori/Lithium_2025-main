// frontend/src/components/EnhancedErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { mapErrorToUserMessage } from '../hooks/useErrorHandler';
import './EnhancedErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'section' | 'component';
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    
    // Log error details
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
    
    // Update state with error info
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
    
    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }
    
    // Send error to monitoring service (if configured)
    this.reportError(error, errorInfo);
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Here you would integrate with error monitoring services like Sentry
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      });
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { children, fallback, level = 'component', showDetails = false } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, errorInfo!, this.handleReset);
      }

      // Default error UI based on level
      const userMessage = mapErrorToUserMessage(error);
      
      return (
        <div className={`error-boundary error-boundary-${level}`}>
          <div className="error-content">
            <div className="error-icon">
              {level === 'page' ? (
                <i className="fas fa-exclamation-triangle fa-3x"></i>
              ) : (
                <i className="fas fa-exclamation-circle fa-2x"></i>
              )}
            </div>
            
            <h2 className="error-title">
              {level === 'page' ? 'Something went wrong' : 'Error'}
            </h2>
            
            <p className="error-message">{userMessage}</p>
            
            {errorCount > 2 && (
              <p className="error-warning">
                This error has occurred multiple times. 
                You may need to refresh the page.
              </p>
            )}
            
            <div className="error-actions">
              <button 
                className="btn btn-primary"
                onClick={this.handleReset}
                aria-label="Try again"
              >
                <i className="fas fa-redo me-2"></i>
                Try Again
              </button>
              
              {level === 'page' && (
                <button 
                  className="btn btn-outline-secondary ms-2"
                  onClick={() => window.location.href = '/'}
                  aria-label="Go to home page"
                >
                  <i className="fas fa-home me-2"></i>
                  Go Home
                </button>
              )}
            </div>
            
            {showDetails && errorInfo && (
              <details className="error-details">
                <summary>Error Details (for developers)</summary>
                <div className="error-stack">
                  <h4>Error Stack:</h4>
                  <pre>{error.stack}</pre>
                  
                  <h4>Component Stack:</h4>
                  <pre>{errorInfo.componentStack}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

// Functional component wrapper for easier use with hooks
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for error boundary context (if needed)
export const ErrorBoundaryContext = React.createContext<{
  reset: () => void;
} | null>(null);

export const useErrorBoundary = () => {
  const context = React.useContext(ErrorBoundaryContext);
  
  if (!context) {
    throw new Error('useErrorBoundary must be used within an ErrorBoundary');
  }
  
  return context;
};

export default EnhancedErrorBoundary;