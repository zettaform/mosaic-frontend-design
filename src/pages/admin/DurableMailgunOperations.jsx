import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import { useToast } from '../../contexts/ToastContext';
import backendAuthService from '../../services/backendAuthService';

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_URL || '').trim();
}

function formatOverviewTimestamp(value) {
  if (!value) return '-';
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) return value;
  return time.toLocaleString();
}

export default function DurableMailgunOperations() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const { error, success } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState([]);
  const [tenantId, setTenantId] = useState('');
  const [selected, setSelected] = useState(null);
  const [selectedOverview, setSelectedOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [terminating, setTerminating] = useState(false);
  const [dashboardHint, setDashboardHint] = useState(null);
  const [degradedCount, setDegradedCount] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);

  const fetchActive = useCallback(async () => {
    setLoading(true);
    try {
      const base = getApiBaseUrl();
      const token = backendAuthService.getSessionToken();
      if (!token) throw new Error('Not authenticated');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };
      const resp = await fetch(`${base}/api/admin/mailgun/durable/runs?include_status=1`, {
        method: 'GET',
        headers
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok || !json?.success) {
        const baseMsg = json?.error || `Failed (HTTP ${resp.status})`;
        const detailsMsg = json?.details?.message || json?.details?.error || '';
        throw new Error(detailsMsg ? `${baseMsg}: ${detailsMsg}` : baseMsg);
      }
      const allRuns = Array.isArray(json.runs) ? json.runs : [];
      const activeStatuses = new Set(['Running', 'Pending', 'ContinuedAsNew']);
      const activeCount = allRuns.filter((run) => activeStatuses.has(String(run.runtime_status || ''))).length;
      const degradedRuns = allRuns.filter((run) => run.status_degraded === true);

      setRuns(allRuns);
      setTenantId(json.tenant_id || '');
      setDashboardHint(
        degradedRuns.length > 0
          ? 'Some rows show Unknown because the stored Azure Durable status URL could not be read from this environment.'
          : null
      );
      setDegradedCount(degradedRuns.length);
      setConfirmedCount(activeCount);
      setSelected((prev) => {
        if (!prev?.instance_id) return prev;
        return allRuns.find((run) => run.instance_id === prev.instance_id) || prev;
      });
    } catch (e) {
      console.error(e);
      setRuns([]);
      setDashboardHint(null);
      setDegradedCount(0);
      setConfirmedCount(0);
      error(e.message || 'Failed to load durable Mailgun statuses');
    } finally {
      setLoading(false);
    }
  }, [error]);

  const fetchRunOverview = useCallback(async (runOrInstanceId, options = {}) => {
    const instanceId =
      typeof runOrInstanceId === 'string'
        ? String(runOrInstanceId).trim()
        : String(runOrInstanceId?.instance_id || '').trim();
    if (!instanceId) return;

    if (!options.silent) {
      setOverviewLoading(true);
      setOverviewError('');
    }

    try {
      const base = getApiBaseUrl();
      const token = backendAuthService.getSessionToken();
      if (!token) throw new Error('Not authenticated');
      const resp = await fetch(`${base}/api/admin/mailgun/durable/runs/overview?instanceId=${encodeURIComponent(instanceId)}`, {
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
      setSelectedOverview(json);
      setSelected(json.run || null);
      setOverviewError('');
    } catch (e) {
      console.error(e);
      const message = e.message || 'Failed to load run overview';
      setOverviewError(message);
      if (!options.silent) error(message);
    } finally {
      if (!options.silent) {
        setOverviewLoading(false);
      }
    }
  }, [error]);

  const terminateCampaign = useCallback(async (run) => {
    if (!run?.instance_id) return;
    const ok = window.confirm(
      `Terminate orchestration ${run.instance_id}? In-flight work will stop; this cannot be undone.`
    );
    if (!ok) return;
    setTerminating(true);
    try {
      const base = getApiBaseUrl();
      const token = backendAuthService.getSessionToken();
      if (!token) throw new Error('Not authenticated');
      const resp = await fetch(`${base}/api/admin/mailgun/durable/terminate`, {
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
        throw new Error(baseMsg);
      }
      success('Termination requested. Refresh the list in a few seconds.');
      setSelected(null);
      setSelectedOverview(null);
      setOverviewError('');
      await fetchActive();
    } catch (e) {
      console.error(e);
      error(e.message || 'Failed to terminate campaign');
    } finally {
      setTerminating(false);
    }
  }, [error, fetchActive, success]);

  useEffect(() => {
    if (!user) return;
    fetchActive();
  }, [fetchActive, user]);

  useEffect(() => {
    if (!autoRefresh || !user) return undefined;
    const id = setInterval(() => {
      fetchActive();
      if (selected?.instance_id) {
        fetchRunOverview(selected.instance_id, { silent: true });
      }
    }, 10000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchActive, fetchRunOverview, selected?.instance_id, user]);

  const rows = useMemo(() => runs || [], [runs]);
  const activeStatuses = useMemo(() => new Set(['Running', 'Pending', 'ContinuedAsNew']), []);
  const activeRows = useMemo(
    () => rows.filter((run) => activeStatuses.has(String(run.runtime_status || '')) || run.status_degraded === true),
    [activeStatuses, rows]
  );
  const historicalRows = useMemo(
    () => rows.filter((run) => !activeStatuses.has(String(run.runtime_status || '')) && run.status_degraded !== true),
    [activeStatuses, rows]
  );
  const detailRun = selectedOverview?.run || selected;
  const detailStatus = selectedOverview?.status || null;
  const sendStats = Array.isArray(selectedOverview?.send_stats) ? selectedOverview.send_stats : [];
  const sendStatsSummary = selectedOverview?.send_stats_summary || null;
  const runtimeLabel = detailStatus?.runtimeStatus || detailRun?.runtime_status || null;

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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">Durable Mailgun Operations</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Latest Azure Durable Mailgun statuses for your tenant only. The dashboard reads stored orchestration
                  metadata from Azure Table Storage and then fetches live status directly from the Azure Durable status URL.
                  Metadata is stored in (
                  <span className="font-mono text-xs">durablemailguncampaigns</span>
                  ). Tenant scope: <span className="font-mono text-xs">{tenantId || '—'}</span>
                </p>
                {dashboardHint ? (
                  <div
                    className="mt-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-sm text-amber-900 dark:text-amber-100"
                    role="status"
                  >
                    {dashboardHint}
                  </div>
                ) : null}
                {confirmedCount > 0 || degradedCount > 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Active right now: {confirmedCount}
                    {degradedCount > 0 ? ` · Status unclear: ${degradedCount}` : ''}
                  </p>
                ) : null}
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  <Link className="text-indigo-600 dark:text-indigo-400 hover:underline" to="/admin/mailgun-campaigns">
                    Start a campaign
                  </Link>
                  {' · '}
                  <Link className="text-indigo-600 dark:text-indigo-400 hover:underline" to="/admin/mailgun-test">
                    Mailgun test
                  </Link>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                  Auto-refresh (10s)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    fetchActive();
                    if (selected?.instance_id) fetchRunOverview(selected.instance_id, { silent: false });
                  }}
                  disabled={loading}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-sm font-medium"
                >
                  {loading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                {loading && rows.length === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">Loading…</div>
                ) : (
                  <div className="space-y-3">
                    {activeRows.map((r) => (
                      <button
                        type="button"
                        key={r.instance_id}
                        onClick={() => {
                          setSelected(r);
                          setSelectedOverview(null);
                          setOverviewError('');
                          fetchRunOverview(r, { silent: false });
                        }}
                        className={`w-full text-left rounded-lg border px-3 py-2 ${
                          selected?.instance_id === r.instance_id
                            ? 'border-indigo-400 bg-indigo-50 dark:bg-slate-900'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs text-slate-500 dark:text-slate-400">{r.created_at || '—'}</div>
                          {r.runtime_status ? (
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full ${
                                r.status_degraded || r.runtime_status === 'Unknown'
                                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100'
                                  : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200'
                              }`}
                            >
                              {r.runtime_status}
                              {r.status_degraded ? ' (degraded)' : ''}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-sm font-mono text-slate-800 dark:text-slate-100 break-all">{r.instance_id}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {r.file_name ? (
                            <>
                              <span className="font-medium">File:</span> {r.file_name}
                            </>
                          ) : null}
                        </div>
                        {r.last_status_fetch_error ? (
                          <div className="text-[11px] text-amber-800 dark:text-amber-200 mt-1 break-words">
                            {r.last_status_fetch_error}
                          </div>
                        ) : null}
                        <Link
                          className="inline-block mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                          to={`/admin/mailgun-campaign-logs?campaignId=${encodeURIComponent(r.instance_id)}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Campaign logs
                        </Link>
                      </button>
                    ))}
                  </div>
                )}
                {rows.length === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    No durable runs found for this tenant.
                  </div>
                ) : null}
                {historicalRows.length > 0 ? (
                  <div className={`${activeRows.length > 0 ? 'mt-6' : 'mt-0'} space-y-3`}>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Recent durable history
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Completed, failed, or terminated runs still show here so status is visible even after the run is no
                      longer active.
                    </div>
                    {historicalRows.slice(0, 20).map((r) => (
                      <button
                        type="button"
                        key={`recent-${r.instance_id}`}
                        onClick={() => {
                          setSelected(r);
                          setSelectedOverview(null);
                          setOverviewError('');
                          fetchRunOverview(r, { silent: false });
                        }}
                        className={`w-full text-left rounded-lg border px-3 py-2 ${
                          selected?.instance_id === r.instance_id
                            ? 'border-indigo-400 bg-indigo-50 dark:bg-slate-900'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs text-slate-500 dark:text-slate-400">{r.created_at || '-'}</div>
                          {r.runtime_status ? (
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full ${
                                r.runtime_status === 'Completed'
                                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                                  : r.status_degraded || r.runtime_status === 'Unknown'
                                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100'
                                    : 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200'
                              }`}
                            >
                              {r.runtime_status}
                              {r.status_degraded ? ' (degraded)' : ''}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-sm font-mono text-slate-800 dark:text-slate-100 break-all">{r.instance_id}</div>
                        {r.file_name ? (
                          <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                            <span className="font-medium">File:</span> {r.file_name}
                          </div>
                        ) : null}
                        <Link
                          className="inline-block mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                          to={`/admin/mailgun-campaign-logs?campaignId=${encodeURIComponent(r.instance_id)}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Campaign logs
                        </Link>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                {!detailRun ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Select any run to load Azure Durable status and any recorded send stats.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Selected</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Instance</div>
                    <div className="text-sm font-mono break-all text-slate-800 dark:text-slate-100">{detailRun.instance_id}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      The Azure durable status URL contains a secret function key and is never sent to the browser.
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Send stats come from the API ingest pipeline and are filtered server-side to your tenant before
                      rendering here.
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => fetchRunOverview(detailRun, { silent: false })}
                        disabled={overviewLoading}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 text-sm font-medium"
                      >
                        {overviewLoading ? 'Refreshing…' : 'Refresh details'}
                      </button>
                      <button
                        type="button"
                        onClick={() => terminateCampaign(detailRun)}
                        disabled={terminating}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 text-sm font-medium"
                      >
                        {terminating ? 'Terminating…' : 'Terminate campaign'}
                      </button>
                      <Link
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium"
                        to={`/admin/mailgun-campaign-logs?campaignId=${encodeURIComponent(detailRun.instance_id)}`}
                      >
                        Campaign logs
                      </Link>
                      {runtimeLabel ? (
                        <div className="text-sm text-slate-600 dark:text-slate-300">Runtime: {runtimeLabel}</div>
                      ) : null}
                    </div>

                    {detailRun?.last_status_fetch_error || overviewError ? (
                      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
                        {detailRun?.last_status_fetch_error || overviewError}
                      </div>
                    ) : null}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-3">
                        <div className="text-xs text-slate-500 dark:text-slate-400">Successful sends</div>
                        <div className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                          {sendStatsSummary?.total_sends ?? 0}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-3">
                        <div className="text-xs text-slate-500 dark:text-slate-400">Active senders</div>
                        <div className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                          {sendStatsSummary?.sender_count ?? 0}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-3">
                        <div className="text-xs text-slate-500 dark:text-slate-400">Last stats update</div>
                        <div className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                          {formatOverviewTimestamp(sendStatsSummary?.last_updated_at)}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="border-b border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                        Send stats by sender
                      </div>
                      {sendStats.length === 0 ? (
                        <div className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                          No send stats recorded yet for this campaign.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs text-slate-500 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-3 py-2 pr-4">From</th>
                                <th className="px-3 py-2 pr-4">Domain</th>
                                <th className="px-3 py-2 pr-4">API base</th>
                                <th className="px-3 py-2 pr-4">Sends</th>
                                <th className="px-3 py-2">Last recipient</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sendStats.map((stat) => (
                                <tr key={stat.row_key} className="border-b border-slate-100 dark:border-slate-700">
                                  <td className="px-3 py-2 pr-4">
                                    <div className="font-medium text-slate-800 dark:text-slate-100">
                                      {stat.sender_name || '-'}
                                    </div>
                                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                      {stat.sender_from || '-'}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 pr-4 font-mono text-xs text-slate-700 dark:text-slate-200">
                                    {stat.mailgun_domain || '-'}
                                  </td>
                                  <td className="px-3 py-2 pr-4 font-mono text-xs break-all text-slate-700 dark:text-slate-200">
                                    {stat.mailgun_base_url || '-'}
                                  </td>
                                  <td className="px-3 py-2 pr-4 font-semibold text-slate-800 dark:text-slate-100">
                                    {stat.sent_count ?? 0}
                                  </td>
                                  <td className="px-3 py-2 font-mono text-xs break-all text-slate-700 dark:text-slate-200">
                                    {stat.last_to_email || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {detailStatus ? (
                      <pre className="mt-2 max-h-[55vh] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-[11px] text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                        {JSON.stringify(detailStatus, null, 2)}
                      </pre>
                    ) : (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Full durable status is unavailable until the overview refresh completes or the status endpoint
                        becomes reachable.
                      </div>
                    )}
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
