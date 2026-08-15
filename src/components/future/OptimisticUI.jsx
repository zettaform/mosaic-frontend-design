import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Clock, Wifi, WifiOff } from 'lucide-react';

const OptimisticButton = ({ 
  action,
  onSuccess,
  onError,
  children,
  className = '',
  disabled = false,
  ...props 
}) => {
  const [state, setState] = useState('idle'); // idle, pending, success, error
  const [error, setError] = useState(null);

  const handleClick = useCallback(async () => {
    if (disabled || state === 'pending') return;

    setState('pending');
    setError(null);

    try {
      // Optimistically update UI
      onSuccess?.();

      // Perform actual action
      await action();
      
      setState('success');
      
      // Reset to idle after success
      setTimeout(() => {
        setState('idle');
      }, 2000);
    } catch (err) {
      setState('error');
      setError(err.message);
      onError?.(err);
      
      // Reset to idle after error
      setTimeout(() => {
        setState('idle');
        setError(null);
      }, 3000);
    }
  }, [action, onSuccess, onError, disabled, state]);

  const getButtonContent = () => {
    switch (state) {
      case 'pending':
        return (
          <div className="flex items-center space-x-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Clock className="w-4 h-4" />
            </motion.div>
            <span>Processing...</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>Success!</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2">
            <X className="w-4 h-4" />
            <span>Failed</span>
          </div>
        );
      default:
        return children;
    }
  };

  const getButtonStyles = () => {
    const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center";
    
    switch (state) {
      case 'pending':
        return `${baseStyles} bg-blue-500 text-white cursor-wait`;
      case 'success':
        return `${baseStyles} bg-green-500 text-white`;
      case 'error':
        return `${baseStyles} bg-red-500 text-white`;
      default:
        return `${baseStyles} bg-blue-600 hover:bg-blue-700 text-white ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;
    }
  };

  return (
    <div className="relative">
      <motion.button
        onClick={handleClick}
        disabled={disabled || state === 'pending'}
        className={`${getButtonStyles()} ${className}`}
        whileHover={state === 'idle' ? { scale: 1.05 } : {}}
        whileTap={state === 'idle' ? { scale: 0.95 } : {}}
        {...props}
      >
        {getButtonContent()}
      </motion.button>

      {/* Error Tooltip */}
      <AnimatePresence>
        {state === 'error' && error && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute top-full left-0 mt-2 p-3 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg shadow-lg z-10 min-w-max"
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const OptimisticList = ({ 
  items = [],
  onAdd,
  onUpdate,
  onDelete,
  renderItem,
  className = '' 
}) => {
  const [optimisticItems, setOptimisticItems] = useState(items);
  const [pendingOperations, setPendingOperations] = useState(new Set());

  const handleAdd = useCallback(async (newItem) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticItem = { ...newItem, id: tempId, _optimistic: true };
    
    // Optimistically add item
    setOptimisticItems(prev => [...prev, optimisticItem]);
    setPendingOperations(prev => new Set([...prev, tempId]));

    try {
      const result = await onAdd(newItem);
      
      // Replace optimistic item with real item
      setOptimisticItems(prev => 
        prev.map(item => 
          item.id === tempId ? { ...result, _optimistic: false } : item
        )
      );
    } catch (error) {
      // Remove optimistic item on error
      setOptimisticItems(prev => prev.filter(item => item.id !== tempId));
    } finally {
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });
    }
  }, [onAdd]);

  const handleUpdate = useCallback(async (id, updates) => {
    const originalItem = optimisticItems.find(item => item.id === id);
    if (!originalItem) return;

    // Optimistically update item
    setOptimisticItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, ...updates, _optimistic: true } : item
      )
    );
    setPendingOperations(prev => new Set([...prev, id]));

    try {
      const result = await onUpdate(id, updates);
      
      // Replace with real updated item
      setOptimisticItems(prev => 
        prev.map(item => 
          item.id === id ? { ...result, _optimistic: false } : item
        )
      );
    } catch (error) {
      // Revert to original item on error
      setOptimisticItems(prev => 
        prev.map(item => 
          item.id === id ? originalItem : item
        )
      );
    } finally {
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [onUpdate, optimisticItems]);

  const handleDelete = useCallback(async (id) => {
    const originalItem = optimisticItems.find(item => item.id === id);
    if (!originalItem) return;

    // Optimistically remove item
    setOptimisticItems(prev => prev.filter(item => item.id !== id));
    setPendingOperations(prev => new Set([...prev, id]));

    try {
      await onDelete(id);
    } catch (error) {
      // Restore item on error
      setOptimisticItems(prev => [...prev, originalItem]);
    } finally {
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [onDelete, optimisticItems]);

  return (
    <div className={className}>
      {optimisticItems.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
          className={`relative ${item._optimistic ? 'opacity-70' : ''}`}
        >
          {renderItem(item, {
            isPending: pendingOperations.has(item.id),
            isOptimistic: item._optimistic,
            onUpdate: (updates) => handleUpdate(item.id, updates),
            onDelete: () => handleDelete(item.id),
          })}
          
          {/* Pending Indicator */}
          {pendingOperations.has(item.id) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Clock className="w-3 h-3 text-white" />
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

const ConnectionStatus = ({ isOnline, className = '' }) => {
  return (
    <motion.div
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
        isOnline 
          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
      } ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      {isOnline ? (
        <Wifi className="w-4 h-4" />
      ) : (
        <WifiOff className="w-4 h-4" />
      )}
      <span className="text-sm font-medium">
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </motion.div>
  );
};

const OptimisticUI = {
  Button: OptimisticButton,
  List: OptimisticList,
  ConnectionStatus,
};

export default OptimisticUI;
