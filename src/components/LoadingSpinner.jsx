import React from 'react';

/**
 * Simple animated spinner used across the admin panel.
 * @param {object} props
 * @param {string} props.size Tailwind width/height classes (e.g., "w-4 h-4").
 */
export default function LoadingSpinner({ size = 'w-4 h-4' }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-slate-300 dark:border-gray-300 border-t-indigo-500 dark:border-t-indigo-400 ${size}`}
    ></div>
  );
}
