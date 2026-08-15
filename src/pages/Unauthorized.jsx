import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Unauthorized Page
 * 
 * Displays when a user tries to access a page they don't have permission for.
 * Provides a link back to the dashboard or home page.
 */
function Unauthorized() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center px-4">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            🚫 Access Denied
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-1">
            You don't have permission to view this page.
          </p>
          {user && (
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
              Current role: <span className="font-semibold">{user.role || 'user'}</span>
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            If you believe this is an error, please contact your administrator.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Unauthorized;

