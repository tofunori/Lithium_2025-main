// frontend/src/components/ToastContainer.tsx
import React from 'react';
import Toast, { ToastMessage } from './Toast';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div 
      className="toast-container position-fixed top-0 end-0 p-3" 
      style={{ zIndex: 1080 }}
    >
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          toast={toast} 
          onRemove={onRemove} 
        />
      ))}
    </div>
  );
};

export default ToastContainer;