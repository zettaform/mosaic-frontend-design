import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import backendAuthService from '../../services/backendAuthService';
import { getApiUrl } from '../../utils/getBackendUrl';
import toast from 'react-hot-toast';
import {
  Copy,
  Download,
  FileSpreadsheet,
  History,
  Loader2,
  RefreshCw,
  Search
} from 'lucide-react';

function formatBytes(bytes) {
  const size = Number(bytes || 0);
  if (!size) return '—';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatFilterSummary(item) {
  if (!Array.isArray(item?.filters) || item.filters.length === 0) {
    return item?.mode === 'sql' ? 'SQL export' : 'No structured filters';
  }
  return item.filters
    .map((filter) => `${filter.column} ${filter.op} ${filter.value}`)
    .join(` ${item.logic || 'AND'} `);
}

function normalizeStatus(status) {
  const raw = String(status || '').toLowerCase();
  if (raw === 'completed') return 'completed';
  if (raw === 'failed') return 'failed';
  if (raw === 'running') return 'running';
  return 'queued';
}

export default function SnowflakeExports() {
  const { user } = useAuth();
  const location = useLocation();
  const routeInfo = ROUTE_TO_SECTION[location.pathname];
  const allowed = user && routeInfo && hasAccess(user, routeInfo.section, routeInfo.page);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState(null);
  const [exportsList, setExportsList] = useState([]);
  const [search, setSearch] = useState('');

  const authHeaders = useCallback(() => {
    const token = backendAuthService.getSessionToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);

  const loadExports = useCallback(async (options = {}) => {
    const silent = options?.silent === true;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl('/snowflake/exports?limit=100'), {
        credentials: 'include',
        headers: authHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || res.statusText);
      setExportsList(Array.isArray(data.exports) ? data.exports : []);
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (!user || !allowed) return;
    loadExports();
  }, [allowed, loadExports, user]);

  const hasActiveExports = useMemo(
    () => exportsList.some((item) => ['queued', 'running'].includes(normalizeStatus(item.status))),
    [exportsList]
  );

  useEffect(() => {
    if (!hasActiveExports) return undefined;
    const intervalId = window.setInterval(() => {
      void loadExports({ silent: true });
    }, 15000);
    return () => window.clearInterval(intervalId);
  }, [hasActiveExports, loadExports]);

  const downloadExport = useCallback(
    async (record) => {
      setDownloadingId(record.exportId);
      try {
        const status = normalizeStatus(record.status);
        if (status !== 'completed') {
          throw new Error('Export is still processing. Please refresh in a few moments.');
        }
        if (record.directDownloadUrl) {
          window.open(record.directDownloadUrl, '_blank', 'noopener,noreferrer');
          return;
        }
        const res = await fetch(getApiUrl(record.downloadPath || `/snowflake/exports/${record.exportId}/download`), {
          credentials: 'include',
          headers: authHeaders()
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || data.message || res.statusText);
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = record.filename || 'snowflake-export.xlsx';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(url);
      } catch (e) {
        setError(e.message);
        toast.error(e.message);
      } finally {
        setDownloadingId(null);
      }
    },
    [authHeaders]
  );

  const copyExportId = useCallback(async (exportId) => {
    try {
      await navigator.clipboard.writeText(exportId);
      toast.success('Export ID copied');
    } catch (e) {
      toast.error(e.message || 'Failed to copy export ID');
    }
  }, []);

  const filteredExports = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return exportsList;
    return exportsList.filter((item) => {
      const haystack = [
        item.exportId,
        item.filename,
        item.createdBy,
        item.table,
        item.mode,
        formatFilterSummary(item)
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [exportsList, search]);

  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  if (!allowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-[1600px] mx-auto">
            <header className="mb-6 flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                  Data warehouse
                </p>
                <h1 className="text-2xl md:text-3xl text-slate-900 dark:text-slate-50 font-bold flex items-center gap-2">
                  <History className="w-8 h-8 text-indigo-500 shrink-0" />
                  Snowflake export history
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm max-w-3xl">
                  Every generated workbook is stored in Azure Blob Storage and remains available here for download.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadExports()}
                className="btn border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center gap-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh exports
              </button>
            </header>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  {exportsList.length.toLocaleString()} stored exports
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search exports…"
                    className="form-input w-full pl-8 text-sm dark:bg-slate-950 dark:border-slate-700"
                  />
                </div>
              </div>

              {error ? (
                <div className="mx-4 mt-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 text-sm px-4 py-3">
                  {error}
                </div>
              ) : null}

              {loading ? (
                <div className="p-8 text-sm text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading export history…
                </div>
              ) : filteredExports.length === 0 ? (
                <div className="p-8 text-sm text-slate-500">No exports found for the current search.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Created</th>
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Workbook</th>
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Status</th>
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Rows</th>
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Size</th>
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Mode</th>
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Filters / query</th>
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredExports.map((item) => (
                        <tr key={item.exportId} className="text-slate-800 dark:text-slate-200 align-top">
                          <td className="px-4 py-3 whitespace-nowrap">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
                          </td>
                          <td className="px-4 py-3 min-w-[280px]">
                            <div className="font-medium break-all">{item.filename || 'snowflake-export.xlsx'}</div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 break-all">
                              {item.exportId}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {(() => {
                              const status = normalizeStatus(item.status);
                              if (status === 'completed') {
                                return (
                                  <span className="inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/30 dark:text-emerald-300">
                                    Completed
                                  </span>
                                );
                              }
                              if (status === 'failed') {
                                return (
                                  <span className="inline-flex rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-900/30 dark:text-red-300">
                                    Failed
                                  </span>
                                );
                              }
                              return (
                                <div className="flex flex-col gap-1">
                                  <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/30 dark:text-amber-300">
                                    {status === 'running' ? 'Running' : 'Queued'}
                                  </span>
                                  {typeof item.progressPercent === 'number' ? (
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                      {Math.max(0, Math.min(100, Math.round(item.progressPercent)))}%
                                    </span>
                                  ) : null}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                            {typeof item.rowCount === 'number' ? item.rowCount.toLocaleString() : '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{formatBytes(item.sizeBytes)}</td>
                          <td className="px-4 py-3 whitespace-nowrap uppercase text-xs font-semibold tracking-wide">
                            {item.mode || '—'}
                          </td>
                          <td className="px-4 py-3 min-w-[320px]">
                            <div className="text-sm">{formatFilterSummary(item)}</div>
                            {item.queryPreview ? (
                              <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-3 text-xs font-mono text-slate-600 dark:text-slate-300">
                                {item.queryPreview}
                              </pre>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void downloadExport(item)}
                                disabled={normalizeStatus(item.status) !== 'completed'}
                                className="btn border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2 text-sm"
                              >
                                {downloadingId === item.exportId ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                                Download
                              </button>
                              <button
                                type="button"
                                onClick={() => void copyExportId(item.exportId)}
                                className="btn border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2 text-sm"
                              >
                                <Copy className="w-4 h-4" />
                                Copy ID
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
