import React from 'react'
import { clsx } from 'clsx'
import { SkeletonProps } from '@/types/ui'

const Skeleton: React.FC<SkeletonProps> = ({
  className,
  lines = 1,
  height = '1rem',
  width = '100%',
  rounded = true,
}) => {
  const baseClasses = 'animate-pulse bg-slate-200 dark:bg-slate-700'
  
  if (lines === 1) {
    return (
      <div
        className={clsx(
          baseClasses,
          rounded && 'rounded',
          className
        )}
        style={{ height, width }}
      />
    )
  }

  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={clsx(
            baseClasses,
            rounded && 'rounded',
            index === lines - 1 ? 'w-3/4' : 'w-full'
          )}
          style={{ height }}
        />
      ))}
    </div>
  )
}

export default Skeleton
