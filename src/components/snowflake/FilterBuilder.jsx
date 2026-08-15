import React from 'react';
import { Filter, Code2, Plus, X, Phone, Trash2, Zap, LayoutDashboard } from 'lucide-react';

const FILTER_OPS = [
  { id: 'eq', label: 'equals' },
  { id: 'ne', label: 'not equals' },
  { id: 'contains', label: 'contains' },
  { id: 'starts', label: 'starts with' },
  { id: 'ends', label: 'ends with' },
  { id: 'gt', label: '>' },
  { id: 'gte', label: '>=' },
  { id: 'lt', label: '<' },
  { id: 'lte', label: '<=' }
];

const PHONE_COUNTRY_OPTIONS = [
  { id: 'IN', label: 'India (+91)', value: '+91' },
  { id: 'US', label: 'US (+1)', value: '+1' },
  { id: 'UK', label: 'UK (+44)', value: '+44' }
];

export default function FilterBuilder({
  mode,
  setMode,
  logic,
  setLogic,
  filters,
  addFilterRow,
  removeFilterRow,
  handleFilterColumnChange,
  updateFilterRow,
  handlePhonePresetChange,
  getPhonePresetId,
  normalizePhoneCode,
  fieldNames,
  columns,
  sql,
  setSql,
  setPage,
  queryPreview,
  activeFilterSummary,
  totalCount,
  fromSimulator,
  onRunQuery,
  /** Optional: hide mode toggle (used by AI enrichment viewer). */
  disableModeToggle = false
}) {
  return (
    <div className="w-full flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-4 gap-6">
      {/* Mode Toggle */}
      {!disableModeToggle && (
        <div className="shrink-0 flex p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg">
          <button
            type="button"
            onClick={() => { setMode('filter'); setPage(1); }}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${
              mode === 'filter'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Structured
          </button>
          <button
            type="button"
            onClick={() => { setMode('sql'); setPage(1); }}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${
              mode === 'sql'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            SQL
          </button>
        </div>
      )}

      {/* Summary Panel */}
      <div className="shrink-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
          <LayoutDashboard className="w-3.5 h-3.5" />
          Query Summary
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Rows</p>
            <p className="text-lg font-mono font-semibold text-slate-900 dark:text-slate-50">
              {totalCount != null ? totalCount.toLocaleString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Active Filters</p>
            <p className="text-lg font-mono font-semibold text-slate-900 dark:text-slate-50">
              {activeFilterSummary.length}
            </p>
          </div>
          <div className="col-span-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" /> Estimated Cost: <span className="font-mono text-slate-900 dark:text-slate-300">$0.002</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      {mode === 'filter' ? (
        <div className="min-h-0 flex-[2] space-y-4 overflow-y-auto overscroll-contain">
          <div className="flex items-center justify-between">
            <div className="inline-flex bg-slate-200/50 dark:bg-slate-800/50 rounded-md p-0.5">
              {['AND', 'OR'].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setLogic(value); setPage(1); }}
                  className={`px-3 py-1 text-[11px] font-bold rounded-sm transition-colors ${
                    logic === value
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={addFilterRow}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Filter
            </button>
          </div>

          <div className="space-y-3">
            {filters.map((filter, index) => {
              const isPhone = String(filter.column || '').toUpperCase() === 'PHONE';
              const phonePresetId = getPhonePresetId(filter.value);
              return (
                <div
                  key={filter.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm relative group transition-all duration-150 hover:border-indigo-300 dark:hover:border-indigo-700/50"
                >
                  <button
                    type="button"
                    onClick={() => removeFilterRow(filter.id)}
                    className="absolute -top-2 -right-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 text-slate-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800/50 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  <div className="space-y-2.5">
                    <select
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      value={filter.column}
                      onChange={(e) => handleFilterColumnChange(filter.id, e.target.value)}
                    >
                      {fieldNames.length === 0 && <option value="">No columns</option>}
                      {columns.map((column) => (
                        <option key={column.name} value={column.name}>
                          {column.name}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-2">
                      <select
                        className="w-1/3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        value={filter.op}
                        onChange={(e) => updateFilterRow(filter.id, { op: e.target.value })}
                      >
                        {FILTER_OPS.map((op) => (
                          <option key={op.id} value={op.id}>{op.label}</option>
                        ))}
                      </select>

                      <div className="w-2/3">
                        {isPhone ? (
                          <div className="flex gap-1.5">
                            <select
                              className="w-1/2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                              value={phonePresetId}
                              onChange={(e) => handlePhonePresetChange(filter.id, e.target.value)}
                            >
                              <option value="">Code</option>
                              {PHONE_COUNTRY_OPTIONS.map((option) => (
                                <option key={option.id} value={option.id}>{option.id}</option>
                              ))}
                              <option value="CUSTOM">Custom</option>
                            </select>
                            <input
                              type="text"
                              className="w-1/2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono"
                              value={filter.value}
                              onChange={(e) => updateFilterRow(filter.id, { op: 'starts', value: normalizePhoneCode(e.target.value) })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  onRunQuery();
                                } else if (e.key === 'Escape') {
                                  updateFilterRow(filter.id, { value: '' });
                                }
                              }}
                              placeholder="+91"
                            />
                          </div>
                        ) : (
                          <input
                            type="text"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono"
                            value={filter.value}
                            onChange={(e) => updateFilterRow(filter.id, { value: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                onRunQuery();
                              } else if (e.key === 'Escape') {
                                updateFilterRow(filter.id, { value: '' });
                              }
                            }}
                            placeholder="Value..."
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Filters */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Quick Filters</h4>
            <div className="flex flex-wrap gap-1.5">
              <button className="px-2 py-1 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
                Language = EN
              </button>
              <button className="px-2 py-1 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
                Created &gt; 7d
              </button>
              <button className="px-2 py-1 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
                Phone = US
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-[2] flex-col gap-2 overflow-hidden">
          <label className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            SQL Query
          </label>
          <textarea
            className="min-h-0 flex-1 w-full resize-none overflow-auto bg-slate-900 text-slate-50 dark:bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono focus:ring-2 focus:ring-indigo-500/50 outline-none"
            value={sql}
            onChange={(e) => { setSql(e.target.value); setPage(1); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onRunQuery();
              } else if (e.key === 'Escape') {
                setSql('');
              }
            }}
            placeholder="SELECT * FROM..."
          />
          <p className="shrink-0 text-[10px] text-slate-500">Press <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">⌘/Ctrl + Enter</kbd> to run</p>
        </div>
      )}

      {/* SQL Preview — own scroll region; parent shell uses overflow-hidden */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
        <h4 className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Generated SQL
        </h4>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto overscroll-contain rounded-xl border border-slate-800 bg-slate-900 p-3 dark:bg-slate-950">
          <pre className="text-[10px] font-mono text-slate-300 whitespace-pre-wrap break-words">
            {queryPreview}
          </pre>
        </div>
      </div>
      </div>
    </div>
  );
}
