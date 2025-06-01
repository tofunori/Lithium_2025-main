// frontend/src/components/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'light' | 'dark';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  text,
  fullScreen = false,
  className = ''
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'spinner-border-sm';
      case 'lg': return 'spinner-border-lg';
      default: return '';
    }
  };

  const spinner = (
    <div className={`d-flex align-items-center ${className}`}>
      <div 
        className={`spinner-border text-${variant} ${getSizeClass()}`} 
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {text && (
        <span className="ms-2 text-muted">{text}</span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div 
        className="d-flex justify-content-center align-items-center position-fixed top-0 start-0 w-100 h-100 bg-light bg-opacity-75"
        style={{ zIndex: 1070 }}
      >
        <div className="text-center">
          <div className={`spinner-border text-${variant}`} role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          {text && (
            <div className="mt-2 text-muted">{text}</div>
          )}
        </div>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;