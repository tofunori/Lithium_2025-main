// frontend/src/components/Toast.tsx
import React, { useEffect, useState } from 'react';
import './Toast.css';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleRemove();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300); // Match animation duration
  };

  const getToastClasses = () => {
    const baseClasses = 'toast align-items-center border-0';
    const typeClasses = {
      success: 'text-bg-success',
      error: 'text-bg-danger', 
      warning: 'text-bg-warning text-dark',
      info: 'text-bg-info'
    };
    
    let classes = `${baseClasses} ${typeClasses[toast.type]}`;
    
    if (isVisible && !isExiting) {
      classes += ' show';
    }
    
    return classes;
  };

  const getIcon = () => {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    return icons[toast.type];
  };

  return (
    <div 
      className={getToastClasses()} 
      role="alert" 
      aria-live="assertive" 
      aria-atomic="true"
      style={{
        transition: 'all 0.3s ease-in-out',
        transform: isVisible && !isExiting ? 'translateX(0)' : 'translateX(100%)',
        opacity: isVisible && !isExiting ? 1 : 0
      }}
    >
      <div className="d-flex">
        <div className="toast-body d-flex align-items-start">
          <i className={`${getIcon()} me-2 mt-1`}></i>
          <div className="flex-grow-1">
            <div className="fw-bold">{toast.title}</div>
            {toast.message && (
              <div className="small">{toast.message}</div>
            )}
          </div>
        </div>
        <button
          type="button"
          className="btn-close btn-close-white me-2 m-auto"
          aria-label="Close"
          onClick={handleRemove}
        ></button>
      </div>
    </div>
  );
};

export default Toast;