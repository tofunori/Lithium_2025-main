// frontend/src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ServiceError } from '../services/errorHandling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console and potentially to a logging service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // You could send this to a logging service like Sentry here
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isServiceError = this.state.error instanceof ServiceError;
      const errorMessage = isServiceError 
        ? this.state.error.message 
        : 'An unexpected error occurred. Please try again.';

      return (
        <div className="container mt-4">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Something went wrong
            </h4>
            <p className="mb-3">{errorMessage}</p>
            
            {isServiceError && (
              <small className="text-muted d-block mb-3">
                Context: {this.state.error.context}
              </small>
            )}

            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-danger btn-sm" 
                onClick={this.handleRetry}
              >
                <i className="fas fa-redo me-1"></i>
                Try Again
              </button>
              <button 
                className="btn btn-outline-secondary btn-sm" 
                onClick={() => window.location.reload()}
              >
                <i className="fas fa-refresh me-1"></i>
                Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-3">
                <summary className="text-muted small">
                  <i className="fas fa-bug me-1"></i>
                  Developer Details
                </summary>
                <pre className="small mt-2 p-2 bg-light rounded">
                  {this.state.error?.stack}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;