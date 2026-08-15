import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import { useToast } from '../../contexts/ToastContext';
import backendAuthService from '../../services/backendAuthService';
import { getApiUrl } from '../../utils/getBackendUrl';

const DEFAULT_MAILGUN_BASE = 'https://api.mailgun.net';
const FIXED_MAILGUN_SECRET_NAME = 'growcial-mailgun-token';

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_URL || '').trim();
}

function emptySender() {
  return {
    savedSenderKey: '',
    secret_name: FIXED_MAILGUN_SECRET_NAME,
    from_address: '',
    from_name: '',
    email_signature: '',
    domain: '',
    base_url: DEFAULT_MAILGUN_BASE,
    interval_min_sec: 1,
    interval_max_sec: 2,
    burst_pause_enabled: false,
    pause_every_min_sends: 50,
    pause_every_max_sends: 100,
    pause_min_minutes: 5,
    pause_max_minutes: 10,
    max_sends_per_sender: 0
  };
}

function isLikelyEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function isValidFullName(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return false;
  if (isLikelyEmail(trimmed)) return false;
  return trimmed.split(/\s+/).filter(Boolean).length >= 2;
}

export default function MailgunSnowflakeSend() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const { success, error } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const [savedTables, setSavedTables] = useState([]);
  const [sendersList, setSendersList] = useState([]);
  const [savedTableRowKey, setSavedTableRowKey] = useState('');
  const [targetRows, setTargetRows] = useState(0);
  const [subjectTemplate, setSubjectTemplate] = useState('{{subject_line}}');
  const [bodyTemplate, setBodyTemplate] = useState('{{introduction}}\n\n{{body_text}}\n\n{{last_para}}\n\n{{email_signature}}');
  const [senderRows, setSenderRows] = useState([emptySender()]);
  const [lastStartedCampaignId, setLastStartedCampaignId] = useState('');

  const loadSendersList = useCallback(async () => {
    try {
      const token = backendAuthService.getSessionToken();
      const url = getApiUrl(`/mailgun/senders?secretName=${encodeURIComponent(FIXED_MAILGUN_SECRET_NAME)}`);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const json = await response.json().catch(() => ({}));
      if (response.ok && json.success) setSendersList(json.items || []);
      else setSendersList([]);
    } catch (fetchError) {
      console.error(fetchError);
      setSendersList([]);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const token = backendAuthService.getSessionToken();
      const base = getApiBaseUrl();
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      const savedTablesResponse = await fetch(`${base}/api/snowflake/saved-tables`, { headers });
      const savedTablesJson = await savedTablesResponse.json().catch(() => ({}));
      if (savedTablesResponse.ok && savedTablesJson.success) setSavedTables(savedTablesJson.tables || []);
    } catch (loadError) {
      console.error(loadError);
      error(loadError.message || 'Failed to load Mailgun Snowflake Send data');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    if (!user?.email) return;
    loadAll();
    loadSendersList();
  }, [loadAll, loadSendersList, user?.email]);

  const tableOptions = useMemo(
    () =>
      savedTables.map((table) => ({
        key: table.rowKey,
        label: `${table.table_name} · ${table.database_name}.${table.schema_name}`
      })),
    [savedTables]
  );

  const handleSenderPick = (idx, rowKey) => {
    const sender = sendersList.find((item) => String(item.rowKey || item.id) === String(rowKey));
    if (!sender) return;
    const strictSenderName = String(sender.sender_name || '').trim();
    setSenderRows((current) => {
      const next = [...current];
      next[idx] = {
        ...next[idx],
        savedSenderKey: rowKey,
        secret_name: FIXED_MAILGUN_SECRET_NAME,
        from_address: sender.sender_email || sender.from_address || '',
        from_name: strictSenderName,
        email_signature: sender.email_signature || '',
        domain: sender.domain_name || sender.domain || '',
        base_url: (sender.base_url || DEFAULT_MAILGUN_BASE).trim() || DEFAULT_MAILGUN_BASE
      };
      return next;
    });
  };

  const updateSender = (idx, patch) => {
    setSenderRows((current) => {
      const next = [...current];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const handleAddSender = () => {
    setSenderRows((current) => [...current, emptySender()]);
  };

  const handleRemoveSender = (idx) => {
    setSenderRows((current) => (current.length === 1 ? current : current.filter((_, index) => index !== idx)));
  };

  const handleStart = async () => {
    if (!savedTableRowKey) return error('Choose a saved Snowflake table');
    if (!subjectTemplate.trim()) return error('Subject template is required');
    if (!bodyTemplate.trim()) return error('Body template is required');

    const invalidSender = senderRows.find(
      (row) =>
        !String(row.from_address || '').trim() ||
        !isValidFullName(row.from_name || '') ||
        !String(row.domain || '').trim()
    );
    if (invalidSender) {
      return error('Each sender needs from email, full sender name (first + last), and Mailgun domain');
    }

    setStarting(true);
    try {
      const base = getApiBaseUrl();
      const token = backendAuthService.getSessionToken();
      const response = await fetch(`${base}/api/admin/mailgun/snowflake-send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          savedTableRowKey,
          targetRows: Math.max(0, parseInt(targetRows, 10) || 0),
          subjectTemplate,
          bodyTemplate,
          senders: senderRows.map((row) => ({
            savedSenderKey: row.savedSenderKey,
            secret_name: FIXED_MAILGUN_SECRET_NAME,
            from_address: row.from_address,
            from_name: row.from_name,
            email_signature: row.email_signature || '',
            domain: row.domain,
            base_url: row.base_url,
            interval_min_sec: Math.max(0, parseInt(row.interval_min_sec, 10) || 0),
            interval_max_sec: Math.max(
              Math.max(0, parseInt(row.interval_min_sec, 10) || 0),
              parseInt(row.interval_max_sec, 10) || Math.max(0, parseInt(row.interval_min_sec, 10) || 0)
            ),
            burst_pause_enabled: !!row.burst_pause_enabled,
            pause_every_min_sends: Math.max(1, parseInt(row.pause_every_min_sends, 10) || 1),
            pause_every_max_sends: Math.max(
              Math.max(1, parseInt(row.pause_every_min_sends, 10) || 1),
              parseInt(row.pause_every_max_sends, 10) || Math.max(1, parseInt(row.pause_every_min_sends, 10) || 1)
            ),
            pause_min_minutes: Math.max(1, parseInt(row.pause_min_minutes, 10) || 1),
            pause_max_minutes: Math.max(
              Math.max(1, parseInt(row.pause_min_minutes, 10) || 1),
              parseInt(row.pause_max_minutes, 10) || Math.max(1, parseInt(row.pause_min_minutes, 10) || 1)
            ),
            max_sends_per_sender: Math.max(0, parseInt(row.max_sends_per_sender, 10) || 0)
          }))
        })
      });

      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) {
        throw new Error(json?.error || `Failed to start Snowflake send (HTTP ${response.status})`);
      }

      setLastStartedCampaignId(json.campaignId || '');
      success(`Snowflake Mailgun send started (${json.campaignId})`);
    } catch (startError) {
      console.error(startError);
      error(startError.message || 'Failed to start Snowflake Mailgun send');
    } finally {
      setStarting(false);
    }
  };

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
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">Mailgun Snowflake Send</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Select a saved Snowflake table and send only rows where <span className="font-mono">mailgun_ai_output_json</span> already has data.
                Rows are eligible only when that JSON exists and <span className="font-mono">mailgun_sent</span> is still blank. Once a send succeeds, the backend writes the new
                sent flag so the same row will not send again.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                This run happens inside the backend, so it keeps going even after this page is closed. Monitor progress on{' '}
                <Link className="text-indigo-600 dark:text-indigo-400 underline" to="/admin/mailgun-campaign-operations">
                  Mailgun Campaign Operations
                </Link>
                .
              </p>
            </div>

            {loading ? (
              <div className="text-slate-500">Loading…</div>
            ) : (
              <>
                <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
                  <h2 className="font-semibold text-slate-800 dark:text-slate-100">1. Source table</h2>
                  <select
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                    value={savedTableRowKey}
                    onChange={(event) => setSavedTableRowKey(event.target.value)}
                  >
                    <option value="">Select saved table…</option>
                    {tableOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Max emails to send</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                      value={targetRows}
                      onChange={(event) => setTargetRows(parseInt(event.target.value, 10) || 0)}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Use <span className="font-mono">0</span> to scan the whole table and send every eligible row.
                    </p>
                  </div>
                </section>

                <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
                  <h2 className="font-semibold text-slate-800 dark:text-slate-100">2. Templates</h2>
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Subject template</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                      value={subjectTemplate}
                      onChange={(event) => setSubjectTemplate(event.target.value)}
                      placeholder="{{subject_line}}"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Example: <span className="font-mono">{'{{subject_line}}'}</span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Body template</label>
                    <textarea
                      className="w-full min-h-[180px] rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-xs font-mono"
                      value={bodyTemplate}
                      onChange={(event) => setBodyTemplate(event.target.value)}
                      placeholder={'{{introduction}}\n\n{{body_text}}\n\n{{last_para}}\n\n{{email_signature}}'}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Placeholders are read from the Snowflake row plus <span className="font-mono">mailgun_ai_output_json</span>. Top-level keys like{' '}
                    <span className="font-mono">email</span> and nested result keys like <span className="font-mono">subject_line</span>,{' '}
                    <span className="font-mono">introduction</span>, <span className="font-mono">body_text</span>, and <span className="font-mono">last_para</span> are all available.
                    {' '}Use <span className="font-mono">{'{{email_signature}}'}</span> to append the selected sender&apos;s signature.
                  </p>
                </section>

                <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-slate-800 dark:text-slate-100">3. Senders and throttlers</h2>
                    <button
                      type="button"
                      onClick={handleAddSender}
                      className="text-sm text-indigo-600 dark:text-indigo-400"
                    >
                      + Add sender
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Every sender has its own throttler. If you add three senders, the backend will maintain three independent timing schedules while the campaign runs. All sends use the Mailgun API key from Key Vault secret{' '}
                    <span className="font-mono">{FIXED_MAILGUN_SECRET_NAME}</span>.
                  </p>

                  {senderRows.map((row, idx) => (
                    <div key={idx} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-100">Sender {idx + 1}</div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSender(idx)}
                          disabled={senderRows.length === 1}
                          className="text-xs text-rose-600 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>

                      <select
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                        value={row.savedSenderKey || ''}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (!value) {
                            const preservedThrottle = {
                              interval_min_sec: row.interval_min_sec,
                              interval_max_sec: row.interval_max_sec,
                              burst_pause_enabled: row.burst_pause_enabled,
                              pause_every_min_sends: row.pause_every_min_sends,
                              pause_every_max_sends: row.pause_every_max_sends,
                              pause_min_minutes: row.pause_min_minutes,
                              pause_max_minutes: row.pause_max_minutes,
                              max_sends_per_sender: row.max_sends_per_sender
                            };
                            updateSender(idx, { ...emptySender(), ...preservedThrottle });
                            return;
                          }
                          handleSenderPick(idx, value);
                        }}
                      >
                        <option value="">Load from saved senders…</option>
                        {sendersList.map((sender) => (
                          <option key={sender.rowKey || sender.id} value={sender.rowKey || sender.id}>
                            {(sender.sender_name || sender.from_name || '') + ' <' + (sender.sender_email || sender.from_address || '') + '>'}
                          </option>
                        ))}
                      </select>

                      <div className="grid md:grid-cols-2 gap-3">
                        <input
                          placeholder="From email"
                          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                          value={row.from_address}
                          onChange={(event) => updateSender(idx, { from_address: event.target.value })}
                        />
                        <input
                          placeholder="From name"
                          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                          value={row.from_name}
                          onChange={(event) => updateSender(idx, { from_name: event.target.value })}
                        />
                        <input
                          placeholder="Email signature"
                          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                          value={row.email_signature || ''}
                          onChange={(event) => updateSender(idx, { email_signature: event.target.value })}
                        />
                        <input
                          placeholder="Mailgun domain"
                          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                          value={row.domain}
                          onChange={(event) => updateSender(idx, { domain: event.target.value })}
                        />
                        <input
                          placeholder="Mailgun base URL"
                          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                          value={row.base_url}
                          onChange={(event) => updateSender(idx, { base_url: event.target.value })}
                        />
                      </div>

                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900 space-y-3">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-100">Throttling</div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Max sends for this sender (total)</label>
                          <input
                            type="number"
                            min={0}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                            value={row.max_sends_per_sender}
                            onChange={(event) => updateSender(idx, { max_sends_per_sender: event.target.value })}
                          />
                          <p className="mt-1 text-xs text-slate-500">
                            Use <span className="font-mono">0</span> for no per-sender cap (only the campaign max above applies).
                          </p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Interval min (seconds)</label>
                            <input
                              type="number"
                              min={0}
                              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                              value={row.interval_min_sec}
                              onChange={(event) => updateSender(idx, { interval_min_sec: event.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Interval max (seconds)</label>
                            <input
                              type="number"
                              min={0}
                              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                              value={row.interval_max_sec}
                              onChange={(event) => updateSender(idx, { interval_max_sec: event.target.value })}
                            />
                          </div>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={row.burst_pause_enabled}
                            onChange={(event) => updateSender(idx, { burst_pause_enabled: event.target.checked })}
                          />
                          Enable burst pause for this sender
                        </label>

                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Pause after every N successful sends (min/max)</label>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                min={1}
                                className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                                value={row.pause_every_min_sends}
                                onChange={(event) => updateSender(idx, { pause_every_min_sends: event.target.value })}
                                disabled={!row.burst_pause_enabled}
                              />
                              <input
                                type="number"
                                min={1}
                                className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                                value={row.pause_every_max_sends}
                                onChange={(event) => updateSender(idx, { pause_every_max_sends: event.target.value })}
                                disabled={!row.burst_pause_enabled}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Pause length in minutes (min/max)</label>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                min={1}
                                className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                                value={row.pause_min_minutes}
                                onChange={(event) => updateSender(idx, { pause_min_minutes: event.target.value })}
                                disabled={!row.burst_pause_enabled}
                              />
                              <input
                                type="number"
                                min={1}
                                className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                                value={row.pause_max_minutes}
                                onChange={(event) => updateSender(idx, { pause_max_minutes: event.target.value })}
                                disabled={!row.burst_pause_enabled}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </section>

                <button
                  type="button"
                  disabled={starting}
                  onClick={handleStart}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50"
                >
                  {starting ? 'Starting…' : 'Start Snowflake Mailgun Send'}
                </button>

                {lastStartedCampaignId ? (
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
                    Campaign started: <span className="font-mono text-xs">{lastStartedCampaignId}</span>. Watch it on{' '}
                    <Link className="underline" to="/admin/mailgun-campaign-operations">
                      Mailgun Campaign Operations
                    </Link>
                    .
                  </div>
                ) : null}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
