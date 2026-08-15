import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import { useToast } from '../../contexts/ToastContext';
import backendAuthService from '../../services/backendAuthService';

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_URL || '').trim();
}

function htmlToPlainText(html) {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body?.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
  } catch {
    return '';
  }
}

function extractJsonFromText(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return null;

  const raw = value.trim();
  if (!raw) return null;

  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenceMatch?.[1]?.trim() || raw;

  try {
    return JSON.parse(candidate);
  } catch {
    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const sub = candidate.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(sub);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function applyPlaceholders(template, values) {
  const str = String(template || '');
  return str.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_m, key) => {
    const v = values?.[key];
    if (v === null || v === undefined) return `{{${key}}}`;
    return String(v);
  });
}

export default function DurableSendgrid() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const { success, error } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Templates + sender
  const [fromAddress, setFromAddress] = useState('dan@mymailgram.com');
  const [fromName, setFromName] = useState('Dan from MyMailGram');
  const [subjectTemplate, setSubjectTemplate] = useState('{{subject_line}}');
  const [htmlTemplate, setHtmlTemplate] = useState(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{subject_line}}</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000000; line-height: 1.6;">



  <p>
    {{introduction}}
  </p>

  <p>
    {{body_text}}
  </p>

  <p>
    {{last_para}}
  </p>

  <p>
    Best,<br>
    Daniel Melnick, <br>
    https://mymailgram.com
  </p>

  <p style="margin-top: 30px; font-size: 12px; color: #555555;">
    <a href="{{unsubscribe_url}}" style="color: #555555; text-decoration: underline;">
      Unsubscribe
    </a>
  </p>

