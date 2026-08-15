import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import { useToast } from '../../contexts/ToastContext';
import backendAuthService from '../../services/backendAuthService';

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_URL || '').trim();
}

export default function DurableSendgridRuns() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const { error } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState([]);
  const [selected, setSelected] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [status, setStatus] = useState(null);

  // Auth + RBAC
  if (authLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="sidebar-shell-main-noscroll">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center justify-center h-full">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  const routeInfo = ROUTE_TO_SECTION[currentPath];
  if (routeInfo) {
    const { section, page } = routeInfo;
    if (!hasAccess(user, section, page)) {
      return <Navigate to="/unauthorized" replace />;
    }
  } else {
    return <Navigate to="/unauthorized" replace />;
  }

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const base = getApiBaseUrl();
      const token = backendAuthService.getSessionToken();
      if (!token) throw new Error('Not authenticated');
      const resp = await fetch(`${base}/api/admin/sendgrid/durable/runs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok || !json?.success) {
        const baseMsg = json?.error || `Failed (HTTP ${resp.status})`;
        const detailsMsg = json?.details?.message || json?.details?.error || '';
        throw new Error(detailsMsg ? `${baseMsg}: ${detailsMsg}` : baseMsg);
      }
      setRuns(Array.isArray(json.runs) ? json.runs : []);
    } catch (e) {
      console.error(e);
      error(e.message || 'Failed to load runs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async (run) => {
    if (!run?.instance_id) return;
    setStatusLoading(true);
    setStatus(null);
    try {
      const base = getApiBaseUrl();
      const token = backendAuthService.getSessionToken();
      if (!token) throw new Error('Not authenticated');
      const resp = await fetch(`${base}/api/admin/sendgrid/durable/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ instance_id: run.instance_id })
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok || !json?.success) {
        const baseMsg = json?.error || `Failed (HTTP ${resp.status})`;
        const detailsMsg = json?.details?.message || json?.details?.error || '';
        throw new Error(detailsMsg ? `${baseMsg}: ${detailsMsg}` : baseMsg);
      }
      setStatus(json.status);
    } catch (e) {
      console.error(e);
      error(e.message || 'Failed to fetch status');
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => runs || [], [runs]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">Durable SendGrid Runs</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Shows durable-sendgrid instances that were started from this app (saved locally on the backend).
                </p>
              </div>
              <button
                type="button"
                onClick={fetchRuns}
                disabled={loading}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-sm font-medium"
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                {loading ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">Loading…</div>
                ) : rows.length === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">No runs yet. Start one from Durable SendGrid.</div>
                ) : (
                  <div className="space-y-3">
                    {rows.map((r) => (
                      <button
                        type="button"
                        key={r.instance_id}
                        onClick={() => {
                          setSelected(r);
                          setStatus(null);
                        }}
                        className={`w-full text-left rounded-lg border px-3 py-2 ${
                          selected?.instance_id === r.instance_id
                            ? 'border-indigo-400 bg-indigo-50 dark:bg-slate-900'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <div className="text-xs text-slate-500 dark:text-slate-400">{r.created_at || '—'}</div>
                        <div className="text-sm font-mono text-slate-800 dark:text-slate-100 break-all">{r.instance_id}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {r.file_name ? <span className="font-medium">File:</span> : null} {r.file_name || ''}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                {!selected ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">Select a run to view its status link.</div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Selected</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Instance</div>
                    <div className="text-sm font-mono break-all text-slate-800 dark:text-slate-100">{selected.instance_id}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Status</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Status is fetched via the server (the Azure durable status URL contains a secret `code=...` token and is not shown in the browser).
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fetchStatus(selected)}
                        disabled={statusLoading}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 text-sm font-medium"
                      >
                        {statusLoading ? 'Fetching…' : 'Fetch status'}
                      </button>
                      {status?.runtimeStatus ? (
                        <div className="text-sm text-slate-600 dark:text-slate-300">Runtime: {status.runtimeStatus}</div>
                      ) : null}
                    </div>

                    {status ? (
                      <pre className="mt-2 max-h-[55vh] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-[11px] text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                        {JSON.stringify(status, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


