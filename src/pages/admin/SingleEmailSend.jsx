import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import { useToast } from '../../contexts/ToastContext';
import { getEmailTemplates } from '../../data/emailTemplates';

function getAdminKey() {
  try {
    // SECURITY: do not ship a hardcoded default admin key in the frontend bundle.
    return (localStorage.getItem('admin_key') || window.ADMIN_KEY || '').trim();
  } catch {
    return String(window.ADMIN_KEY || '').trim();
  }
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

function normalizeKey(key) {
  return String(key || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Signature behavior: match SendGridEmailSend.jsx
const DEFAULT_SIGNATURE_TEXT = '\n\nBest,\nDaniel Melnick';
const DEFAULT_SIGNATURE_HTML = '<br><br>Best,<br>Daniel Melnick';

function appendTextSignature(input) {
  const s = String(input || '');
  const trimmed = s.trim();
  if (!trimmed) return '';
  const alreadyHas = trimmed.trimEnd().endsWith(DEFAULT_SIGNATURE_TEXT.trim());
  return alreadyHas ? trimmed : `${trimmed}${DEFAULT_SIGNATURE_TEXT}`;
}

function appendHtmlSignature(input) {
  const s = String(input || '');
  const trimmed = s.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();
  const signatureVariants = ['best,<br>daniel melnick', 'best,<br/>daniel melnick', 'best,<br />daniel melnick'];
  const lowerNoWsEnd = lower.replace(/\s+$/g, '');
  if (signatureVariants.some((v) => lowerNoWsEnd.endsWith(v))) return trimmed;

  const bodyCloseIdx = lower.lastIndexOf('</body>');
  if (bodyCloseIdx !== -1) {
    const before = trimmed.slice(0, bodyCloseIdx).trimEnd();
    const after = trimmed.slice(bodyCloseIdx);
    const beforeLower = before.toLowerCase().replace(/\s+$/g, '');
    if (signatureVariants.some((v) => beforeLower.endsWith(v))) return `${before}${after}`;
    return `${before}${DEFAULT_SIGNATURE_HTML}${after}`;
  }

  return `${trimmed}${DEFAULT_SIGNATURE_HTML}`;
}

function randomIntInclusive(min, max) {
  const a = Math.ceil(min);
  const b = Math.floor(max);
  if (b <= a) return a;
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

export default function SingleEmailSend() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const { success, error } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState('single'); // 'single' | 'batch'

  // Wake Lock (enterprise keep-awake)
  const [keepAwakeEnabled, setKeepAwakeEnabled] = useState(true);
  const wakeLockRef = useRef(null);

  const requestWakeLock = async () => {
    try {
      if (!keepAwakeEnabled) return;
      if (!('wakeLock' in navigator)) return;
      if (wakeLockRef.current) return;
      // @ts-ignore
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null;
      });
    } catch {
      // best effort
      wakeLockRef.current = null;
    }
  };

  const releaseWakeLock = async () => {
    try {
      if (wakeLockRef.current) await wakeLockRef.current.release();
    } catch {
      // ignore
    } finally {
      wakeLockRef.current = null;
    }
  };

  const templates = useMemo(() => getEmailTemplates(), []);
  const templateById = useMemo(() => {
    const map = new Map();
    templates.forEach(t => map.set(t.id, t));
    return map;
  }, [templates]);

  const grouped = useMemo(() => {
    return templates.reduce((acc, tpl) => {
      const key = tpl.category || 'Other';
      acc[key] = acc[key] || [];
      acc[key].push(tpl);
      return acc;
    }, {});
  }, [templates]);

  const [toEmail, setToEmail] = useState('');
  const [toFirstName, setToFirstName] = useState('');
  const [toLastName, setToLastName] = useState('');

  const [fromAddress, setFromAddress] = useState('dan@mymailgram.com');
  const [fromName, setFromName] = useState('Dan from MyMailGram');
  const [subject, setSubject] = useState('');

  const [templateId, setTemplateId] = useState('');
  const [html, setHtml] = useState('');
  const [plainText, setPlainText] = useState('');
  const [autoPlainText, setAutoPlainText] = useState(true);

  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  // Batch (Excel) mode state (DurableSendgrid-style UI, but local sending)
  const [batchFile, setBatchFile] = useState(null);
  const [batchFileName, setBatchFileName] = useState('');
  const [batchRows, setBatchRows] = useState([]);
  const [batchHeaders, setBatchHeaders] = useState([]);
  const [batchEmailColumn, setBatchEmailColumn] = useState('');
  const [batchJsonColumn, setBatchJsonColumn] = useState('');

  const [subjectTemplate, setSubjectTemplate] = useState('{{subject_line}}');
  const [htmlTemplate, setHtmlTemplate] = useState('');
  const [plainTextTemplate, setPlainTextTemplate] = useState('');
  const [batchAutoPlainText, setBatchAutoPlainText] = useState(true);
  const [placeholderToJsonKey, setPlaceholderToJsonKey] = useState({});

  const [intervalMinSec, setIntervalMinSec] = useState(1);
  const [intervalMaxSec, setIntervalMaxSec] = useState(2);

  const [batchTemplateId, setBatchTemplateId] = useState('');

  const [batchRunning, setBatchRunning] = useState(false);
  const [batchStats, setBatchStats] = useState({ total: 0, sent: 0, failed: 0, currentIndex: null, lastTo: null, lastError: null });
  const [batchResults, setBatchResults] = useState([]); // per row: { status, toEmail, error?, emailId?, contactId?, startedAt?, finishedAt? }
  const stopRef = useRef(false);
  const runIdRef = useRef(0);

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

  const handleSelectTemplate = (id) => {
    setTemplateId(id);
    const tpl = templateById.get(id);
    if (!tpl) return;
    setSubject(tpl.subject || '');
    setHtml(tpl.html || '');
    if (autoPlainText) {
      setPlainText(htmlToPlainText(tpl.html || ''));
    }
  };

  const handleHtmlChange = (nextHtml) => {
    setHtml(nextHtml);
    if (autoPlainText) {
      setPlainText(htmlToPlainText(nextHtml));
    }
  };

  // Keep plain text template in sync when auto mode is on (batch mode)
  useEffect(() => {
    if (!batchAutoPlainText) return;
    setPlainTextTemplate(htmlToPlainText(htmlTemplate));
  }, [htmlTemplate, batchAutoPlainText]);

  // Restore Wake Lock on visibility changes (some browsers release it)
  useEffect(() => {
    const onVis = async () => {
      if (document.visibilityState === 'visible' && batchRunning) {
        await requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchRunning, keepAwakeEnabled]);

  useEffect(() => {
    return () => {
      stopRef.current = true;
      releaseWakeLock();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendSingle = async () => {
    setLastResult(null);

    const trimmedTo = toEmail.trim();
    if (!trimmedTo) {
      error('Recipient email (To) is required.');
      return;
    }
    if (!fromAddress.trim() || !fromName.trim()) {
      error('Sender email + sender name are required.');
      return;
    }
    if (!subject.trim()) {
      error('Subject is required.');
      return;
    }
    if (!html.trim()) {
      error('HTML content is required.');
      return;
    }

    setSending(true);
    try {
      // Append signature (match SendGridEmailSend behavior)
      const finalHtml = appendHtmlSignature(html);
      const finalPlain = plainText?.trim() ? appendTextSignature(plainText) : '';

      const res = await fetch('/api/mautic/send-single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('sessionToken') || localStorage.getItem('token')
            ? { Authorization: `Bearer ${localStorage.getItem('sessionToken') || localStorage.getItem('token')}` }
            : {}),
        },
        body: JSON.stringify({
          toEmail: trimmedTo,
          toFirstName: toFirstName.trim(),
          toLastName: toLastName.trim(),
          fromAddress: fromAddress.trim(),
          fromName: fromName.trim(),
          subject: subject.trim(),
          html: finalHtml,
          plainText: finalPlain,
          emailName: `Single Send (${trimmedTo}) - ${new Date().toISOString()}`,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const msg = json?.error || `Send failed (HTTP ${res.status})`;
        throw new Error(msg);
      }

      setLastResult(json);
      success(`Sent to ${trimmedTo} (Mautic emailId: ${json.emailId})`);
    } catch (e) {
      console.error(e);
      error(e.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const placeholdersInBatchTemplates = useMemo(() => {
    const combined = `${subjectTemplate || ''}\n${htmlTemplate || ''}\n${plainTextTemplate || ''}`;
    const re = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
    const keys = new Set();
    let m;
    while ((m = re.exec(combined))) keys.add(m[1]);
    return Array.from(keys).sort();
  }, [subjectTemplate, htmlTemplate, plainTextTemplate]);

  const sampleRow = useMemo(() => (batchRows?.length ? batchRows[0] : null), [batchRows]);
  const sampleJson = useMemo(() => {
    if (!sampleRow || !batchJsonColumn) return null;
    return extractJsonFromText(sampleRow?.[batchJsonColumn]);
  }, [sampleRow, batchJsonColumn]);

  const jsonKeys = useMemo(() => {
    if (!sampleJson || typeof sampleJson !== 'object') return [];
    return Object.keys(sampleJson).sort();
  }, [sampleJson]);

  // Best-effort mapping defaults: placeholder -> same key if exists in JSON
  useEffect(() => {
    if (!placeholdersInBatchTemplates.length) return;
    if (!jsonKeys.length) return;
    setPlaceholderToJsonKey((prev) => {
      const next = { ...(prev || {}) };
      let changed = false;
      placeholdersInBatchTemplates.forEach((k) => {
        if (next[k]) return;
        if (jsonKeys.includes(k)) {
          next[k] = k;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [placeholdersInBatchTemplates, jsonKeys]);

  const getValuesForRow = (row) => {
    const values = {};
    const parsed = batchJsonColumn ? extractJsonFromText(row?.[batchJsonColumn]) : null;
    if (parsed && typeof parsed === 'object') {
      Object.entries(parsed).forEach(([k, v]) => {
        if (v === null || v === undefined) return;
        values[k] = v;
      });
    }

    Object.entries(row || {}).forEach(([k, v]) => {
      const nk = normalizeKey(k);
      if (!nk) return;
      if (values[nk] === undefined) values[nk] = v;
    });

    // Match DurableSendgrid behavior for unsubscribe_url if possible
    if (values.unsubscribe_url === undefined || values.unsubscribe_url === null || String(values.unsubscribe_url).trim() === '') {
      const publicEmail =
        String(values.public_email || '').trim() || String(values.publicemail || '').trim() || String(values.email || '').trim();
      if (publicEmail) values.unsubscribe_url = `https://mymailgram.com/unsubscribe/${encodeURIComponent(publicEmail)}`;
    }

    placeholdersInBatchTemplates.forEach((ph) => {
      const mapped = placeholderToJsonKey?.[ph];
      if (!mapped) return;
      if (values[ph] !== undefined) return;
      if (parsed && typeof parsed === 'object' && Object.prototype.hasOwnProperty.call(parsed, mapped)) {
        values[ph] = parsed[mapped];
      }
    });
    return values;
  };

  const previewValues = useMemo(() => getValuesForRow(sampleRow || {}), [sampleRow, batchJsonColumn, placeholderToJsonKey, placeholdersInBatchTemplates]);
  const previewSubject = useMemo(() => applyPlaceholders(subjectTemplate, previewValues), [subjectTemplate, previewValues]);
  const previewHtml = useMemo(() => applyPlaceholders(htmlTemplate, previewValues), [htmlTemplate, previewValues]);
  const previewPlainText = useMemo(() => applyPlaceholders(plainTextTemplate, previewValues), [plainTextTemplate, previewValues]);

  const handleBatchFile = async (f) => {
    setBatchFile(f || null);
    setBatchFileName(f?.name || '');
    setBatchRows([]);
    setBatchHeaders([]);
    setBatchEmailColumn('');
    setBatchJsonColumn('');
    setBatchResults([]);
    setBatchStats({ total: 0, sent: 0, failed: 0, currentIndex: null, lastTo: null, lastError: null });
    stopRef.current = true;
    setBatchRunning(false);

    if (!f) return;
    try {
      const arrayBuffer = await f.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!Array.isArray(json) || json.length === 0) throw new Error('No rows found in file.');

      const hdrs = Object.keys(json[0] || {});
      setBatchHeaders(hdrs);
      setBatchRows(json);

      const lower = hdrs.map((h) => ({ h, l: String(h).toLowerCase() }));
      const guessEmail = lower.find((x) => x.l === 'public email' || x.l.includes('email'))?.h;
      const guessJson = lower.find((x) => x.l === 'generated text' || x.l.includes('generated text') || x.l.includes('json'))?.h;
      if (guessEmail) setBatchEmailColumn(guessEmail);
      if (guessJson) setBatchJsonColumn(guessJson);

      setBatchResults(
        json.map((r) => ({
          status: 'pending',
          toEmail: String(r?.[guessEmail] || r?.email || '').trim(),
        }))
      );
      setBatchStats({ total: json.length, sent: 0, failed: 0, currentIndex: null, lastTo: null, lastError: null });
      success(`Loaded ${json.length} rows from ${f.name}.`);
    } catch (e) {
      console.error(e);
      error(e.message || 'Failed to read file');
    }
  };

  const handleSelectBatchTemplate = (id) => {
    setBatchTemplateId(id);
    const tpl = templateById.get(id);
    if (!tpl) return;
    // Use chosen template as a starting point (subject + html).
    setSubjectTemplate(tpl.subject || '');
    setHtmlTemplate(tpl.html || '');
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const startBatchSend = async () => {
    if (!batchFile) return error('Upload an .xlsx file first.');
    if (!batchEmailColumn) return error('Select the email column.');
    if (!batchJsonColumn) return error('Select the JSON (Generated Text) column.');
    if (!fromAddress.trim() || !fromName.trim()) return error('From name + from address are required.');
    if (!subjectTemplate.trim()) return error('Subject template is required.');
    if (!htmlTemplate.trim()) return error('HTML template is required.');

    const min = Math.max(0, parseInt(intervalMinSec, 10) || 0);
    const max = Math.max(min, parseInt(intervalMaxSec, 10) || 0);

    const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
    if (!token) return error('Not authenticated');

    // Initialize run
    stopRef.current = false;
    const myRunId = ++runIdRef.current;
    setBatchRunning(true);
    await requestWakeLock();

    const initial = batchRows.map((r) => ({
      status: 'pending',
      toEmail: String(r?.[batchEmailColumn] || '').trim(),
      startedAt: null,
      finishedAt: null,
      emailId: null,
      contactId: null,
      error: null,
    }));
    setBatchResults(initial);
    setBatchStats({ total: batchRows.length, sent: 0, failed: 0, currentIndex: null, lastTo: null, lastError: null });

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < batchRows.length; i++) {
      if (stopRef.current || runIdRef.current !== myRunId) break;

      const row = batchRows[i];
      const to = String(row?.[batchEmailColumn] || '').trim();
      const startedAt = new Date().toISOString();

      setBatchStats((s) => ({ ...s, currentIndex: i + 1, lastTo: to, lastError: null }));
      setBatchResults((prev) => {
        const next = [...prev];
        next[i] = { ...(next[i] || {}), status: 'sending', toEmail: to, startedAt };
        return next;
      });

      try {
        if (!to) throw new Error('Missing recipient email');
        const values = getValuesForRow(row);

        const toFirst = String(values.first_name || values.firstname || values.first || '').trim();
        const toLast = String(values.last_name || values.lastname || values.last || '').trim();

        const renderedSubject = applyPlaceholders(subjectTemplate, values).trim();
        const renderedHtml = applyPlaceholders(htmlTemplate, values);
        const renderedPlain = applyPlaceholders(plainTextTemplate, values);

        const finalHtml = appendHtmlSignature(renderedHtml);
        const finalPlain = renderedPlain?.trim() ? appendTextSignature(renderedPlain) : '';

        const res = await fetch('/api/mautic/send-single', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            toEmail: to,
            toFirstName: toFirst,
            toLastName: toLast,
            fromAddress: fromAddress.trim(),
            fromName: fromName.trim(),
            subject: renderedSubject,
            html: finalHtml,
            plainText: finalPlain,
            emailName: `Batch Send (${to}) - ${new Date().toISOString()}`,
          }),
        });

        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) {
          throw new Error(json?.error || `Send failed (HTTP ${res.status})`);
        }

        sent++;
        const finishedAt = new Date().toISOString();
        setBatchResults((prev) => {
          const next = [...prev];
          next[i] = {
            ...(next[i] || {}),
            status: 'sent',
            emailId: json.emailId,
            contactId: json.contactId,
            finishedAt,
            error: null,
          };
          return next;
        });
        setBatchStats((s) => ({ ...s, sent, failed, lastTo: to, lastError: null }));
      } catch (e) {
        failed++;
        const finishedAt = new Date().toISOString();
        const msg = e?.message || 'Failed to send';
        setBatchResults((prev) => {
          const next = [...prev];
          next[i] = { ...(next[i] || {}), status: 'failed', finishedAt, error: msg };
          return next;
        });
        setBatchStats((s) => ({ ...s, sent, failed, lastTo: to, lastError: msg }));
      }

      if (stopRef.current || runIdRef.current !== myRunId) break;
      const delaySec = randomIntInclusive(min, max);
      if (delaySec > 0) await sleep(delaySec * 1000);
    }

    // End run
    if (runIdRef.current === myRunId) {
      setBatchRunning(false);
      setBatchStats((s) => ({ ...s, currentIndex: null }));
      await releaseWakeLock();
      if (!stopRef.current) success(`Batch complete. Sent ${sent}, failed ${failed}.`);
    }
  };

  const stopBatchSend = async () => {
    stopRef.current = true;
    runIdRef.current += 1;
    setBatchRunning(false);
    setBatchStats((s) => ({ ...s, currentIndex: null }));
    await releaseWakeLock();
    success('Stopping… (current in-flight send may still finish)');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">
                Single Email Send
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Single send or batch send via Mautic. Batch mode supports Excel upload, placeholder mapping, and live status updates — without durable functions.
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => setMode('single')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    mode === 'single' ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  Single
                </button>
                <button
                  type="button"
                  onClick={() => setMode('batch')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    mode === 'batch' ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  Batch (Excel)
                </button>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={keepAwakeEnabled} onChange={(e) => setKeepAwakeEnabled(e.target.checked)} />
                Keep screen awake during batch runs (Wake Lock)
              </label>
            </div>

            {mode === 'single' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: form */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">To (email)</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                        value={toEmail}
                        onChange={(e) => setToEmail(e.target.value)}
                        placeholder="ebi.champion@gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Template</label>
                      <select
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                        value={templateId}
                        onChange={(e) => handleSelectTemplate(e.target.value)}
                      >
                        <option value="">— Choose a template —</option>
                        {Object.keys(grouped).map((cat) => (
                          <optgroup key={cat} label={cat}>
                            {grouped[cat].map((tpl) => (
                              <option key={tpl.id} value={tpl.id}>
                                {tpl.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">To first name</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                        value={toFirstName}
                        onChange={(e) => setToFirstName(e.target.value)}
                        placeholder="Ebi"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">To last name</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                        value={toLastName}
                        onChange={(e) => setToLastName(e.target.value)}
                        placeholder="Champion"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">From (email)</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                        value={fromAddress}
                        onChange={(e) => setFromAddress(e.target.value)}
                        placeholder="dan@mymailgram.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">From name</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        placeholder="Dan from MyMailGram"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Subject</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Custom subject line…"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">HTML</label>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Signature auto-appends (like SendGrid Email Send)</div>
                    </div>
                    <textarea
                      className="w-full h-64 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                      value={html}
                      onChange={(e) => handleHtmlChange(e.target.value)}
                      placeholder="Paste or choose a template…"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Plain text</label>
                      <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={autoPlainText}
                          onChange={(e) => {
                            const on = e.target.checked;
                            setAutoPlainText(on);
                            if (on) setPlainText(htmlToPlainText(html));
                          }}
                        />
                        Auto-generate
                      </label>
                    </div>
                    <textarea
                      className="w-full h-28 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                      value={plainText}
                      onChange={(e) => setPlainText(e.target.value)}
                      disabled={autoPlainText}
                      placeholder="Optional — used by clients that can’t render HTML"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={sendSingle}
                      disabled={sending}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 text-sm font-medium"
                    >
                      {sending ? 'Sending…' : 'Send email'}
                    </button>

                    {lastResult?.success ? (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Sent. <span className="font-medium">emailId</span>: {lastResult.emailId} · <span className="font-medium">contactId</span>: {lastResult.contactId}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Right: preview */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Preview</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Rendered HTML (approx.)</div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(appendHtmlSignature(html || ''));
                          success('Copied HTML (with signature) to clipboard');
                        } catch {
                          error('Failed to copy HTML');
                        }
                      }}
                      className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium"
                    >
                      Copy HTML
                    </button>
                  </div>

                  <iframe
                    title="Email preview"
                    className="w-full h-[70vh] rounded-lg border border-slate-200 dark:border-slate-700 bg-white"
                    srcDoc={
                      appendHtmlSignature(html || '') ||
                      '<div style="font-family: Arial; padding: 16px; color:#64748b;">Choose a template or paste HTML to preview.</div>'
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: batch config */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Upload recipients (.xlsx)</label>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => handleBatchFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-slate-700 dark:text-slate-200"
                        disabled={batchRunning}
                      />
                      {batchFileName ? (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Loaded: <span className="font-medium">{batchFileName}</span> ({batchRows.length} rows)
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        <select
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                          value={batchEmailColumn}
                          onChange={(e) => setBatchEmailColumn(e.target.value)}
                          disabled={!batchHeaders.length || batchRunning}
                        >
                          <option value="">Email column…</option>
                          {batchHeaders.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                        <select
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                          value={batchJsonColumn}
                          onChange={(e) => setBatchJsonColumn(e.target.value)}
                          disabled={!batchHeaders.length || batchRunning}
                        >
                          <option value="">JSON column (Generated Text)…</option>
                          {batchHeaders.map((h) => (
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
                        disabled={batchRunning}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">From name</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        disabled={batchRunning}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Start from a template (optional)</label>
                    <select
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                      value={batchTemplateId}
                      onChange={(e) => handleSelectBatchTemplate(e.target.value)}
                      disabled={batchRunning}
                    >
                      <option value="">— Choose a template —</option>
                      {Object.keys(grouped).map((cat) => (
                        <optgroup key={cat} label={cat}>
                          {grouped[cat].map((tpl) => (
                            <option key={tpl.id} value={tpl.id}>
                              {tpl.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Subject (template)</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                      value={subjectTemplate}
                      onChange={(e) => setSubjectTemplate(e.target.value)}
                      disabled={batchRunning}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">HTML (template)</label>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Signature auto-appends (like SendGrid Email Send)</div>
                    </div>
                    <textarea
                      className="w-full h-56 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                      value={htmlTemplate}
                      onChange={(e) => setHtmlTemplate(e.target.value)}
                      disabled={batchRunning}
                      placeholder="<h1>{{introduction}}</h1> ..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Plain text (template)</label>
                      <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={batchAutoPlainText}
                          onChange={(e) => {
                            const on = e.target.checked;
                            setBatchAutoPlainText(on);
                            if (on) setPlainTextTemplate(htmlToPlainText(htmlTemplate));
                          }}
                          disabled={batchRunning}
                        />
                        Auto-generate
                      </label>
                    </div>
                    <textarea
                      className="w-full h-28 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                      value={plainTextTemplate}
                      onChange={(e) => setPlainTextTemplate(e.target.value)}
                      disabled={batchAutoPlainText || batchRunning}
                    />
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-5 space-y-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Placeholder mapping</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Map template placeholders to keys from the JSON column (Generated Text).</div>
                    </div>

                    {placeholdersInBatchTemplates.length === 0 ? (
                      <div className="text-xs text-slate-500 dark:text-slate-400">No placeholders found yet.</div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {placeholdersInBatchTemplates.map((k) => (
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
                              disabled={!jsonKeys.length || batchRunning}
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
                          disabled={batchRunning}
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
                          disabled={batchRunning}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={startBatchSend}
                        disabled={batchRunning}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 text-sm font-medium flex-1"
                      >
                        {batchRunning ? 'Running…' : 'Start batch send'}
                      </button>
                      <button
                        type="button"
                        onClick={stopBatchSend}
                        disabled={!batchRunning}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-sm font-medium"
                      >
                        Stop
                      </button>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Total: <span className="font-medium">{batchStats.total}</span> · Sent:{' '}
                      <span className="font-medium">{batchStats.sent}</span> · Failed:{' '}
                      <span className="font-medium">{batchStats.failed}</span>
                      {batchStats.currentIndex ? (
                        <>
                          {' '}
                          · Processing: <span className="font-medium">{batchStats.currentIndex}</span>
                        </>
                      ) : null}
                    </div>
                    {batchStats.lastError ? <div className="text-xs text-rose-600">{batchStats.lastError}</div> : null}
                  </div>
                </div>

                {/* Right: preview + live status */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
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
                          await navigator.clipboard.writeText(appendHtmlSignature(previewHtml || ''));
                          success('Copied rendered HTML (with signature) to clipboard');
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

                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Plain text preview (rendered):</div>
                    <pre className="mt-1 max-h-24 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-[11px] text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                      {(previewPlainText?.trim() ? appendTextSignature(previewPlainText) : '') || '—'}
                    </pre>
                  </div>

                  <iframe
                    title="Email preview"
                    className="w-full h-[38vh] rounded-lg border border-slate-200 dark:border-slate-700 bg-white"
                    srcDoc={
                      appendHtmlSignature(previewHtml || '') ||
                      '<div style="font-family: Arial; padding: 16px; color:#64748b;">Upload a file and fill in a template to preview.</div>'
                    }
                  />

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">Live status</div>
                    <div className="max-h-[28vh] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                      <table className="min-w-full text-xs">
                        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="text-left px-3 py-2 border-b border-slate-200 dark:border-slate-700">#</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200 dark:border-slate-700">Email</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200 dark:border-slate-700">Status</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200 dark:border-slate-700">Result</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800">
                          {batchResults?.length ? (
                            batchResults.map((r, idx) => (
                              <tr key={idx} className="border-b border-slate-100 dark:border-slate-700">
                                <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{idx + 1}</td>
                                <td className="px-3 py-2 font-mono text-slate-800 dark:text-slate-100">{r?.toEmail || '—'}</td>
                                <td className="px-3 py-2">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                      r?.status === 'sent'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : r?.status === 'failed'
                                          ? 'bg-rose-100 text-rose-800'
                                          : r?.status === 'sending'
                                            ? 'bg-indigo-100 text-indigo-800'
                                            : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {r?.status || 'pending'}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                  {r?.status === 'sent' ? (
                                    <span>
                                      emailId: <span className="font-mono">{r.emailId}</span> · contactId:{' '}
                                      <span className="font-mono">{r.contactId}</span>
                                    </span>
                                  ) : r?.status === 'failed' ? (
                                    <span className="text-rose-600">{r.error || 'Failed'}</span>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="px-3 py-4 text-center text-slate-500 dark:text-slate-400">
                                Upload an Excel file to populate live status.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}


