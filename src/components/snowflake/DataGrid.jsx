import React, { useState, useRef, useEffect } from 'react';
import { Search, Columns, ChevronLeft, ChevronRight, X, Inbox } from 'lucide-react';
import SnowflakeTabulatorGrid from './SnowflakeTabulatorGrid';

export default function DataGrid({
  rows,
  gridFields,
  fieldNames,
  schemaLoading,
  running,
  fromSimulator,
  sortColumn,
  sortDirection,
  handleColumnSort,
  page,
  pageSize,
  setPage,
  setPageSize,
  totalCount,
  activeFilterSummary,
  removeFilterSummary // Optional: if we want to allow removing from chips
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(new Set(gridFields.length ? gridFields : fieldNames));
  const columnsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (columnsRef.current && !columnsRef.current.contains(event.target)) {
        setColumnsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update visible columns when fieldNames change
  useEffect(() => {
    setVisibleColumns(new Set(gridFields.length ? gridFields : fieldNames));
  }, [fieldNames, gridFields]);

  const toggleColumn = (col) => {
    const next = new Set(visibleColumns);
    if (next.has(col)) {
      next.delete(col);
    } else {
      next.add(col);
    }
    setVisibleColumns(next);
  };

  const totalPages = totalCount != null && pageSize > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : null;

  const hasData = gridFields.length > 0 || rows.length > 0;

  const filteredRows = React.useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const lower = searchTerm.toLowerCase();
    return rows.filter(row => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(lower)
      )
    );
  }, [rows, searchTerm]);

  const activeFields = (gridFields.length ? gridFields : fieldNames).filter(f => visibleColumns.has(f));

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search in results..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          
          <div className="relative" ref={columnsRef}>
            <button 
              onClick={() => setColumnsOpen(!columnsOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Columns className="w-4 h-4" />
              Columns
            </button>

            {columnsOpen && (
              <div className="absolute left-0 mt-2 w-56 max-h-64 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-2 z-50">
                <div className="px-3 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Visible Columns</span>
                  <button 
                    onClick={() => setVisibleColumns(new Set(gridFields.length ? gridFields : fieldNames))}
                    className="text-[10px] text-indigo-600 hover:text-indigo-700"
                  >
                    Reset
                  </button>
                </div>
                {(gridFields.length ? gridFields : fieldNames).map(col => (
                  <label key={col} className="flex items-center px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={visibleColumns.has(col)}
                      onChange={() => toggleColumn(col)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="ml-2 text-sm text-slate-700 dark:text-slate-300 truncate">{col}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {sortColumn && (
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
              Sort: {sortColumn} {sortDirection.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            disabled={fromSimulator}
            className="text-sm bg-transparent border-none text-slate-600 dark:text-slate-300 focus:ring-0 cursor-pointer font-medium"
          >
            {[25, 50, 100, 200, 500].map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || running || fromSimulator}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300 min-w-[3rem] text-center">
              {page} {totalPages ? `/ ${totalPages}` : ''}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={fromSimulator || running || (totalCount != null ? page * pageSize >= totalCount : rows.length < pageSize)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Chips */}
      {activeFilterSummary.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/50 overflow-x-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Active:</span>
          {activeFilterSummary.map((summary, index) => (
            <span
              key={`${summary}-${index}`}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-medium border border-indigo-100 dark:border-indigo-800/50 whitespace-nowrap"
            >
              {summary}
              {/* Optional: Add X button to remove filter */}
            </span>
          ))}
        </div>
      )}

      {/* Grid Area */}
      <div className="flex-1 overflow-hidden relative">
        {hasData ? (
          <div className="h-full w-full [&_.tabulator]:border-none [&_.tabulator]:bg-transparent [&_.tabulator-header]:bg-slate-50 [&_.tabulator-header]:dark:bg-slate-900 [&_.tabulator-header]:border-b [&_.tabulator-header]:border-slate-200 [&_.tabulator-header]:dark:border-slate-800 [&_.tabulator-row]:border-b [&_.tabulator-row]:border-slate-100 [&_.tabulator-row]:dark:border-slate-800/50 [&_.tabulator-row.tabulator-row-even]:bg-slate-50/30 [&_.tabulator-row.tabulator-row-even]:dark:bg-slate-800/10 [&_.tabulator-row:hover]:bg-indigo-50/50 [&_.tabulator-row:hover]:dark:bg-indigo-900/20 [&_.tabulator-cell]:font-mono [&_.tabulator-cell]:text-sm [&_.tabulator-cell]:text-slate-700 [&_.tabulator-cell]:dark:text-slate-300">
            <SnowflakeTabulatorGrid
              rows={filteredRows}
              fields={activeFields}
              emptyMessage="No rows — run a query or use the simulator."
              serverSideSort={!fromSimulator}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onColumnSort={handleColumnSort}
              loading={running && !fromSimulator}
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">
              {schemaLoading ? 'Preparing workspace...' : 'No data to display'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              {schemaLoading 
                ? 'Loading schema and metadata...' 
                : 'Run a query or add filters to explore your data. You can also use the simulator to load sample data.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
