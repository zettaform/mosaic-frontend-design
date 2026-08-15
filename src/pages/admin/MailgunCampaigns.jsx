import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import { useToast } from '../../contexts/ToastContext';
import backendAuthService from '../../services/backendAuthService';
import adminApiService from '../../services/adminApiService';
import promptTemplatesService from '../../services/promptTemplatesService';
import { getApiUrl } from '../../utils/getBackendUrl';

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_URL || '').trim();
}

const DEFAULT_MAILGUN_BASE = 'https://api.mailgun.net';
const FIXED_MAILGUN_SECRET_NAME = 'growcial-mailgun-token';
/** Merge tags applied server-side (comma-separated in API); matches AI JSON + built-ins. */
const MERGE_TAGS_SUBJECT =
  'subject_line,introduction,body_text,last_para,ig_login,ig_name,prospect_email,unsubscribe_url';
const MERGE_TAGS_BODY =
  'subject_line,introduction,body_text,last_para,ig_login,ig_name,prospect_email,unsubscribe_url';

function emptySender() {
  return {
    savedSenderKey: '',
    from_address: '',
    from_name: '',
    domain: '',
    base_url: '',
    interval_seconds: 30,
    max_per_hour: 80,
    max_per_day: 400
  };
}

export default function MailgunCampaigns() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const { success, error } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const [savedTables, setSavedTables] = useState([]);
  const [savedTableRowKey, setSavedTableRowKey] = useState('');

  const [targetValidSends, setTargetValidSends] = useState(0);
  const [modelId, setModelId] = useState('');
  const [models, setModels] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [promptInstructions, setPromptInstructions] = useState('');

  const [subjectTemplate, setSubjectTemplate] = useState('{{subject_line}}');
  const [bodyTemplate, setBodyTemplate] = useState(
    '{{introduction}}\n\n{{body_text}}\n\n{{last_para}}\n\nUnsubscribe: {{unsubscribe_url}}'
  );
  const [phoneNumbersOnly, setPhoneNumbersOnly] = useState(false);
  const [skipEmailVerification, setSkipEmailVerification] = useState(false);
  const [millionverifierTimeout, setMillionverifierTimeout] = useState(10);
  const [requestsPerSecond, setRequestsPerSecond] = useState(1);

  const [sendersList, setSendersList] = useState([]);
  const [senderRows, setSenderRows] = useState([emptySender()]);

  const loadSendersList = useCallback(async () => {
    try {
      const token = backendAuthService.getSessionToken();
      const url = getApiUrl(`/mailgun/senders?secretName=${encodeURIComponent(FIXED_MAILGUN_SECRET_NAME)}`);
      const mgRes = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const mgJson = await mgRes.json().catch(() => ({}));
      if (mgRes.ok && mgJson.success) setSendersList(mgJson.items || []);
      else setSendersList([]);
    } catch (e) {
      console.error(e);
      setSendersList([]);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const token = backendAuthService.getSessionToken();
      const base = getApiBaseUrl();
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      const [stRes, mRes, tplRes] = await Promise.all([
        fetch(`${base}/api/snowflake/saved-tables`, { headers }),
        adminApiService.getOpenAIModels(),
        promptTemplatesService.getTemplates(user?.email)
      ]);

      const stJson = await stRes.json().catch(() => ({}));
      if (stRes.ok && stJson.success) setSavedTables(stJson.tables || []);

      const modList = mRes?.models ?? mRes?.data ?? [];
      if (mRes?.success && Array.isArray(modList)) {
        setModels(modList);
        if (modList.length && !modelId) setModelId(modList[0].id || modList[0].model || '');
      }

      if (tplRes?.success && Array.isArray(tplRes.templates)) {
        setTemplates(tplRes.templates);
      }
    } catch (e) {
      console.error(e);
      error(e.message || 'Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  }, [error, modelId, user?.email]);

  useEffect(() => {
    if (user?.email) loadAll();
  }, [user?.email, loadAll]);

  useEffect(() => {
    if (user?.email) loadSendersList();
  }, [user?.email, loadSendersList]);

  useEffect(() => {
    const t = templates.find((x) => x.id === templateId || x.rowKey === templateId);
    if (t?.content) setPromptInstructions(t.content);
  }, [templateId, templates]);

  const tableOptions = useMemo(
    () =>
      savedTables.map((t) => ({
        key: t.rowKey,
        label: `${t.table_name} · ${t.database_name}.${t.schema_name}`
      })),
    [savedTables]
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

  const handleAddSenderRow = () => setSenderRows((r) => [...r, emptySender()]);

  const handleSenderPick = (idx, rowKey) => {
    const item = sendersList.find((s) => String(s.rowKey || s.id) === String(rowKey));
    if (!item) return;
    setSenderRows((rows) => {
      const next = [...rows];
      next[idx] = {
        ...next[idx],
        savedSenderKey: rowKey,
        from_address: item.sender_email || item.from_address || item.fromEmail || '',
        from_name: item.sender_name || item.from_name || item.fromName || '',
        domain: item.domain_name || item.domain || '',
        base_url: (item.base_url || DEFAULT_MAILGUN_BASE).trim() || DEFAULT_MAILGUN_BASE
      };
      return next;
    });
  };

  const handleStart = async () => {
    if (!savedTableRowKey) return error('Choose a saved Snowflake table');
    if (!promptInstructions.trim()) return error('Prompt instructions are required (pick a template or paste)');
    if (!modelId) return error('Select an OpenAI model');
    setStarting(true);
    try {
      const base = getApiBaseUrl();
      const token = backendAuthService.getSessionToken();
      const resp = await fetch(`${base}/api/admin/mailgun/campaigns`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          savedTableRowKey,
          targetRows: Math.max(0, parseInt(targetValidSends, 10) || 0),
          modelId,
          promptInstructions,
          phoneNumbersOnly,
          skipEmailVerification: phoneNumbersOnly ? false : skipEmailVerification,
          subjectTemplate,
          bodyTemplate,
          mergeTagsSubject: MERGE_TAGS_SUBJECT,
          mergeTagsBody: MERGE_TAGS_BODY,
          millionverifierTimeout,
          requestsPerSecond,
          mailgunSecretName: FIXED_MAILGUN_SECRET_NAME
        })
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok || !json?.success) {
        throw new Error(json?.error || `Start failed (HTTP ${resp.status})`);
      }
      success(`Campaign started (${json.campaignId})`);
    } catch (e) {
      console.error(e);
      error(e.message || 'Failed to start');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-5xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">Mailgun Campaigns</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Choose a <Link className="text-indigo-600 dark:text-indigo-400 underline" to="/saved-tables">saved Snowflake table</Link>
                . The <span className="font-medium">first column</span> must be the user id used by the Mediafy user-info and Instagram caption APIs. When phone mode is enabled, the table must also include a <span className="font-mono">PHONE</span> column. This run adds four Snowflake columns to the selected table in order:
                <span className="font-mono"> mailgun_userinfo_json</span>,
                <span className="font-mono"> mailgun_millionverifier_flag</span>,
                <span className="font-mono"> mailgun_instagram_json</span>, and
                <span className="font-mono"> mailgun_ai_output_json</span>. Mailgun sending is intentionally skipped for now. Progress streams live on{' '}
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
                    onChange={(e) => setSavedTableRowKey(e.target.value)}
                  >
                    <option value="">Select saved table…</option>
                    {tableOptions.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Rows to enrich</label>
                      <input
                        type="number"
                        min={0}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                        value={targetValidSends}
                        onChange={(e) => setTargetValidSends(parseInt(e.target.value, 10) || 0)}
                      />
                      <p className="mt-1 text-xs text-slate-500">Use `0` to process the full selected table.</p>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">MillionVerifier timeout (sec)</label>
                      <input
                        type="number"
                        min={5}
                        max={30}
                        disabled={skipEmailVerification || phoneNumbersOnly}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                        value={millionverifierTimeout}
                        onChange={(e) => setMillionverifierTimeout(parseInt(e.target.value, 10) || 10)}
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        {phoneNumbersOnly
                          ? 'Disabled because phone-number validation is being used for this run.'
                          : skipEmailVerification
                            ? 'Disabled because email verification is being skipped for this run.'
                            : 'Only used when MillionVerifier is enabled.'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-300 mb-2">Recipient validation</label>
                      <label className="inline-flex items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-900 mb-3">
                        <input
                          type="checkbox"
                          className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={phoneNumbersOnly}
                          onChange={(e) => setPhoneNumbersOnly(e.target.checked)}
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-200">
                          <span className="font-medium">Phone numbers only</span>
                          <span className="block mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Ignore email verification. Use the table's <span className="font-mono">PHONE</span> column, remove the leading <span className="font-mono">+</span>, validate the phone first, and only then continue to user info, captions, and AI output.
                          </span>
                        </span>
                      </label>
                      <label className="inline-flex items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-900">
                        <input
                          type="checkbox"
                          className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={skipEmailVerification}
                          disabled={phoneNumbersOnly}
                          onChange={(e) => setSkipEmailVerification(e.target.checked)}
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-200">
                          <span className="font-medium">Skip email verification</span>
                          <span className="block mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {phoneNumbersOnly
                              ? 'Disabled while phone-number validation mode is enabled.'
                              : 'When enabled, rows with an email bypass MillionVerifier and continue directly to caption fetch and AI generation.'}
                          </span>
                        </span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Requests per second</label>
                      <input
                        type="number"
                        min={1}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                        value={requestsPerSecond}
                        onChange={(e) => setRequestsPerSecond(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      />
                      <p className="mt-1 text-xs text-slate-500">Fire-and-forget dispatch rate. Default is `1` request per second.</p>
                    </div>
                  </div>
                </section>

                <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
                  <h2 className="font-semibold text-slate-800 dark:text-slate-100">2. Prompt & model</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Prompt template</label>
                      <select
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                        value={templateId}
                        onChange={(e) => setTemplateId(e.target.value)}
                      >
                        <option value="">Custom only (edit box)</option>
                        {templates.map((t) => (
                          <option key={t.id || t.rowKey} value={t.id || t.rowKey}>
                            {t.name || t.id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">OpenAI model</label>
                      <select
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                        value={modelId}
                        onChange={(e) => setModelId(e.target.value)}
                      >
                        <option value="">Select…</option>
                        {models.map((m) => {
                          const id = m.id || m.model;
                          return (
                            <option key={id} value={id}>
                              {m.name || id}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                      Instructions (must ask for JSON: subject_line, introduction, body_text, last_para)
                    </label>
                    <textarea
                      className="w-full min-h-[160px] rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900"
                      value={promptInstructions}
                      onChange={(e) => setPromptInstructions(e.target.value)}
                      placeholder="Describe the outreach goal. The in-app runner wraps this with strict JSON-only system instructions."
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    This step stores endpoint 1, validation status, endpoint 2, and AI results back into Snowflake. Endpoint 2 and AI are only executed when the validation flag is `valid`.
                  </p>
                </section>

                <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
                  <h2 className="font-semibold text-slate-800 dark:text-slate-100">3. Email subject & body (later step)</h2>
                  <p className="text-xs text-slate-500">
                    Plain text only. Placeholders use {'{{name}}'} syntax (filled from AI JSON keys such as{' '}
                    <span className="font-mono">subject_line</span>, <span className="font-mono">body_text</span>, plus built-ins{' '}
                    <span className="font-mono">prospect_email</span>, <span className="font-mono">unsubscribe_url</span>, etc.).
                  </p>
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Subject line</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                      value={subjectTemplate}
                      onChange={(e) => setSubjectTemplate(e.target.value)}
                      placeholder="{{subject_line}}"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Body</label>
                    <textarea
                      className="w-full min-h-[220px] rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-xs font-mono"
                      value={bodyTemplate}
                      onChange={(e) => setBodyTemplate(e.target.value)}
                      placeholder="Multi-line body with {{placeholders}}"
                    />
                  </div>
                </section>

                <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-slate-800 dark:text-slate-100">4. Senders & rate limits (later step)</h2>
                    <button
                      type="button"
                      onClick={handleAddSenderRow}
                      className="text-sm text-indigo-600 dark:text-indigo-400"
                    >
                      + Add sender
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    This campaign always uses the shared vault secret{' '}
                    <span className="font-mono">{FIXED_MAILGUN_SECRET_NAME}</span>. Pick a saved sender tied to that Mailgun account. That fills from email, from name, Mailgun domain, and API base (defaults to{' '}
                    <span className="font-mono">{DEFAULT_MAILGUN_BASE}</span>). Manage domains on{' '}
                    <Link className="text-indigo-600 dark:text-indigo-400 underline" to="/admin/mailgun-domains">
                      Mailgun Domains
                    </Link>
                    . Multiple sender rows are supported and will be throttled independently.
                  </p>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
                    Mailgun vault secret: <span className="font-mono">{FIXED_MAILGUN_SECRET_NAME}</span>
                  </div>
                  {senderRows.map((row, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 grid md:grid-cols-2 gap-3 text-sm"
                    >
                      <select
                        className="rounded border border-slate-300 dark:border-slate-600 px-2 py-1 md:col-span-2"
                        value={row.savedSenderKey || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v) handleSenderPick(idx, v);
                          else
                            setSenderRows((r) => {
                              const n = [...r];
                              const cur = n[idx];
                              n[idx] = {
                                ...emptySender(),
                                interval_seconds: cur.interval_seconds,
                                max_per_hour: cur.max_per_hour,
                                max_per_day: cur.max_per_day
                              };
                              return n;
                            });
                        }}
                      >
                        <option value="">Load from saved senders…</option>
                        {sendersList.map((s) => (
                          <option key={s.rowKey || s.id} value={s.rowKey || s.id}>
                            {(s.sender_name || s.from_name || '') + ' <' + (s.sender_email || s.from_address || '') + '>'}
                          </option>
                        ))}
                      </select>
                      <input
                        placeholder="From email"
                        className="rounded border px-2 py-1"
                        value={row.from_address}
                        onChange={(e) =>
                          setSenderRows((r) => {
                            const n = [...r];
                            n[idx] = { ...n[idx], from_address: e.target.value };
                            return n;
                          })
                        }
                      />
                      <input
                        placeholder="From name"
                        className="rounded border px-2 py-1"
                        value={row.from_name}
                        onChange={(e) =>
                          setSenderRows((r) => {
                            const n = [...r];
                            n[idx] = { ...n[idx], from_name: e.target.value };
                            return n;
                          })
                        }
                      />
                      <input
                        placeholder="Mailgun domain"
                        className="rounded border px-2 py-1"
                        value={row.domain}
                        onChange={(e) =>
                          setSenderRows((r) => {
                            const n = [...r];
                            n[idx] = { ...n[idx], domain: e.target.value };
                            return n;
                          })
                        }
                      />
                      <input
                        placeholder="API base (optional)"
                        className="rounded border px-2 py-1"
                        value={row.base_url}
                        onChange={(e) =>
                          setSenderRows((r) => {
                            const n = [...r];
                            n[idx] = { ...n[idx], base_url: e.target.value };
                            return n;
                          })
                        }
                      />
                      <div className="flex gap-2 flex-wrap md:col-span-2">
                        <label className="text-xs text-slate-500">
                          interval s
                          <input
                            type="number"
                            className="ml-1 w-16 border rounded px-1"
                            value={row.interval_seconds}
                            onChange={(e) =>
                              setSenderRows((r) => {
                                const n = [...r];
                                n[idx] = { ...n[idx], interval_seconds: e.target.value };
                                return n;
                              })
                            }
                          />
                        </label>
                        <label className="text-xs text-slate-500">
                          /hour
                          <input
                            type="number"
                            className="ml-1 w-16 border rounded px-1"
                            value={row.max_per_hour}
                            onChange={(e) =>
                              setSenderRows((r) => {
                                const n = [...r];
                                n[idx] = { ...n[idx], max_per_hour: e.target.value };
                                return n;
                              })
                            }
                          />
                        </label>
                        <label className="text-xs text-slate-500">
                          /day
                          <input
                            type="number"
                            className="ml-1 w-16 border rounded px-1"
                            value={row.max_per_day}
                            onChange={(e) =>
                              setSenderRows((r) => {
                                const n = [...r];
                                n[idx] = { ...n[idx], max_per_day: e.target.value };
                                return n;
                              })
                            }
                          />
                        </label>
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
                  {starting ? 'Starting…' : 'Start Snowflake enrichment'}
                </button>

                <p className="text-xs text-slate-500">
                  Enrichment execution happens inside the API server. Start it here, then watch live processing on{' '}
                  <Link className="text-indigo-600 dark:text-indigo-400 underline" to="/admin/mailgun-campaign-operations">
                    Mailgun Campaign Operations
                  </Link>
                  .
                </p>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
