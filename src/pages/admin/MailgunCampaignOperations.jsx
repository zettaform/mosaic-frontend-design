import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import { useToast } from '../../contexts/ToastContext';
import backendAuthService from '../../services/backendAuthService';
import { streamSseJson } from '../../utils/streamSseJson';

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_URL || '').trim();
}

function formatTimestamp(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function statusBadgeClass(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'running') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
  if (normalized === 'paused') return 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100';
  if (normalized === 'completed') return 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100';
  if (normalized === 'stopped') return 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100';
  if (normalized === 'failed') return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200';
  return 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100';
}

export default function MailgunCampaignOperations() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const { error, success } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [tenantId, setTenantId] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [eventFeed, setEventFeed] = useState({});
  const [streamState, setStreamState] = useState('connecting');
  const [controlBusy, setControlBusy] = useState('');
  const [requestsPerSecondInput, setRequestsPerSecondInput] = useState(1);
  const [totalTargetInput, setTotalTargetInput] = useState(0);

  const mergeCampaign = useCallback((campaign) => {
    if (!campaign?.campaign_id) return;
    setCampaigns((current) => {
      const next = [...current];
      const index = next.findIndex((item) => item.campaign_id === campaign.campaign_id);
      if (index >= 0) next[index] = { ...next[index], ...campaign };
      else next.unshift(campaign);
      next.sort((a, b) =>
        String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || ''))
      );
      return next;
    });
  }, []);

  const addEvent = useCallback((campaignId, entry) => {
    if (!campaignId) return;
    setEventFeed((current) => ({
      ...current,
      [campaignId]: [entry, ...(current[campaignId] || [])].slice(0, 25)
    }));
  }, []);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const base = getApiBaseUrl();
      const token = backendAuthService.getSessionToken();
      const resp = await fetch(`${base}/api/admin/mailgun/campaigns`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok || !json?.success) {
        throw new Error(json?.error || `Failed to load campaigns (${resp.status})`);
      }
      setCampaigns(Array.isArray(json.campaigns) ? json.campaigns : []);
      setTenantId(json.tenant_id || '');
      setSelectedId((current) => current || json?.campaigns?.[0]?.campaign_id || '');
    } catch (err) {
      error(err.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    if (!user) return;
    loadCampaigns();
  }, [loadCampaigns, user]);

  useEffect(() => {
    if (!user) return undefined;
    const token = backendAuthService.getSessionToken();
    const controller = new AbortController();
    const url = `${getApiBaseUrl()}/api/admin/mailgun/campaigns/stream`;
    setStreamState('connecting');

    streamSseJson(url, {
      token,
      signal: controller.signal,
      onOpen: () => setStreamState('connected'),
      onMessage: (payload) => {
        if (payload?.tenant_id) setTenantId(payload.tenant_id);
        if (payload?.type === 'tenant_snapshot') {
          const rows = Array.isArray(payload.campaigns) ? payload.campaigns : [];
          setCampaigns(rows);
          setSelectedId((current) => current || rows[0]?.campaign_id || '');
          return;
        }
        if (payload?.type === 'campaign_snapshot' && payload.campaign) {
          mergeCampaign(payload.campaign);
          setSelectedId((current) => current || payload.campaign.campaign_id || '');
          return;
        }
        if (payload?.type === 'campaign_event' && payload.event) {
          addEvent(payload.campaignId, payload.event);
          return;
        }
        if (payload?.type === 'campaign_log' && payload.log) {
          addEvent(payload.campaignId, {
            timestamp: payload.log.timestamp || payload.log.created_at,
            step: payload.log.step || payload.log.send_status || 'log',
            message: payload.log.message || 'Log update',
            email: payload.log.email || '',
            validation_result: payload.log.validation_result || '',
            send_status: payload.log.send_status || ''
          });
        }
      },
      onError: () => setStreamState('error')
    }).catch((err) => {
      if (controller.signal.aborted) return;
      setStreamState('error');
      error(err.message || 'Campaign live stream disconnected');
    });

    return () => controller.abort();
  }, [addEvent, error, mergeCampaign, user]);

  const activeCampaigns = useMemo(
    () => campaigns.filter((item) => ['running', 'paused'].includes(String(item.status || '').toLowerCase())),
    [campaigns]
  );
  const historicalCampaigns = useMemo(
    () => campaigns.filter((item) => !['running', 'paused'].includes(String(item.status || '').toLowerCase())),
    [campaigns]
  );
  const selectedCampaign = useMemo(
    () => campaigns.find((item) => item.campaign_id === selectedId) || activeCampaigns[0] || historicalCampaigns[0] || null,
    [activeCampaigns, campaigns, historicalCampaigns, selectedId]
  );
  const selectedEvents = selectedCampaign ? eventFeed[selectedCampaign.campaign_id] || [] : [];
  const selectedCampaignMode = String(selectedCampaign?.campaign_mode || '').toLowerCase();
  const isSnowflakeSendCampaign = selectedCampaignMode === 'snowflake_send';

  useEffect(() => {
    setRequestsPerSecondInput(Math.max(1, parseInt(selectedCampaign?.requests_per_second, 10) || 1));
  }, [selectedCampaign?.campaign_id, selectedCampaign?.requests_per_second]);

  useEffect(() => {
    const t = parseInt(selectedCampaign?.total_target, 10);
    setTotalTargetInput(Number.isFinite(t) && t >= 0 ? t : 0);
  }, [selectedCampaign?.campaign_id, selectedCampaign?.total_target]);

  const handleControl = useCallback(
    async (campaignId, action, extraBody = {}) => {
      if (!campaignId) return;
      setControlBusy(action);
      try {
        const base = getApiBaseUrl();
        const token = backendAuthService.getSessionToken();
        const resp = await fetch(`${base}/api/admin/mailgun/campaigns/${encodeURIComponent(campaignId)}/control`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action, ...extraBody })
        });
        const json = await resp.json().catch(() => null);
        if (!resp.ok || !json?.success) {
          throw new Error(json?.error || `Failed to ${action} campaign`);
        }
        mergeCampaign(json.campaign);
        success(`Campaign ${action} requested`);
      } catch (err) {
        error(err.message || `Failed to ${action} campaign`);
      } finally {
        setControlBusy('');
      }
    },
    [error, mergeCampaign, success]
  );

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

  if (!user) return <Navigate to="/signin" replace />;

  const routeInfo = ROUTE_TO_SECTION[currentPath];
  if (routeInfo && !hasAccess(user, routeInfo.section, routeInfo.page)) {
    return <Navigate to="/unauthorized" replace />;
  }
  if (!routeInfo) return <Navigate to="/unauthorized" replace />;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
                  Mailgun Campaign Operations
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Live campaign execution for tenant <span className="font-mono text-xs">{tenantId || '—'}</span>. Every
                  campaign update is streamed from the API while metadata and logs remain in Azure Table Storage. This page now tracks both enrichment runs and Snowflake send runs.
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  <Link className="text-indigo-600 dark:text-indigo-400 hover:underline" to="/admin/mailgun-campaigns">
                    Start enrichment
                  </Link>
                  {' · '}
                  <Link className="text-indigo-600 dark:text-indigo-400 hover:underline" to="/admin/mailgun-snowflakesend">
                    Start Snowflake send
                  </Link>
                  {' · '}
                  <Link className="text-indigo-600 dark:text-indigo-400 hover:underline" to="/admin/mailgun-test">
                    Mailgun test
                  </Link>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Stream:{' '}
                  <span
                    className={
                      streamState === 'connected'
                        ? 'text-emerald-600 dark:text-emerald-300'
                        : streamState === 'connecting'
                          ? 'text-amber-600 dark:text-amber-300'
                          : 'text-rose-600 dark:text-rose-300'
                    }
                  >
                    {streamState}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={loadCampaigns}
                  disabled={loading}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-sm font-medium"
                >
                  {loading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Active campaigns</h2>
                    <div className="text-xs text-slate-500">{activeCampaigns.length} running or paused</div>
                  </div>
                  <div className="space-y-3">
                    {activeCampaigns.length === 0 ? (
                      <div className="text-sm text-slate-500 dark:text-slate-400">No active campaigns right now.</div>
                    ) : (
                      activeCampaigns.map((campaign) => (
                        <button
                          type="button"
                          key={campaign.campaign_id}
                          onClick={() => setSelectedId(campaign.campaign_id)}
                          className={`w-full text-left rounded-lg border px-4 py-3 ${
                            selectedCampaign?.campaign_id === campaign.campaign_id
                              ? 'border-indigo-400 bg-indigo-50 dark:bg-slate-900'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-mono text-xs text-slate-600 dark:text-slate-300 break-all">
                              {campaign.campaign_id}
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] ${statusBadgeClass(campaign.status)}`}>
                              {campaign.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-slate-600 dark:text-slate-300">
                            <div>
                              <div className="text-slate-500">Dispatched</div>
                              <div className="font-semibold text-slate-800 dark:text-slate-100">
                                {campaign.processed_count || 0}
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500">Successful</div>
                              <div className="font-semibold text-slate-800 dark:text-slate-100">{campaign.sent_count || 0}</div>
                            </div>
                            <div>
                              <div className="text-slate-500">Skipped</div>
                              <div className="font-semibold text-slate-800 dark:text-slate-100">
                                {campaign.skipped_count || 0}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Last row: {campaign.last_user_id || '—'}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </section>

                <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Recent campaigns</div>
                  <div className="space-y-3">
                    {historicalCampaigns.slice(0, 10).map((campaign) => (
                      <button
                        type="button"
                        key={campaign.campaign_id}
                        onClick={() => setSelectedId(campaign.campaign_id)}
                        className={`w-full text-left rounded-lg border px-4 py-3 ${
                          selectedCampaign?.campaign_id === campaign.campaign_id
                            ? 'border-indigo-400 bg-indigo-50 dark:bg-slate-900'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-mono text-xs text-slate-600 dark:text-slate-300 break-all">
                            {campaign.campaign_id}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] ${statusBadgeClass(campaign.status)}`}>
                            {campaign.status}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Updated {formatTimestamp(campaign.updated_at || campaign.created_at)}
                        </div>
                      </button>
                    ))}
                    {historicalCampaigns.length === 0 ? (
                      <div className="text-sm text-slate-500 dark:text-slate-400">No completed or stopped campaigns yet.</div>
                    ) : null}
                  </div>
                </section>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                {!selectedCampaign ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Select a campaign to inspect its live activity.
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-mono text-xs text-slate-600 dark:text-slate-300 break-all">
                          {selectedCampaign.campaign_id}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${statusBadgeClass(selectedCampaign.status)}`}>
                          {selectedCampaign.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Created {formatTimestamp(selectedCampaign.created_at)} · Updated{' '}
                        {formatTimestamp(selectedCampaign.updated_at || selectedCampaign.created_at)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-3">
                        <div className="text-xs text-slate-500">Target</div>
                        <div className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                          {selectedCampaign.total_target || 0}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-3">
                        <div className="text-xs text-slate-500">Processed</div>
                        <div className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                          {selectedCampaign.processed_count || 0}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-3">
                        <div className="text-xs text-slate-500">Successful</div>
                        <div className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                          {selectedCampaign.sent_count || 0}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-3">
                        <div className="text-xs text-slate-500">Skipped</div>
                        <div className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                          {selectedCampaign.skipped_count || 0}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-3">
                        <div className="text-xs text-slate-500">{isSnowflakeSendCampaign ? 'Throttlers' : 'RPS'}</div>
                        <div className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                          {selectedCampaign.requests_per_second || 1}
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-3">
                        <div className="text-xs text-slate-500">Current row</div>
                        <div className="mt-1 text-slate-800 dark:text-slate-100">
                          {selectedCampaign.last_user_id || '—'}
                        </div>
                        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          Recipient: {selectedCampaign.last_email || '—'}
                        </div>
                        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          {selectedCampaign.first_column_name || '—'}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-3">
                        <div className="text-xs text-slate-500">Run status</div>
                        <div className="mt-1 text-slate-800 dark:text-slate-100">
                          {selectedCampaign.rate_limit_status || '—'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Updated: {formatTimestamp(selectedCampaign.updated_at || selectedCampaign.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={controlBusy !== '' || selectedCampaign.status !== 'running'}
                        onClick={() => handleControl(selectedCampaign.campaign_id, 'pause')}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 text-sm font-medium"
                      >
                        {controlBusy === 'pause' ? 'Pausing…' : 'Pause'}
                      </button>
                      <button
                        type="button"
                        disabled={controlBusy !== '' || selectedCampaign.status !== 'paused'}
                        onClick={() => handleControl(selectedCampaign.campaign_id, 'resume')}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 text-sm font-medium"
                      >
                        {controlBusy === 'resume' ? 'Resuming…' : 'Resume'}
                      </button>
                      <button
                        type="button"
                        disabled={controlBusy !== '' || ['completed', 'failed', 'stopped'].includes(String(selectedCampaign.status || '').toLowerCase())}
                        onClick={() => handleControl(selectedCampaign.campaign_id, 'stop')}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 text-sm font-medium"
                      >
                        {controlBusy === 'stop' ? 'Stopping…' : 'Stop'}
                      </button>
                      <Link
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium"
                        to={`/admin/mailgun-campaign-logs?campaignId=${encodeURIComponent(selectedCampaign.campaign_id)}`}
                      >
                        Campaign logs
                      </Link>
                    </div>

                    {!isSnowflakeSendCampaign ? (
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-3">
                        <div className="text-xs text-slate-500 mb-2">Fire-and-forget requests per second</div>
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            type="number"
                            min={1}
                            className="w-32 rounded border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900"
                            value={requestsPerSecondInput}
                            onChange={(e) => setRequestsPerSecondInput(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          />
                          <button
                            type="button"
                            disabled={controlBusy !== '' || ['completed', 'failed', 'stopped'].includes(String(selectedCampaign.status || '').toLowerCase())}
                            onClick={() =>
                              handleControl(selectedCampaign.campaign_id, 'set_rate', {
                                requestsPerSecond: requestsPerSecondInput
                              })
                            }
                            className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 text-sm font-medium"
                          >
                            {controlBusy === 'set_rate' ? 'Updating…' : 'Update RPS'}
                          </button>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Default is `1`. Increase to `2` or more to dispatch faster.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-3">
                        <div className="text-xs text-slate-500 mb-2">Successful-send target (live)</div>
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            type="number"
                            min={0}
                            className="w-36 rounded border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900"
                            value={totalTargetInput}
                            onChange={(e) =>
                              setTotalTargetInput(Math.max(0, parseInt(e.target.value, 10) || 0))
                            }
                          />
                          <button
                            type="button"
                            disabled={
                              controlBusy !== '' ||
                              ['completed', 'failed', 'stopped'].includes(String(selectedCampaign.status || '').toLowerCase())
                            }
                            onClick={() =>
                              handleControl(selectedCampaign.campaign_id, 'set_target', {
                                totalTarget: totalTargetInput
                              })
                            }
                            className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 text-sm font-medium"
                          >
                            {controlBusy === 'set_target' ? 'Updating…' : 'Update target'}
                          </button>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Stops after this many successful sends (0 = no cap until the table is exhausted). Applies immediately without restarting the API.
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="border-b border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                        Live activity
                      </div>
                      {selectedEvents.length === 0 ? (
                        <div className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                          Waiting for streamed activity for this campaign.
                        </div>
                      ) : (
                        <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                          {selectedEvents.map((entry, index) => (
                            <div key={`${entry.timestamp}-${entry.step}-${index}`} className="px-3 py-3 text-sm">
                              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span>{formatTimestamp(entry.timestamp)}</span>
                                <span className="font-medium">{entry.step || 'event'}</span>
                              </div>
                              <div className="mt-1 text-slate-800 dark:text-slate-100">{entry.message || 'Update received'}</div>
                              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 break-all">
                                {entry.email || entry.user_id || ''}
                                {entry.validation_result ? ` · validation ${entry.validation_result}` : ''}
                                {entry.send_status ? ` · ${entry.send_status}` : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
