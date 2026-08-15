import React from 'react'
import { clsx } from 'clsx'
import { InputProps } from '@/types/ui'

const Input: React.FC<InputProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  label,
  helperText,
  variant = 'default',
  type = 'text',
  className,
}) => {
  const baseClasses = 'w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    default: 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100',
    error: 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600',
    success: 'border-green-300 focus:border-green-500 focus:ring-green-500 dark:border-green-600',
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          className
        )}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{helperText}</p>
      )}
    </div>
  )
}

export default Input
