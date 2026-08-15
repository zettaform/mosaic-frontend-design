import React from 'react'
import { clsx } from 'clsx'
import { ButtonProps } from '@/types/ui'

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  onClick,
  type = 'button',
  className,
  title,
  children,
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-slate-900'
  
  const variantClasses = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 shadow-sm',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 focus:ring-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100',
    outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700 focus:ring-slate-500 dark:border-slate-600 dark:hover:bg-slate-800 dark:text-slate-300',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:focus:ring-slate-500',
    destructive: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm',
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      )}
      {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
      {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  )
}

export default Button
