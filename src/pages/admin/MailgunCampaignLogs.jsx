import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useSearchParams, Link } from 'react-router-dom';
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

export default function MailgunCampaignLogs() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const [searchParams, setSearchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId') || '';
  const { error } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [sendStats, setSendStats] = useState([]);
  const [tenantId, setTenantId] = useState('');
  const [campaign, setCampaign] = useState(null);
  const [streamState, setStreamState] = useState('idle');

  useEffect(() => {
    if (!campaignId || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const base = getApiBaseUrl();
        const token = backendAuthService.getSessionToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [respLogs, respStats, respCampaign] = await Promise.all([
          fetch(
            `${base}/api/admin/mailgun/campaigns/${encodeURIComponent(campaignId)}/logs`,
            { headers }
          ),
          fetch(
            `${base}/api/admin/mailgun/campaigns/${encodeURIComponent(campaignId)}/send-stats`,
            { headers }
          ),
          fetch(
            `${base}/api/admin/mailgun/campaigns/${encodeURIComponent(campaignId)}`,
            { headers }
          )
        ]);
        const jsonLogs = await respLogs.json().catch(() => null);
        const jsonStats = await respStats.json().catch(() => null);
        const jsonCampaign = await respCampaign.json().catch(() => null);
        if (!respLogs.ok || !jsonLogs?.success) throw new Error(jsonLogs?.error || `HTTP ${respLogs.status}`);
        if (!cancelled) {
          setLogs(jsonLogs.logs || []);
          setTenantId(jsonLogs.tenant_id || '');
          setSendStats(respStats.ok && jsonStats?.success ? jsonStats.stats || [] : []);
          setCampaign(respCampaign.ok && jsonCampaign?.success ? jsonCampaign.campaign || null : null);
        }
      } catch (e) {
        if (!cancelled) error(e.message || 'Failed to load logs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId, user, error]);

  useEffect(() => {
    if (!campaignId || !user) return undefined;
    const token = backendAuthService.getSessionToken();
    const controller = new AbortController();
    const url = `${getApiBaseUrl()}/api/admin/mailgun/campaigns/stream?campaignId=${encodeURIComponent(campaignId)}`;
    setStreamState('connecting');

    streamSseJson(url, {
      token,
      signal: controller.signal,
      onOpen: () => setStreamState('connected'),
      onMessage: (payload) => {
        if (payload?.tenant_id) setTenantId(payload.tenant_id);
        if (payload?.type === 'tenant_snapshot') {
          const matching = Array.isArray(payload.campaigns)
            ? payload.campaigns.find((item) => item.campaign_id === campaignId)
            : null;
          if (matching) setCampaign(matching);
          return;
        }
        if (payload?.type === 'campaign_snapshot' && payload.campaign?.campaign_id === campaignId) {
          setCampaign(payload.campaign);
          return;
        }
        if (payload?.type === 'campaign_log' && payload.log && payload.campaignId === campaignId) {
          setLogs((current) => {
            if (current.some((item) => item.row_key === payload.log.row_key)) return current;
            return [...current, payload.log].sort((a, b) =>
              String(a.created_at || a.timestamp || '').localeCompare(String(b.created_at || b.timestamp || ''))
            );
          });
        }
      },
      onError: () => setStreamState('error')
    }).catch(() => {
      if (!controller.signal.aborted) setStreamState('error');
    });

    return () => controller.abort();
  }, [campaignId, user]);

  const sortedLogs = useMemo(
    () =>
      [...logs].sort((a, b) =>
        String(a.created_at || a.timestamp || '').localeCompare(String(b.created_at || b.timestamp || ''))
      ),
    [logs]
  );

  if (authLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="sidebar-shell-main-noscroll">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
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
          <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Campaign logs</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Tenant: <span className="font-mono text-xs">{tenantId || '—'}</span> · Open from{' '}
                <Link className="text-indigo-600 dark:text-indigo-400 underline" to="/admin/mailgun-campaign-operations">
                  Mailgun Campaign Operations
                </Link>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Stream: {streamState}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-slate-500 mb-1">Campaign instance id</label>
                <input
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800"
                  value={campaignId}
                  onChange={(e) => setSearchParams(e.target.value ? { campaignId: e.target.value } : {})}
                  placeholder="durable_mailgun_tc_..."
                />
              </div>
            </div>

            {loading ? (
              <div className="text-slate-500">Loading…</div>
            ) : !campaignId ? (
              <div className="text-sm text-slate-500">Enter a campaign instance id to load logs.</div>
            ) : (
              <>
                {campaign ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                    <div className="grid md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-slate-500">Status</div>
                        <div className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{campaign.status || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Processed</div>
                        <div className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{campaign.processed_count || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Sent</div>
                        <div className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{campaign.sent_count || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Skipped</div>
                        <div className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{campaign.skipped_count || 0}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      Current sender: {campaign.current_sender_from || '—'} · Rate limit: {campaign.rate_limit_status || '—'}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
                    Send stats (per sender)
                  </h2>
                  {sendStats.length === 0 ? (
                    <div className="text-sm text-slate-500">No send stats recorded yet for this campaign.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-slate-500 border-b border-slate-200 dark:border-slate-600">
                            <th className="pb-2 pr-4">From</th>
                            <th className="pb-2 pr-4">Domain</th>
                            <th className="pb-2 pr-4">API base</th>
                            <th className="pb-2 pr-4">Sends</th>
                            <th className="pb-2">Last recipient</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sendStats.map((s) => (
                            <tr key={s.row_key} className="border-b border-slate-100 dark:border-slate-700">
                              <td className="py-2 pr-4">
                                <span className="font-medium">{s.sender_name || '—'}</span>
                                <div className="text-xs font-mono text-slate-600 dark:text-slate-300">{s.sender_from}</div>
                              </td>
                              <td className="py-2 pr-4 font-mono text-xs">{s.mailgun_domain || '—'}</td>
                              <td className="py-2 pr-4 font-mono text-xs break-all">{s.mailgun_base_url || '—'}</td>
                              <td className="py-2 pr-4 font-medium">{s.sent_count}</td>
                              <td className="py-2 text-xs font-mono break-all">{s.last_to_email || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {sortedLogs.length === 0 ? (
                  <div className="text-sm text-slate-500 mt-4">No log rows yet (or campaign id not found).</div>
                ) : (
              <div className="space-y-2 mt-6">
                {sortedLogs.map((log) => (
                  <div
                    key={`${log.row_key}-${log.created_at}`}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm"
                  >
                    <div className="flex justify-between gap-2 text-xs text-slate-500">
                      <span>{log.timestamp || log.created_at}</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {log.step || log.send_status || log.level}
                      </span>
                    </div>
                    <div className="mt-1 text-slate-800 dark:text-slate-100">{log.message}</div>
                    <div className="mt-2 grid md:grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div>User ID: <span className="font-mono">{log.user_id || '—'}</span></div>
                      <div>Recipient: <span className="font-mono">{log.email || '—'}</span></div>
                      <div>Validation: <span className="font-medium">{log.validation_result || '—'}</span></div>
                      <div>Captions fetched: <span className="font-medium">{log.captions_fetched ?? 0}</span></div>
                      <div>Send status: <span className="font-medium">{log.send_status || '—'}</span></div>
                      <div>Sender: <span className="font-mono">{log.sender_from || '—'}</span></div>
                    </div>
                    {log.generated_email_json ? (
                      <pre className="mt-2 text-[11px] overflow-x-auto bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-700">
                        {(() => {
                          try {
                            return JSON.stringify(JSON.parse(log.generated_email_json), null, 2);
                          } catch {
                            return log.generated_email_json;
                          }
                        })()}
                      </pre>
                    ) : null}
                    {log.meta_json ? (
                      <pre className="mt-2 text-[11px] overflow-x-auto bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-700">
                        {(() => {
                          try {
                            return JSON.stringify(JSON.parse(log.meta_json), null, 2);
                          } catch {
                            return log.meta_json;
                          }
                        })()}
                      </pre>
                    ) : null}
                  </div>
                ))}
              </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
