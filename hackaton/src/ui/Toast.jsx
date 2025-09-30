import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const toastVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 40 }
};

export const Toast = ({ 
  message, 
  type = 'info', 
  isOpen, 
  onClose, 
  duration = 3000 
}) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose && onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  const typeStyles = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500 text-gray-900',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded shadow-lg text-white ${typeStyles[type]}`}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={toastVariants}
        >
          <div className="flex items-center">
            <span className="mr-2">
              {type === 'success' && (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              )}
              {type === 'error' && (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path stroke="currentColor" strokeWidth="2" d="M15 9l-6 6M9 9l6 6" /></svg>
              )}
              {type === 'info' && (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path stroke="currentColor" strokeWidth="2" d="M12 8v4m0 4h.01" /></svg>
              )}
              {type === 'warning' && (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 9v2m0 4h.01" /><path stroke="currentColor" strokeWidth="2" d="M10.29 3.86l-7.09 12.42A2 2 0 005 19h14a2 2 0 001.8-2.72L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
              )}
            </span>
            <span>{message}</span>
            <button
              className="ml-4 text-white hover:text-gray-200 focus:outline-none"
              onClick={onClose}
              aria-label="Close"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4">
    <AnimatePresence>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </AnimatePresence>
  </div>
);

export default Toast;
