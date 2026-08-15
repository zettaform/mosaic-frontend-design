import React, { createContext, useContext, useCallback } from 'react'
import { Toaster, toast as hotToast } from 'react-hot-toast'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  duration?: number
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  icon?: string
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, options?: ToastOptions) => string
  success: (message: string, options?: ToastOptions) => string
  error: (message: string, options?: ToastOptions) => string
  warning: (message: string, options?: ToastOptions) => string
  info: (message: string, options?: ToastOptions) => string
  dismiss: (toastId: string) => void
  dismissAll: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const toast = useCallback(
    (message: string, type: ToastType = 'info', options?: ToastOptions) => {
      const toastOptions = {
        duration: options?.duration || 4000,
        position: options?.position || 'top-right',
        ...(options?.icon && { icon: options.icon }),
        ...options,
      }

      switch (type) {
        case 'success':
          return hotToast.success(message, toastOptions)
        case 'error':
          return hotToast.error(message, toastOptions)
        case 'warning':
          return hotToast(message, {
            ...toastOptions,
            icon: '⚠️',
            style: {
              background: '#f59e0b',
              color: '#fff',
            },
          })
        case 'info':
        default:
          return hotToast(message, toastOptions)
      }
    },
    []
  )

  const success = useCallback(
    (message: string, options?: ToastOptions) => toast(message, 'success', options),
    [toast]
  )

  const error = useCallback(
    (message: string, options?: ToastOptions) => toast(message, 'error', options),
    [toast]
  )

  const warning = useCallback(
    (message: string, options?: ToastOptions) => toast(message, 'warning', options),
    [toast]
  )

  const info = useCallback(
    (message: string, options?: ToastOptions) => toast(message, 'info', options),
    [toast]
  )

  const dismiss = useCallback((toastId: string) => {
    hotToast.dismiss(toastId)
  }, [])

  const dismissAll = useCallback(() => {
    hotToast.dismiss()
  }, [])

  const value = {
    toast,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            border: '1px solid var(--toast-border)',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </ToastContext.Provider>
  )
}