</body>
</html>`);
  const [autoPlainText, setAutoPlainText] = useState(true);
  const [plainTextTemplate, setPlainTextTemplate] = useState('');

  // Interval controls
  const [intervalMinSec, setIntervalMinSec] = useState(10);
  const [intervalMaxSec, setIntervalMaxSec] = useState(20);

  // File + parsing
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [emailColumn, setEmailColumn] = useState('');
  const [jsonColumn, setJsonColumn] = useState('');

  // Placeholder mapping: template placeholder -> key in JSON column
  const [placeholderToJsonKey, setPlaceholderToJsonKey] = useState({});

  // Durable run
  const [starting, setStarting] = useState(false);
  const [instanceInfo, setInstanceInfo] = useState(null); // { instance_id }
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

  const placeholdersInTemplates = useMemo(() => {
    const combined = `${subjectTemplate || ''}\n${htmlTemplate || ''}\n${plainTextTemplate || ''}`;
    const re = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
    const keys = new Set();
    let m;
    while ((m = re.exec(combined))) keys.add(m[1]);
    return Array.from(keys).sort();
  }, [subjectTemplate, htmlTemplate, plainTextTemplate]);

  const sampleRow = useMemo(() => (rows?.length ? rows[0] : null), [rows]);
  const sampleJson = useMemo(() => {
    if (!sampleRow || !jsonColumn) return null;
    return extractJsonFromText(sampleRow?.[jsonColumn]);
  }, [sampleRow, jsonColumn]);

  const jsonKeys = useMemo(() => {
    if (!sampleJson || typeof sampleJson !== 'object') return [];
    return Object.keys(sampleJson).sort();
  }, [sampleJson]);

  // Keep plain text template in sync when auto mode is on
  useEffect(() => {
    if (!autoPlainText) return;
    setPlainTextTemplate(htmlToPlainText(htmlTemplate));
  }, [htmlTemplate, autoPlainText]);

  // Best-effort mapping defaults: placeholder -> same key if exists in JSON
  useEffect(() => {
    if (!placeholdersInTemplates.length) return;
    if (!jsonKeys.length) return;
    setPlaceholderToJsonKey((prev) => {
      const next = { ...(prev || {}) };
      let changed = false;
      placeholdersInTemplates.forEach((k) => {
        if (next[k]) return;
        if (jsonKeys.includes(k)) {
          next[k] = k;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [placeholdersInTemplates, jsonKeys]);

  const getValuesForRow = (row) => {
    const values = {};
    // 1) From the row JSON column (Generated Text)
    const parsed = jsonColumn ? extractJsonFromText(row?.[jsonColumn]) : null;
    if (parsed && typeof parsed === 'object') {
      Object.entries(parsed).forEach(([k, v]) => {
        if (v === null || v === undefined) return;
        values[k] = v;
      });
    }
    // 2) Also expose raw row columns by normalized keys (useful in templates)
    Object.entries(row || {}).forEach(([k, v]) => {
      const nk = String(k || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      if (!nk) return;
      if (values[nk] === undefined) values[nk] = v;
    });

    // 2b) Auto-build unsubscribe_url from the XLSX "Public Email" column (normalized: public_email)
    // Requested format: mymailgram.com/unsubscribe/{public_email}
    if (values.unsubscribe_url === undefined || values.unsubscribe_url === null || String(values.unsubscribe_url).trim() === '') {
      const publicEmail = String(values.public_email || '').trim() || String(values.publicemail || '').trim() || String(values.email || '').trim();
      if (publicEmail) {
        values.unsubscribe_url = `https://mymailgram.com/unsubscribe/${encodeURIComponent(publicEmail)}`;
      }
    }
    // 3) Apply mapping overrides: placeholder -> jsonKey
    placeholdersInTemplates.forEach((ph) => {
      const mapped = placeholderToJsonKey?.[ph];
      if (!mapped) return;
      if (values[ph] !== undefined) return;
      if (parsed && typeof parsed === 'object' && Object.prototype.hasOwnProperty.call(parsed, mapped)) {
        values[ph] = parsed[mapped];
      }
    });
    return values;
  };

  const previewValues = useMemo(() => getValuesForRow(sampleRow || {}), [sampleRow, jsonColumn, placeholderToJsonKey, placeholdersInTemplates]);
  const previewSubject = useMemo(() => applyPlaceholders(subjectTemplate, previewValues), [subjectTemplate, previewValues]);
  const previewHtml = useMemo(() => applyPlaceholders(htmlTemplate, previewValues), [htmlTemplate, previewValues]);
  const previewPlainText = useMemo(() => applyPlaceholders(plainTextTemplate, previewValues), [plainTextTemplate, previewValues]);

  const handleFile = async (f) => {
    setFile(f || null);
    setFileName(f?.name || '');
    setRows([]);
    setHeaders([]);
    setEmailColumn('');
    setJsonColumn('');
    setInstanceInfo(null);
    setStatus(null);

    if (!f) return;
    try {
      const arrayBuffer = await f.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!Array.isArray(json) || json.length === 0) throw new Error('No rows found in file.');

      const hdrs = Object.keys(json[0] || {});
      setHeaders(hdrs);
      setRows(json);

      const lower = hdrs.map((h) => ({ h, l: String(h).toLowerCase() }));
      const guessEmail = lower.find((x) => x.l === 'public email' || x.l.includes('email'))?.h;
      const guessJson = lower.find((x) => x.l === 'generated text' || x.l.includes('generated text') || x.l.includes('json'))?.h;
      if (guessEmail) setEmailColumn(guessEmail);
      if (guessJson) setJsonColumn(guessJson);

      success(`Loaded ${json.length} rows from ${f.name}.`);
    } catch (e) {
      console.error(e);
      error(e.message || 'Failed to read file');
    }
  };

  const fetchStatusViaServer = async (instance_id) => {
    const base = getApiBaseUrl();
    const token = backendAuthService.getSessionToken();
    if (!token) throw new Error('Not authenticated');
    const resp = await fetch(`${base}/api/admin/sendgrid/durable/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ instance_id }),
    });
    const json = await resp.json().catch(() => null);
    if (!resp.ok || !json?.success) throw new Error(json?.error || `Status fetch failed (HTTP ${resp.status})`);
    return json.status;
  };

  const refreshStatus = async () => {
    if (!instanceInfo?.instance_id) return;
    setStatusLoading(true);
    try {
      const s = await fetchStatusViaServer(instanceInfo.instance_id);
      setStatus(s);
    } catch (e) {
      console.error(e);
      error(e.message || 'Failed to fetch status');
    } finally {
      setStatusLoading(false);
    }
  };

  // Auto-poll status while running
  useEffect(() => {
    if (!instanceInfo?.instance_id) return;
    let mounted = true;
    const tick = async () => {
      if (!mounted) return;
      try {
        const s = await fetchStatusViaServer(instanceInfo.instance_id);
        if (!mounted) return;
        setStatus(s);
      } catch {
        // ignore transient polling failures
      }
    };
    tick();
    const id = setInterval(() => tick(), 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [instanceInfo?.instance_id]);

  const handleStartDurable = async () => {
    if (!file) return error('Upload an .xlsx file first.');
    if (!emailColumn) return error('Select the email column.');
    if (!jsonColumn) return error('Select the JSON (Generated Text) column.');
    if (!fromAddress.trim() || !fromName.trim()) return error('From name + from address are required.');
    if (!subjectTemplate.trim()) return error('Subject template is required.');
    if (!htmlTemplate.trim()) return error('HTML template is required.');

    const min = Math.max(0, parseInt(intervalMinSec, 10) || 0);
    const max = Math.max(min, parseInt(intervalMaxSec, 10) || 0);

    setStarting(true);
    setInstanceInfo(null);
    setStatus(null);
    try {
      const base = getApiBaseUrl();
      const token = backendAuthService.getSessionToken();
      if (!token) return error('Not authenticated');
      const form = new FormData();
      form.append('file', file);
      form.append('fromAddress', fromAddress.trim());
      form.append('fromName', fromName.trim());
      form.append('subjectTemplate', subjectTemplate);
      form.append('htmlTemplate', htmlTemplate);
      form.append('plainTextTemplate', plainTextTemplate || '');
      form.append('emailColumn', emailColumn);
      form.append('jsonColumn', jsonColumn);
      form.append('intervalMinSec', String(min));
      form.append('intervalMaxSec', String(max));
      form.append('placeholderToJsonKey', JSON.stringify(placeholderToJsonKey || {}));

      const resp = await fetch(`${base}/api/admin/sendgrid/durable/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok || !json?.success) {
        const baseMsg = json?.error || `Start failed (HTTP ${resp.status})`;
        const detailsMsg =
          json?.details?.message ||
          json?.details?.error ||
          (typeof json?.details?.raw === 'string' ? json.details.raw : '') ||
          '';
        throw new Error(detailsMsg ? `${baseMsg}: ${detailsMsg}` : baseMsg);
      }
      setInstanceInfo(json);
      success(`Started durable-sendgrid (instance: ${json.instance_id})`);
    } catch (e) {
      console.error(e);
      error(e.message || 'Failed to start durable send');
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
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">Durable SendGrid</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Upload an Excel file, render <span className="font-medium">{'{{placeholders}}'}</span> from column H (JSON), and send via SendGrid SMTP on a durable interval.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Upload recipients (.xlsx)</label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => handleFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-slate-700 dark:text-slate-200"
                    />
                    {fileName ? (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Loaded: <span className="font-medium">{fileName}</span> ({rows.length} rows)
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2">
                      <select
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                        value={emailColumn}
                        onChange={(e) => setEmailColumn(e.target.value)}
                        disabled={!headers.length}
                      >
                        <option value="">Email column…</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <select
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                        value={jsonColumn}
                        onChange={(e) => setJsonColumn(e.target.value)}
                        disabled={!headers.length}
                      >
                        <option value="">JSON column (Generated Text)…</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Sample JSON keys: <span className="font-medium">{jsonKeys.length}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">From (email)</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                      value={fromAddress}
                      onChange={(e) => setFromAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">From name</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Subject (template)</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                    value={subjectTemplate}
                    onChange={(e) => setSubjectTemplate(e.target.value)}
                    placeholder="Example: {{subject_line}}"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">HTML (template)</label>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Uses {'{{placeholder}}'} syntax</div>
                  </div>
                  <textarea
                    className="w-full h-56 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                    value={htmlTemplate}
                    onChange={(e) => setHtmlTemplate(e.target.value)}
                    placeholder="<h1>{{introduction}}</h1> ..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Plain text (template)</label>
                    <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={autoPlainText}
                        onChange={(e) => {
                          const on = e.target.checked;
                          setAutoPlainText(on);
                          if (on) setPlainTextTemplate(htmlToPlainText(htmlTemplate));
                        }}
                      />
                      Auto-generate
                    </label>
                  </div>
                  <textarea
                    className="w-full h-28 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                    value={plainTextTemplate}
                    onChange={(e) => setPlainTextTemplate(e.target.value)}
                    disabled={autoPlainText}
                  />
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-5 space-y-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Placeholder mapping</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Map template placeholders to keys from the JSON column (Generated Text).</div>
                  </div>

                  {placeholdersInTemplates.length === 0 ? (
                    <div className="text-xs text-slate-500 dark:text-slate-400">No placeholders found yet.</div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {placeholdersInTemplates.map((k) => (
                        <div key={k} className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                          <div className="text-xs font-mono text-slate-700 dark:text-slate-200">
                            {'{{'}
                            {k}
                            {'}}'}
                          </div>
                          <select
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                            value={placeholderToJsonKey?.[k] || ''}
                            onChange={(e) => setPlaceholderToJsonKey((prev) => ({ ...(prev || {}), [k]: e.target.value }))}
                            disabled={!jsonKeys.length}
                          >
                            <option value="">— (use same key / best-effort) —</option>
                            {jsonKeys.map((jk) => (
                              <option key={jk} value={jk}>
                                {jk}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-5 space-y-4">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Interval</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Min seconds</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                        value={intervalMinSec}
                        onChange={(e) => setIntervalMinSec(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Max seconds</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                        value={intervalMaxSec}
                        onChange={(e) => setIntervalMaxSec(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartDurable}
                    disabled={starting}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 text-sm font-medium w-full"
                  >
                    {starting ? 'Starting durable-sendgrid…' : 'Start durable-sendgrid'}
                  </button>

                  {instanceInfo?.instance_id ? (
                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      <div>
                        Instance: <span className="font-mono">{instanceInfo.instance_id}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Status is fetched via the server (the Azure durable status URL contains a secret `code=...` token and is not shown in the browser).
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={refreshStatus}
                          disabled={statusLoading}
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-xs font-medium"
                        >
                          {statusLoading ? 'Refreshing…' : 'Refresh status'}
                        </button>
                        {status?.runtimeStatus ? <div className="text-xs text-slate-500 dark:text-slate-400">Runtime: {status.runtimeStatus}</div> : null}
                      </div>
                      {status?.customStatus ? (
                        <pre className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-[11px] text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                          {JSON.stringify(status.customStatus, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Right: Preview */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Preview (row 1)</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Subject: <span className="font-medium">{previewSubject || '—'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(previewHtml);
                        success('Copied rendered HTML to clipboard');
                      } catch {
                        error('Failed to copy HTML');
                      }
                    }}
                    className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium"
                    disabled={!previewHtml}
                  >
                    Copy rendered HTML
                  </button>
                </div>

                <div className="mb-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Plain text preview (rendered):</div>
                  <pre className="mt-1 max-h-24 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-[11px] text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                    {previewPlainText || '—'}
                  </pre>
                </div>

                <iframe
                  title="Email preview"
                  className="w-full h-[62vh] rounded-lg border border-slate-200 dark:border-slate-700 bg-white"
                  srcDoc={previewHtml || '<div style="font-family: Arial; padding: 16px; color:#64748b;">Upload a file and fill in a template to preview.</div>'}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


