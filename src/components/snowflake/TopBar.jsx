import React, { useState, useRef, useEffect } from 'react';
import { Database, Download, Play, Loader2, CheckCircle2, AlertCircle, ChevronDown, Table2 } from 'lucide-react';

export default function TopBar({
  tableMeta,
  healthLoading,
  health,
  running,
  exporting,
  savingTable,
  canRunQuery,
  canExportResults,
  canSaveTable,
  onRunQuery,
  onExportResults,
  onSaveTable,
  user
}) {
  const isConnected = health?.success;
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="sticky top-0 z-30 flex h-16 items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-50 leading-tight">
              Snowflake Explorer
            </h1>
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 leading-tight">
              {tableMeta?.fullyQualifiedName || 'Loading schema...'}
            </p>
          </div>
        </div>
        
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
        
        {healthLoading ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-xs font-medium">
            <Loader2 className="w-3 h-3 animate-spin" />
            Connecting...
          </span>
        ) : isConnected ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800/50">
            <CheckCircle2 className="w-3 h-3" />
            Connected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs font-medium border border-red-200 dark:border-red-800/50">
            <AlertCircle className="w-3 h-3" />
            Error
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={exportRef}>
          <button
            type="button"
            onClick={() => setExportOpen(!exportOpen)}
            disabled={!canExportResults}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          
          {exportOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1 z-50">
              <button
                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => {
                  setExportOpen(false);
                  onExportResults({ scope: 'page' });
                }}
              >
                Export current page
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => {
                  setExportOpen(false);
                  onExportResults({ scope: 'full' });
                }}
              >
                Export full dataset
              </button>
            </div>
          )}
        </div>
        
        {canSaveTable && (
          <button
            type="button"
            onClick={onSaveTable}
            disabled={!!savingTable}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {savingTable ? <Loader2 className="w-4 h-4 animate-spin" /> : <Table2 className="w-4 h-4" />}
            Save Table
          </button>
        )}

        <button
          type="button"
          onClick={onRunQuery}
          disabled={!canRunQuery || running}
          className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Run Query
        </button>
        
        {user?.avatar ? (
          <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full ml-2 border border-slate-200 dark:border-slate-700" />
        ) : (
          <div className="w-8 h-8 rounded-full ml-2 bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
