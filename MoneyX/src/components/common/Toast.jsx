import React, { createContext, useContext, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, variant = 'default') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, variant }]);
    
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const toast = {
    success: (message) => addToast(message, 'success'),
    error: (message) => addToast(message, 'error'),
    info: (message) => addToast(message, 'default'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ message, variant, onClose }) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    default: AlertCircle,
  };

  const Icon = icons[variant] || icons.default;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg shadow-lg border animate-slide-in bg-background',
        {
          'border-green-500/50': variant === 'success',
          'border-red-500/50': variant === 'error',
          'border-border': variant === 'default',
        }
      )}
    >
      <Icon
        className={cn('h-5 w-5 mt-0.5', {
          'text-green-600': variant === 'success',
          'text-red-600': variant === 'error',
          'text-blue-600': variant === 'default',
        })}
      />
      <p className="text-sm flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};