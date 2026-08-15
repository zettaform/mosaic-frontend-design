import React from 'react';
import { X } from 'lucide-react';

/**
 * Session Modal Component
 * Placeholder for session creation modal
 * 
 * @param {Object} props
 * @param {Object} props.modals - Modals controller
 */
export default function SessionModal({ modals }) {
  const {
    showSessionModal,
    setShowSessionModal
  } = modals;

  if (!showSessionModal) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-6"
      onClick={() => setShowSessionModal(false)}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Create Session
          </h2>
          <button
            onClick={() => setShowSessionModal(false)}
            className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-400">
            Session creation functionality will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
}

