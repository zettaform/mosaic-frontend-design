import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { canAccessTablesSavedHub, isPlatformAdmin } from '../../config/rbac';
import backendAuthService from '../../services/backendAuthService';
import { getApiUrl } from '../../utils/getBackendUrl';
import toast from 'react-hot-toast';
import { AlertTriangle, Eye, Loader2, RefreshCw, Table2, Trash2 } from 'lucide-react';

async function parseJsonSafe(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: `Unexpected non-JSON response (HTTP ${response.status})` };
  }
}

function formatCreatedAt(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString();
  } catch {
    return String(iso);
  }
}

export default function SavedTables() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const allowed = user && canAccessTablesSavedHub(user);
  const isAdmin = user && isPlatformAdmin(user);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [viewModalRow, setViewModalRow] = useState(null);
  const [filterUserId, setFilterUserId] = useState('');
  const [filterTenantId, setFilterTenantId] = useState('');
  const [owners, setOwners] = useState([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [sortBy, setSortBy] = useState('created_desc');
  const [deleteBusyKey, setDeleteBusyKey] = useState(null);
  const [purgeBusy, setPurgeBusy] = useState(false);
  const [sessionTenantId, setSessionTenantId] = useState(null);

  const authHeaders = useCallback(() => {
    const token = backendAuthService.getSessionToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);

  const loadOwners = useCallback(async () => {
    if (!isAdmin) return;
    setOwnersLoading(true);
    try {
      const res = await fetch(getApiUrl('/snowflake/saved-tables/owners'), {
        credentials: 'include',
        headers: authHeaders()
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || res.statusText);
      setOwners(Array.isArray(data.owners) ? data.owners : []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setOwnersLoading(false);
    }
  }, [authHeaders, isAdmin]);

  const loadTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (isAdmin && filterUserId) qs.set('userId', filterUserId);
      if (isAdmin && filterTenantId) qs.set('tenantId', filterTenantId);
      const url = `${getApiUrl('/snowflake/saved-tables')}${qs.toString() ? `?${qs}` : ''}`;
      const res = await fetch(url, {
        credentials: 'include',
        headers: authHeaders()
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || res.statusText);
      setRows(Array.isArray(data.tables) ? data.tables : []);
      if (data.tenantId != null) setSessionTenantId(String(data.tenantId));
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, filterTenantId, filterUserId, isAdmin]);

  useEffect(() => {
    if (!user || !allowed) return;
    if (isAdmin) loadOwners();
  }, [allowed, isAdmin, loadOwners, user]);

  useEffect(() => {
    if (!user || !allowed) return;
    loadTables();
  }, [allowed, loadTables, user]);

  const getViewHref = useCallback((row) => {
    const db = String(row?.database_name ?? '');
    const schema = String(row?.schema_name ?? '');
    const table = String(row?.table_name ?? '');
    const params = new URLSearchParams({ db, schema, table });
    return `/snowflake-query?${params.toString()}`;
  }, []);

  const getAiHref = useCallback((row) => {
    const db = String(row?.database_name ?? '');
    const schema = String(row?.schema_name ?? '');
    const table = String(row?.table_name ?? '');
    const tableId = `${db}|${schema}|${table}`;
    return `/ai-table/${encodeURIComponent(tableId)}`;
  }, []);

  const closeModal = useCallback(() => setViewModalRow(null), []);

  const openStandard = useCallback(() => {
    if (!viewModalRow) return;
    const href = getViewHref(viewModalRow);
    closeModal();
    navigate(href);
  }, [closeModal, getViewHref, navigate, viewModalRow]);

  const openAi = useCallback(() => {
    if (!viewModalRow) return;
    const href = getAiHref(viewModalRow);
    closeModal();
    navigate(href);
  }, [closeModal, getAiHref, navigate, viewModalRow]);

  const ownerLabel = useCallback((row) => {
    if (row?.user_email) return String(row.user_email);
    if (row?.user_id) return String(row.user_id);
    if (row?.partition_key === 'tables') return 'Legacy (unassigned)';
    return '—';
  }, []);

  const tenantOptions = useMemo(() => {
    const s = new Set();
    rows.forEach((r) => {
      const t = String(r.tenant_id ?? '').trim();
      s.add(t || 'default');
    });
    return [...s].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [rows]);

  const colCount = isAdmin ? 8 : 7;

  const displayRows = useMemo(() => {
    const list = [...rows];
    if (sortBy === 'user_asc') {
      list.sort((a, b) =>
        ownerLabel(a).localeCompare(ownerLabel(b), undefined, { sensitivity: 'base' })
      );
    } else if (sortBy === 'created_asc') {
      list.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    } else {
      list.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    }
    return list;
  }, [ownerLabel, rows, sortBy]);

  const formatTenantCell = useCallback((row) => {
    const t = String(row?.tenant_id ?? '').trim();
    if (!t) return 'default (legacy)';
    return t;
  }, []);

  const purgeAllSaved = useCallback(async () => {
    if (!isAdmin) return;
    const scope = filterTenantId
      ? `Only organization “${filterTenantId}” will be affected. `
      : 'All organizations will be affected. ';
    if (
      !window.confirm(
        `${scope}Every matching saved table will be DROPped in Snowflake and its metadata row removed. This cannot be undone. Continue?`
      )
    ) {
      return;
    }
    const typed = window.prompt('Type PURGE_SAVED_TABLES to confirm.');
    if (typed !== 'PURGE_SAVED_TABLES') {
      if (typed != null) toast.error('Confirmation did not match.');
      return;
    }
    setPurgeBusy(true);
    try {
      const res = await fetch(getApiUrl('/snowflake/saved-tables/purge'), {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({
          confirm: 'PURGE_SAVED_TABLES',
          ...(filterTenantId ? { tenantId: filterTenantId } : {})
        })
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || res.statusText);
      toast.success(
        `Removed ${data.metadataRemoved} metadata row(s); Snowflake DROP succeeded for ${data.snowflakeTablesDropped} table(s).`
      );
      if (data.errors?.length) {
        toast.error(`${data.errors.length} row(s) failed — check server logs.`);
      }
      await loadTables();
      if (isAdmin) await loadOwners();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPurgeBusy(false);
    }
  }, [authHeaders, filterTenantId, isAdmin, loadOwners, loadTables]);

  const deleteRow = useCallback(
    async (row) => {
      const pk = String(row?.partition_key ?? '').trim();
      const rk = String(row?.rowKey ?? '').trim();
      if (!pk || !rk) {
        toast.error('Missing row identifiers');
        return;
      }
      const label = `${row.database_name}.${row.schema_name}.${row.table_name}`;
      if (!window.confirm(`Delete saved table "${label}" from Snowflake and remove its listing? This cannot be undone.`)) {
        return;
      }
      const busy = `${pk}:${rk}`;
      setDeleteBusyKey(busy);
      try {
        const res = await fetch(getApiUrl('/snowflake/saved-tables'), {
          method: 'DELETE',
          credentials: 'include',
          headers: authHeaders(),
          body: JSON.stringify({ partitionKey: pk, rowKey: rk })
        });
        const data = await parseJsonSafe(res);
        if (!res.ok) throw new Error(data.error || data.message || res.statusText);
        toast.success('Table removed from Snowflake and listing');
        await loadTables();
        if (isAdmin) await loadOwners();
      } catch (e) {
        toast.error(e.message);
      } finally {
        setDeleteBusyKey(null);
      }
    },
    [authHeaders, isAdmin, loadOwners, loadTables]
  );

  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  if (!allowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="sidebar-shell-main-noscroll">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
                  <Table2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Saved Tables</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {isAdmin
                      ? 'Admin view: filter by user and organization. Each delete runs DROP TABLE IF EXISTS in Snowflake, then removes the Azure metadata row.'
                      : `Your organization’s saved tables (tenant: ${sessionTenantId ?? '…'}). Delete runs DROP TABLE IF EXISTS in Snowflake, then removes the listing.`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 justify-end">
                {isAdmin && (
                  <>
                    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className="whitespace-nowrap">Organization</span>
                      <select
                        value={filterTenantId}
                        onChange={(e) => setFilterTenantId(e.target.value)}
                        className="text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1.5 min-w-[10rem]"
                      >
                        <option value="">All organizations</option>
                        {tenantOptions.map((t) => (
                          <option key={t} value={t}>
                            {t === 'default' ? 'default (incl. legacy)' : t}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className="whitespace-nowrap">User</span>
                      <select
                        value={filterUserId}
                        onChange={(e) => setFilterUserId(e.target.value)}
                        disabled={ownersLoading}
                        className="text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1.5 min-w-[12rem]"
                      >
                        <option value="">All users</option>
                        {owners.map((o) => (
                          <option key={o.partition_key} value={o.partition_key}>
                            {o.is_legacy ? o.label : o.email || o.label || o.user_id}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className="whitespace-nowrap">Sort</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1.5"
                      >
                        <option value="created_desc">Newest first</option>
                        <option value="created_asc">Oldest first</option>
                        <option value="user_asc">User (A–Z)</option>
                      </select>
                    </label>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    loadTables();
                    if (isAdmin) loadOwners();
                  }}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Refresh
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={purgeAllSaved}
                    disabled={purgeBusy || loading}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50"
                  >
                    {purgeBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                    Purge…
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 text-sm px-4 py-3">
                {error}
              </div>
            )}

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                      {isAdmin && <th className="px-4 py-3">User</th>}
                      <th className="px-4 py-3">Organization</th>
                      <th className="px-4 py-3">Table Name</th>
                      <th className="px-4 py-3">Database</th>
                      <th className="px-4 py-3">Schema</th>
                      <th className="px-4 py-3">Total Rows</th>
                      <th className="px-4 py-3">Created At</th>
                      <th className="px-4 py-3 min-w-[11rem]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading && (
                      <tr>
                        <td colSpan={colCount} className="px-4 py-12 text-center text-slate-500">
                          <Loader2 className="w-6 h-6 animate-spin inline-block mr-2 align-middle" />
                          Loading…
                        </td>
                      </tr>
                    )}
                    {!loading && rows.length === 0 && (
                      <tr>
                        <td colSpan={colCount} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                          No saved tables yet. Run a query on Snowflake Query and use &quot;Save Table&quot;.
                        </td>
                      </tr>
                    )}
                    {!loading &&
                      displayRows.map((row) => {
                        const delKey = `${row.partition_key}:${row.rowKey}`;
                        const busy = deleteBusyKey === delKey;
                        return (
                        <tr key={delKey} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          {isAdmin && (
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-xs max-w-[14rem] truncate" title={ownerLabel(row)}>
                              {ownerLabel(row)}
                            </td>
                          )}
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs font-mono max-w-[10rem] truncate" title={formatTenantCell(row)}>
                            {formatTenantCell(row)}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-900 dark:text-slate-100">{row.table_name}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.database_name}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.schema_name}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {typeof row.total_rows === 'number' && Number.isFinite(row.total_rows)
                              ? row.total_rows.toLocaleString()
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {formatCreatedAt(row.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setViewModalRow(row)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteRow(row)}
                                disabled={busy}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50"
                              >
                                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
              View opens Snowflake Query with{' '}
              <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">SELECT * … LIMIT 100</code>.
            </p>
          </div>
        </main>
      </div>

      {/* View Mode Modal */}
      {viewModalRow && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeModal}
            role="button"
            tabIndex={0}
          />
          <div className="relative mx-auto max-w-lg mt-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Open Table
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Choose Standard viewing or AI-enhanced enrichment.
              </p>
            </div>
            <div className="p-4 space-y-3">
              <button
                type="button"
                onClick={openStandard}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
              >
                Open Table (Standard)
              </button>
              <button
                type="button"
                onClick={openAi}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700"
              >
                Open AI Table (Enhanced)
              </button>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={closeModal}
                className="w-full px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
