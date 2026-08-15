import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import { useToast } from '../../contexts/ToastContext';

const DEFAULT_DOMAIN = 'myleadgram.com';
const DEFAULT_BASE_URL = 'https://api.mailgun.net';
const DEFAULT_TO = 'ebi.champion@gmail.com';
const DEFAULT_FROM_EMAIL = 'ceo@myleadgram.com';
const DEFAULT_FROM_NAME = 'Daniel Melnick';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomIntInclusive(min, max) {
  const a = Math.ceil(min);
  const b = Math.floor(max);
  if (b <= a) return a;
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function parseEmails(raw) {
  const parts = String(raw || '')
    .split(/[\s,;]+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const seen = new Set();
  const unique = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(p);
  }
  return unique;
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

function normalizeKey(key) {
  return String(key || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function applyPlaceholders(template, values) {
  const str = String(template || '');
  return str.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_m, key) => {
    const v = values?.[key];
    if (v === null || v === undefined) return `{{${key}}}`;
    return String(v);
  });
}

export default function MailgunTest() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const { success, error } = useToast();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form
  const [toEmailsRaw, setToEmailsRaw] = useState(DEFAULT_TO);
  const [recipientSource, setRecipientSource] = useState('manual'); // 'manual' | 'excel'

  // Excel recipients
  const [excelFile, setExcelFile] = useState(null);
  const [excelFileName, setExcelFileName] = useState('');
  const [excelRows, setExcelRows] = useState([]);
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [excelEmailColumn, setExcelEmailColumn] = useState('');
  const [excelJsonColumn, setExcelJsonColumn] = useState('');
  const [placeholderToJsonKey, setPlaceholderToJsonKey] = useState({});
  const [excelResults, setExcelResults] = useState([]); // {status,toEmail,error?,startedAt?,finishedAt?}
  const [excelProgress, setExcelProgress] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    currentIndex: null,
    lastTo: null,
    lastError: null,
  });

  const [subject, setSubject] = useState('Mailgun test email');
  const [text, setText] = useState('Hello from the Mailgun test page.');
  const [fromName, setFromName] = useState(DEFAULT_FROM_NAME);
  const [fromEmail, setFromEmail] = useState(DEFAULT_FROM_EMAIL);

  const [mailgunApiKey, setMailgunApiKey] = useState(''); // input only
  const [activeMailgunApiKey, setActiveMailgunApiKey] = useState(''); // in-memory only during run

  const [domain, setDomain] = useState(DEFAULT_DOMAIN);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [endpointOverride, setEndpointOverride] = useState('');

  // Throttling
  const [intervalMinSec, setIntervalMinSec] = useState(1);
  const [intervalMaxSec, setIntervalMaxSec] = useState(2);
  const [repeat, setRepeat] = useState(false);

  // Burst pause: pause M minutes after every N sends (both ranges)
  const [burstPauseEnabled, setBurstPauseEnabled] = useState(false);
  const [pauseEveryMinSends, setPauseEveryMinSends] = useState(50);
  const [pauseEveryMaxSends, setPauseEveryMaxSends] = useState(100);
  const [pauseMinMinutes, setPauseMinMinutes] = useState(5);
  const [pauseMaxMinutes, setPauseMaxMinutes] = useState(10);
  const [burstUi, setBurstUi] = useState({
    nextPauseAfter: null,
    remainingUntilPause: null,
    lastPauseMinutes: null,
  });

  // Runner state
  const [sending, setSending] = useState(false); // single in-flight request indicator
  const [isRunning, setIsRunning] = useState(false); // batch runner indicator
  const [lastResult, setLastResult] = useState(null);
  const [batchStats, setBatchStats] = useState({
    batch: 1,
    totalSent: 0,
    totalFailed: 0,
    lastTo: null,
    lastOk: null,
    lastError: null,
  });
  const [recentEvents, setRecentEvents] = useState([]); // newest first

  const stopRef = useRef(false);
  const runIdRef = useRef(0);

  // Enterprise keep-awake (Wake Lock API)
  const [keepAwakeEnabled, setKeepAwakeEnabled] = useState(true);
  const wakeLockRef = useRef(null);

  const manualRecipients = useMemo(() => parseEmails(toEmailsRaw), [toEmailsRaw]);
  const excelRecipients = useMemo(() => {
    if (!excelRows?.length || !excelEmailColumn) return [];
    return excelRows
      .map((r) => String(r?.[excelEmailColumn] || '').trim())
      .filter(Boolean);
  }, [excelRows, excelEmailColumn]);

  const recipients = useMemo(
    () => (recipientSource === 'excel' ? excelRecipients : manualRecipients),
    [recipientSource, excelRecipients, manualRecipients]
  );
  const invalidRecipients = useMemo(() => recipients.filter((r) => !emailRegex.test(r)), [recipients, emailRegex]);

  const placeholdersInTemplates = useMemo(() => {
    const combined = `${subject || ''}\n${text || ''}`;
    const re = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
    const keys = new Set();
    let m;
    while ((m = re.exec(combined))) keys.add(m[1]);
    return Array.from(keys).sort();
  }, [subject, text]);

  const sampleRow = useMemo(() => (excelRows?.length ? excelRows[0] : null), [excelRows]);
  const sampleJson = useMemo(() => {
    if (!sampleRow || !excelJsonColumn) return null;
    return extractJsonFromText(sampleRow?.[excelJsonColumn]);
  }, [sampleRow, excelJsonColumn]);

  const jsonKeys = useMemo(() => {
    if (!sampleJson || typeof sampleJson !== 'object') return [];
    return Object.keys(sampleJson).sort();
  }, [sampleJson]);

  // Best-effort default mapping: placeholder -> same key if present in JSON
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
    const parsed = excelJsonColumn ? extractJsonFromText(row?.[excelJsonColumn]) : null;
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

    placeholdersInTemplates.forEach((ph) => {
      const mapped = placeholderToJsonKey?.[ph] || ph;
      if (values[ph] !== undefined) return;
      if (parsed && typeof parsed === 'object' && Object.prototype.hasOwnProperty.call(parsed, mapped)) {
        values[ph] = parsed[mapped];
      }
    });
    return values;
  };

  const previewValues = useMemo(
    () => (sampleRow ? getValuesForRow(sampleRow) : {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sampleRow, excelJsonColumn, placeholderToJsonKey, placeholdersInTemplates]
  );
  const previewSubject = useMemo(() => applyPlaceholders(subject, previewValues), [subject, previewValues]);
  const previewText = useMemo(() => applyPlaceholders(text, previewValues), [text, previewValues]);

  const prettyResult = useMemo(() => {
    if (!lastResult) return '';
    try {
      return JSON.stringify(lastResult, null, 2);
    } catch {
      return String(lastResult);
    }
  }, [lastResult]);

  const computedEndpoint = useMemo(() => {
    const b = baseUrl.trim().replace(/\/+$/, '');
    const d = domain.trim();
    if (!b || !d) return '';
    return `${b}/v3/${d}/messages`;
  }, [baseUrl, domain]);

  const domainMismatchHint = useMemo(() => {
    const fromDomain = fromEmail.trim().split('@')[1] || '';
    const d = domain.trim();
    if (!fromDomain || !d) return '';
    if (fromDomain.toLowerCase() !== d.toLowerCase()) {
      return `From email domain (${fromDomain}) does not match Mailgun sending domain (${d}). DKIM/signing will follow the Mailgun domain used in the endpoint.`;
    }
    return '';
  }, [fromEmail, domain]);

  const handleExcelFile = async (f) => {
    setExcelFile(f || null);
    setExcelFileName(f?.name || '');
    setExcelRows([]);
    setExcelHeaders([]);
    setExcelEmailColumn('');
    setExcelJsonColumn('');
    setPlaceholderToJsonKey({});
    setExcelResults([]);
    setExcelProgress({ total: 0, sent: 0, failed: 0, currentIndex: null, lastTo: null, lastError: null });

    if (!f) return;
    try {
      const arrayBuffer = await f.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!Array.isArray(json) || json.length === 0) throw new Error('No rows found in file.');

      const hdrs = Object.keys(json[0] || {});
      setExcelHeaders(hdrs);
      setExcelRows(json);

      const lower = hdrs.map((h) => ({ h, l: String(h).toLowerCase() }));
      const guessEmail = lower.find((x) => x.l === 'public email' || x.l.includes('email'))?.h;
      const guessJson = lower.find((x) => x.l === 'generated text' || x.l.includes('generated text') || x.l.includes('json'))?.h;
      if (guessEmail) setExcelEmailColumn(guessEmail);
      if (guessJson) setExcelJsonColumn(guessJson);

      setExcelResults(
        json.map((r) => ({
          status: 'pending',
          toEmail: String(r?.[guessEmail] || '').trim(),
          error: null,
          startedAt: null,
          finishedAt: null,
        }))
      );
      setExcelProgress({ total: json.length, sent: 0, failed: 0, currentIndex: null, lastTo: null, lastError: null });
      success(`Loaded ${json.length} rows from ${f.name}.`);
    } catch (e) {
      console.error(e);
      error(e.message || 'Failed to read file');
    }
  };

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

  useEffect(() => {
    return () => {
      stopRef.current = true;
      releaseWakeLock();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onVis = async () => {
      if (document.visibilityState === 'visible' && isRunning) {
        await requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, keepAwakeEnabled]);

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

  const sendOne = async ({ apiKeyToUse, toEmail, subjectOverride, textOverride }) => {
    const toTrimmed = String(toEmail || '').trim();
    const fromEmailTrimmed = fromEmail.trim();
    const fromNameTrimmed = fromName.trim();
    const subjectTrimmed = String(subjectOverride ?? subject).trim();
    const textTrimmed = String(textOverride ?? text).trim();
    const domainTrimmed = domain.trim();
    const baseUrlTrimmed = baseUrl.trim();

    if (!toTrimmed) throw new Error('Recipient (To) is required.');
    if (!emailRegex.test(toTrimmed)) throw new Error(`Invalid recipient email format: ${toTrimmed}`);
    if (!fromEmailTrimmed) throw new Error('Sender email (From) is required.');
    if (!fromNameTrimmed) throw new Error('Sender name (From name) is required.');
    if (!subjectTrimmed) throw new Error('Subject is required.');
    if (!textTrimmed) throw new Error('Text body is required.');
    if (!domainTrimmed) throw new Error('Mailgun sending domain is required.');
    if (!baseUrlTrimmed) throw new Error('Base URL is required.');

    const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
    const fromStr = `${fromNameTrimmed} <${fromEmailTrimmed}>`;

    const res = await fetch('/api/mailgun/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        to: toTrimmed,
        from: fromStr,
        subject: subjectTrimmed,
        text: textTrimmed,
        ...(endpointOverride.trim() ? { endpoint: endpointOverride.trim() } : {}),
        domain: domainTrimmed,
        baseUrl: baseUrlTrimmed,
        ...(String(apiKeyToUse || '').trim() ? { apiKey: String(apiKeyToUse || '').trim() } : {}),
      }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      const msg =
        json?.error ||
        (typeof json?.message === 'string' ? json.message : null) ||
        `Send failed (HTTP ${res.status})`;
      const extra = typeof json?.mailgunStatus === 'number' ? ` (Mailgun HTTP ${json.mailgunStatus})` : '';
      throw new Error(`${msg}${extra}`);
    }
    return json;
  };

  const startBatch = async () => {
    setLastResult(null);

    const apiKeyTrimmed = mailgunApiKey.trim();
    const fromEmailTrimmed = fromEmail.trim();
    const fromNameTrimmed = fromName.trim();
    const subjectTrimmed = subject.trim();
    const textTrimmed = String(text || '').trim();

    if (recipientSource === 'excel') {
      if (!excelFile) return error('Upload an .xlsx file first.');
      if (!excelEmailColumn) return error('Select the email column.');
      if (!excelJsonColumn) return error('Select the JSON (Generated Text) column.');
      if (!excelRows.length) return error('No rows found in the uploaded file.');
      if (!recipients.length) return error('No recipient emails found in the selected email column.');
      if (invalidRecipients.length) {
        const sample = invalidRecipients.slice(0, 5).join(', ');
        return error(`Invalid recipient email(s) in Excel: ${sample}${invalidRecipients.length > 5 ? ' …' : ''}`);
      }
    } else {
      if (!recipients.length) return error('Please provide at least one recipient email (comma-separated).');
      if (invalidRecipients.length) {
        const sample = invalidRecipients.slice(0, 5).join(', ');
        return error(`Invalid recipient email(s): ${sample}${invalidRecipients.length > 5 ? ' …' : ''}`);
      }
    }
    if (!fromEmailTrimmed) return error('Sender email (From) is required.');
    if (!fromNameTrimmed) return error('Sender name (From name) is required.');
    if (!subjectTrimmed) return error('Subject is required.');
    if (!textTrimmed) return error('Text body is required.');
    if (!domain.trim()) return error('Mailgun sending domain is required.');
    if (!baseUrl.trim()) return error('Base URL is required.');

    const minSec = Math.max(0, parseInt(intervalMinSec, 10) || 0);
    const maxSec = Math.max(minSec, parseInt(intervalMaxSec, 10) || 0);

    const burstEnabled = !!burstPauseEnabled;
    const sendsMin = Math.max(1, parseInt(pauseEveryMinSends, 10) || 1);
    const sendsMax = Math.max(sendsMin, parseInt(pauseEveryMaxSends, 10) || sendsMin);
    const pauseMin = Math.max(1, parseInt(pauseMinMinutes, 10) || 1);
    const pauseMax = Math.max(pauseMin, parseInt(pauseMaxMinutes, 10) || pauseMin);
    if (burstEnabled) {
      if (sendsMin < 1) return error('Burst: sends must be >= 1.');
      if (pauseMin < 1) return error('Burst: pause minutes must be >= 1.');
    }

    stopRef.current = false;
    runIdRef.current += 1;
    const runId = runIdRef.current;

    const sleepChecked = async (ms) => {
      const total = Math.max(0, Number(ms) || 0);
      if (total <= 0) return !stopRef.current && runIdRef.current === runId;
      const started = Date.now();
      while (!stopRef.current && runIdRef.current === runId) {
        const elapsed = Date.now() - started;
        const remaining = total - elapsed;
        if (remaining <= 0) break;
        await sleep(Math.min(500, remaining));
      }
      return !stopRef.current && runIdRef.current === runId;
    };

    setIsRunning(true);
    setSending(false);
    setActiveMailgunApiKey(apiKeyTrimmed);
    setMailgunApiKey('');
    setBatchStats({ batch: 1, totalSent: 0, totalFailed: 0, lastTo: null, lastOk: null, lastError: null });
    setRecentEvents([]);

    let sendsSincePause = 0;
    let nextPauseAfter = burstEnabled ? randomIntInclusive(sendsMin, sendsMax) : null;
    if (burstEnabled) setBurstUi({ nextPauseAfter, remainingUntilPause: nextPauseAfter, lastPauseMinutes: null });
    else setBurstUi({ nextPauseAfter: null, remainingUntilPause: null, lastPauseMinutes: null });

    await requestWakeLock();

    const effectiveRepeat = recipientSource === 'excel' ? false : repeat;

    if (recipientSource === 'excel') {
      setExcelResults(
        excelRows.map((r) => ({
          status: 'pending',
          toEmail: String(r?.[excelEmailColumn] || '').trim(),
          error: null,
          startedAt: null,
          finishedAt: null,
        }))
      );
      setExcelProgress({ total: excelRows.length, sent: 0, failed: 0, currentIndex: null, lastTo: null, lastError: null });
    }

    success(
      `Started Mailgun batch: ${recipients.length} recipient(s), interval ${minSec}-${maxSec}s${effectiveRepeat ? ' (repeating)' : ''}${
        burstEnabled ? `, burst pause every ${sendsMin}-${sendsMax} sends for ${pauseMin}-${pauseMax} minutes` : ''
      }${recipientSource === 'excel' ? ' (Excel)' : ''}`
    );

    let batch = 1;

    while (!stopRef.current && runIdRef.current === runId) {
      if (recipientSource === 'excel') {
        let sent = 0;
        let failed = 0;
        for (let i = 0; i < excelRows.length; i++) {
          if (stopRef.current || runIdRef.current !== runId) break;
          const row = excelRows[i];
          const toEmail = String(row?.[excelEmailColumn] || '').trim();
          const startedAtIso = new Date().toISOString();

          setExcelProgress((p) => ({ ...p, currentIndex: i + 1, lastTo: toEmail, lastError: null }));
          setExcelResults((prev) => {
            const next = [...prev];
            next[i] = { ...(next[i] || {}), status: 'sending', toEmail, startedAt: startedAtIso, error: null };
            return next;
          });

          setSending(true);
          const startedAt = Date.now();
          let ok = false;
          try {
            const values = getValuesForRow(row);
            const renderedSubject = applyPlaceholders(subject, values).trim();
            const renderedText = applyPlaceholders(text, values);

            const responseData = await sendOne({
              apiKeyToUse: apiKeyTrimmed,
              toEmail,
              subjectOverride: renderedSubject,
              textOverride: renderedText,
            });
            ok = true;
            sent++;
            const finishedAtIso = new Date().toISOString();
            setLastResult(responseData);
            setBatchStats((prev) => ({
              ...prev,
              batch,
              totalSent: prev.totalSent + 1,
              lastTo: toEmail,
              lastOk: true,
              lastError: null,
            }));
            setRecentEvents((prev) => {
              const next = [{ ts: new Date().toISOString(), to: toEmail, ok: true, ms: Date.now() - startedAt }, ...prev];
              return next.slice(0, 25);
            });
            setExcelResults((prev) => {
              const next = [...prev];
              next[i] = { ...(next[i] || {}), status: 'sent', finishedAt: finishedAtIso, error: null };
              return next;
            });
            setExcelProgress((p) => ({ ...p, sent, failed, lastTo: toEmail, lastError: null }));
          } catch (e) {
            failed++;
            const msg = e?.message || 'Send failed';
            const finishedAtIso = new Date().toISOString();
            setLastResult({ success: false, error: msg });
            setBatchStats((prev) => ({
              ...prev,
              batch,
              totalFailed: prev.totalFailed + 1,
              lastTo: toEmail,
              lastOk: false,
              lastError: msg,
            }));
            setRecentEvents((prev) => {
              const next = [{ ts: new Date().toISOString(), to: toEmail, ok: false, ms: Date.now() - startedAt, error: msg }, ...prev];
              return next.slice(0, 25);
            });
            setExcelResults((prev) => {
              const next = [...prev];
              next[i] = { ...(next[i] || {}), status: 'failed', finishedAt: finishedAtIso, error: msg };
              return next;
            });
            setExcelProgress((p) => ({ ...p, sent, failed, lastTo: toEmail, lastError: msg }));
          } finally {
            setSending(false);
          }

          if (stopRef.current || runIdRef.current !== runId) break;

          // Burst accounting counts successful sends.
          if (burstEnabled && nextPauseAfter && ok) {
            sendsSincePause += 1;
            const remaining = Math.max(0, nextPauseAfter - sendsSincePause);
            setBurstUi((u) => ({ ...u, remainingUntilPause: remaining }));
          }

          const delaySec = randomIntInclusive(minSec, maxSec);
          if (delaySec > 0) {
            const cont = await sleepChecked(delaySec * 1000);
            if (!cont) break;
          }

          if (burstEnabled && nextPauseAfter && sendsSincePause >= nextPauseAfter) {
            const pauseMinutes = randomIntInclusive(pauseMin, pauseMax);
            setBurstUi((u) => ({ ...u, lastPauseMinutes: pauseMinutes }));
            setRecentEvents((prev) => {
              const next = [{ ts: new Date().toISOString(), to: null, ok: true, ms: 0, note: `Burst pause: ${pauseMinutes} minute(s)` }, ...prev];
              return next.slice(0, 25);
            });
            const cont = await sleepChecked(pauseMinutes * 60 * 1000);
            if (!cont) break;
            sendsSincePause = 0;
            nextPauseAfter = randomIntInclusive(sendsMin, sendsMax);
            setBurstUi((u) => ({ ...u, nextPauseAfter, remainingUntilPause: nextPauseAfter }));
          }
        }

        // Excel runs are one-pass (match SendGridEmailSend behavior)
        break;
      } else {
        for (const toEmail of recipients) {
          if (stopRef.current || runIdRef.current !== runId) break;

          setSending(true);
          const startedAt = Date.now();
          let ok = false;
          try {
            const responseData = await sendOne({ apiKeyToUse: apiKeyTrimmed, toEmail });
            ok = true;
            setLastResult(responseData);
            setBatchStats((prev) => ({
              ...prev,
              batch,
              totalSent: prev.totalSent + 1,
              lastTo: toEmail,
              lastOk: true,
              lastError: null,
            }));
            setRecentEvents((prev) => {
              const next = [{ ts: new Date().toISOString(), to: toEmail, ok: true, ms: Date.now() - startedAt }, ...prev];
              return next.slice(0, 25);
            });
          } catch (e) {
            const msg = e?.message || 'Send failed';
            setLastResult({ success: false, error: msg });
            setBatchStats((prev) => ({
              ...prev,
              batch,
              totalFailed: prev.totalFailed + 1,
              lastTo: toEmail,
              lastOk: false,
              lastError: msg,
            }));
            setRecentEvents((prev) => {
              const next = [{ ts: new Date().toISOString(), to: toEmail, ok: false, ms: Date.now() - startedAt, error: msg }, ...prev];
              return next.slice(0, 25);
            });
          } finally {
            setSending(false);
          }

          if (stopRef.current || runIdRef.current !== runId) break;

          if (burstEnabled && nextPauseAfter && ok) {
            sendsSincePause += 1;
            const remaining = Math.max(0, nextPauseAfter - sendsSincePause);
            setBurstUi((u) => ({ ...u, remainingUntilPause: remaining }));
          }

          const delaySec = randomIntInclusive(minSec, maxSec);
          if (delaySec > 0) {
            const cont = await sleepChecked(delaySec * 1000);
            if (!cont) break;
          }

          if (burstEnabled && nextPauseAfter && sendsSincePause >= nextPauseAfter) {
            const pauseMinutes = randomIntInclusive(pauseMin, pauseMax);
            setBurstUi((u) => ({ ...u, lastPauseMinutes: pauseMinutes }));
            setRecentEvents((prev) => {
              const next = [{ ts: new Date().toISOString(), to: null, ok: true, ms: 0, note: `Burst pause: ${pauseMinutes} minute(s)` }, ...prev];
              return next.slice(0, 25);
            });
            const cont = await sleepChecked(pauseMinutes * 60 * 1000);
            if (!cont) break;
            sendsSincePause = 0;
            nextPauseAfter = randomIntInclusive(sendsMin, sendsMax);
            setBurstUi((u) => ({ ...u, nextPauseAfter, remainingUntilPause: nextPauseAfter }));
          }
        }

        if (!effectiveRepeat) break;
        batch += 1;
        setBatchStats((prev) => ({ ...prev, batch }));
      }
    }

    setIsRunning(false);
    setSending(false);
    setActiveMailgunApiKey('');
    stopRef.current = true;
    await releaseWakeLock();
  };

  const stopBatch = async () => {
    stopRef.current = true;
    runIdRef.current += 1;
    setIsRunning(false);
    setSending(false);
    setActiveMailgunApiKey('');
    await releaseWakeLock();
    success('Stopped batch send.');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">Mailgun Test Email</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Sends test emails via Mailgun. Supports batch runs with interval throttling and optional burst pauses.
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 mb-5">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={keepAwakeEnabled} onChange={(e) => setKeepAwakeEnabled(e.target.checked)} />
                Keep screen awake during batch runs (Wake Lock)
              </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-5">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Mailgun API Key (not stored)</div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">API key</label>
                    <input
                      type="password"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                      value={mailgunApiKey}
                      onChange={(e) => setMailgunApiKey(e.target.value)}
                      placeholder="Paste your Mailgun API key (will only be used for this request)"
                      autoComplete="off"
                      disabled={isRunning}
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMailgunApiKey('');
                          success('Cleared API key input (not stored).');
                        }}
                        disabled={isRunning}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium"
                      >
                        Clear
                      </button>
                      {isRunning ? (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          In-memory key active: <span className="font-medium">{activeMailgunApiKey ? 'Yes' : 'No'}</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      This key is sent to the backend for this request only. It is not saved in the browser.
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recipients</div>
                    <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1">
                      <button
                        type="button"
                        onClick={() => setRecipientSource('manual')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                          recipientSource === 'manual'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                        disabled={isRunning}
                      >
                        Manual
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRecipientSource('excel');
                          setRepeat(false); // match SendGrid Excel behavior
                        }}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                          recipientSource === 'excel'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                        disabled={isRunning}
                      >
                        Excel
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        {recipientSource === 'excel' ? 'Upload recipients (.xlsx)' : 'To Emails (comma-separated)'}
                      </label>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Parsed: <span className="font-medium">{recipients.length}</span>
                        {invalidRecipients.length ? (
                          <span className="text-red-600 dark:text-red-400"> (invalid: {invalidRecipients.length})</span>
                        ) : null}
                      </div>
                    </div>

                    {recipientSource === 'excel' ? (
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={(e) => handleExcelFile(e.target.files?.[0] || null)}
                          className="w-full text-sm text-slate-700 dark:text-slate-200"
                          disabled={isRunning}
                        />
                        {excelFileName ? (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Loaded: <span className="font-medium">{excelFileName}</span> ({excelRows.length} rows)
                          </div>
                        ) : null}
                        <div className="grid grid-cols-1 gap-2">
                          <select
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                            value={excelEmailColumn}
                            onChange={(e) => setExcelEmailColumn(e.target.value)}
                            disabled={!excelHeaders.length || isRunning}
                          >
                            <option value="">Email column…</option>
                            {excelHeaders.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                          <select
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                            value={excelJsonColumn}
                            onChange={(e) => setExcelJsonColumn(e.target.value)}
                            disabled={!excelHeaders.length || isRunning}
                          >
                            <option value="">JSON column (Generated Text)…</option>
                            {excelHeaders.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </div>

                        {placeholdersInTemplates.length ? (
                          <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-900">
                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">Placeholder mapping</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                              Sample JSON keys: <span className="font-medium">{jsonKeys.length}</span>
                            </div>
                            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                              {placeholdersInTemplates.map((k) => (
                                <div key={k} className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                                  <div className="text-[11px] font-mono text-slate-700 dark:text-slate-200">
                                    {'{{'}
                                    {k}
                                    {'}}'}
                                  </div>
                                  <select
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-[11px] text-slate-900 dark:text-slate-100"
                                    value={placeholderToJsonKey?.[k] || ''}
                                    onChange={(e) => setPlaceholderToJsonKey((prev) => ({ ...(prev || {}), [k]: e.target.value }))}
                                    disabled={!jsonKeys.length || isRunning}
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
                          </div>
                        ) : null}

                        {placeholdersInTemplates.length ? (
                          <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-900">
                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">Preview (row 1)</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                              Subject: <span className="font-medium text-slate-700 dark:text-slate-200">{previewSubject || '—'}</span>
                            </div>
                            <pre className="max-h-24 overflow-y-auto rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-[11px] text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                              {previewText || '—'}
                            </pre>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <textarea
                        className="w-full h-28 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                        value={toEmailsRaw}
                        onChange={(e) => setToEmailsRaw(e.target.value)}
                        placeholder={DEFAULT_TO}
                        disabled={isRunning}
                      />
                    )}

                    {invalidRecipients.length ? (
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 break-words">
                        Invalid: {invalidRecipients.slice(0, 8).join(', ')}
                        {invalidRecipients.length > 8 ? ' …' : ''}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">From email</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      placeholder={DEFAULT_FROM_EMAIL}
                      disabled={isRunning}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">From name</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      placeholder={DEFAULT_FROM_NAME}
                      disabled={isRunning}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Subject</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Mailgun test email"
                    disabled={isRunning}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Text</label>
                  <textarea
                    className="w-full h-36 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Hello from Mailgun…"
                    disabled={isRunning}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Mailgun sending domain</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder={DEFAULT_DOMAIN}
                      disabled={isRunning}
                    />
                    {domainMismatchHint ? <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">{domainMismatchHint}</div> : null}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Base URL</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder={DEFAULT_BASE_URL}
                      disabled={isRunning}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">API endpoint (optional override)</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                    value={endpointOverride}
                    onChange={(e) => setEndpointOverride(e.target.value)}
                    placeholder={computedEndpoint || 'https://api.mailgun.net/v3/YOUR_DOMAIN/messages'}
                    disabled={isRunning}
                  />
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    If set, we’ll send to this URL exactly. Otherwise we use: <span className="font-mono">{computedEndpoint || '—'}</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-5 space-y-4">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Throttling</div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Interval min (seconds)</label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                        value={intervalMinSec}
                        onChange={(e) => setIntervalMinSec(e.target.value)}
                        disabled={isRunning}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Interval max (seconds)</label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                        value={intervalMaxSec}
                        onChange={(e) => setIntervalMaxSec(e.target.value)}
                        disabled={isRunning}
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={repeat}
                      onChange={(e) => setRepeat(e.target.checked)}
                      disabled={isRunning || recipientSource === 'excel'}
                    />
                    Repeat continuously
                  </label>
                  {recipientSource === 'excel' ? (
                    <div className="text-xs text-slate-500 dark:text-slate-400">Excel runs are one-pass (repeat disabled), matching SendGrid Email Send.</div>
                  ) : null}

                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900 space-y-3">
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={burstPauseEnabled}
                        onChange={(e) => setBurstPauseEnabled(e.target.checked)}
                        disabled={isRunning}
                      />
                      Enable burst pause (pause after every N sends)
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Every N successful sends (min/max)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            min={1}
                            step={1}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                            value={pauseEveryMinSends}
                            onChange={(e) => setPauseEveryMinSends(e.target.value)}
                            disabled={isRunning || !burstPauseEnabled}
                          />
                          <input
                            type="number"
                            min={1}
                            step={1}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                            value={pauseEveryMaxSends}
                            onChange={(e) => setPauseEveryMaxSends(e.target.value)}
                            disabled={isRunning || !burstPauseEnabled}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Pause duration (minutes, min/max)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            min={1}
                            step={1}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                            value={pauseMinMinutes}
                            onChange={(e) => setPauseMinMinutes(e.target.value)}
                            disabled={isRunning || !burstPauseEnabled}
                          />
                          <input
                            type="number"
                            min={1}
                            step={1}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                            value={pauseMaxMinutes}
                            onChange={(e) => setPauseMaxMinutes(e.target.value)}
                            disabled={isRunning || !burstPauseEnabled}
                          />
                        </div>
                      </div>
                    </div>

                    {isRunning && burstPauseEnabled && burstUi?.nextPauseAfter ? (
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        Next burst pause after <span className="font-medium">{burstUi.nextPauseAfter}</span> sends
                        {typeof burstUi.remainingUntilPause === 'number' ? (
                          <>
                            {' '}
                            (remaining: <span className="font-medium">{burstUi.remainingUntilPause}</span>)
                          </>
                        ) : null}
                        {burstUi.lastPauseMinutes ? (
                          <>
                            {' '}
                            · last pause: <span className="font-medium">{burstUi.lastPauseMinutes} min</span>
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={isRunning ? stopBatch : startBatch}
                    disabled={sending && !isRunning}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 text-sm font-medium"
                  >
                    {isRunning ? 'Stop Batch' : sending ? 'Sending…' : 'Start Batch Send'}
                  </button>

                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <div>
                      Batch: <span className="font-medium">{batchStats.batch}</span> · Sent:{' '}
                      <span className="font-medium text-green-600 dark:text-green-400">{batchStats.totalSent}</span> · Failed:{' '}
                      <span className="font-medium text-red-600 dark:text-red-400">{batchStats.totalFailed}</span>
                    </div>
                    {batchStats.lastTo ? (
                      <div className="text-[11px] break-words">
                        Last: <span className="font-medium">{batchStats.lastTo}</span>{' '}
                        {batchStats.lastOk ? (
                          <span className="text-green-600 dark:text-green-400">✓</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">✗</span>
                        )}
                      </div>
                    ) : null}
                    {batchStats.lastError ? (
                      <div className="text-[11px] text-red-600 dark:text-red-400 break-words">Error: {batchStats.lastError}</div>
                    ) : null}
                  </div>
                </div>

                {recentEvents.length ? (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-900">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">Recent activity</div>
                    <div className="space-y-1 max-h-40 overflow-auto">
                      {recentEvents.map((ev, idx) => (
                        <div key={`${ev.ts}-${ev.to || 'pause'}-${idx}`} className="text-[11px] text-slate-700 dark:text-slate-200 break-words">
                          {ev.to ? (
                            <>
                              <span className={ev.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                {ev.ok ? '✓' : '✗'}
                              </span>{' '}
                              <span className="font-medium">{ev.to}</span>{' '}
                              <span className="text-slate-500 dark:text-slate-400">({ev.ms}ms)</span>
                              {!ev.ok && ev.error ? <span className="text-red-600 dark:text-red-400"> · {String(ev.error)}</span> : null}
                            </>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400">{ev.note || 'Pause'}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {recipientSource === 'excel' && excelResults.length ? (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Live status</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Total: <span className="font-medium">{excelProgress.total}</span> · Sent:{' '}
                        <span className="font-medium text-green-600 dark:text-green-400">{excelProgress.sent}</span> · Failed:{' '}
                        <span className="font-medium text-red-600 dark:text-red-400">{excelProgress.failed}</span>
                        {excelProgress.currentIndex ? (
                          <>
                            {' '}
                            · Processing: <span className="font-medium">{excelProgress.currentIndex}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className="max-h-40 overflow-auto rounded border border-slate-200 dark:border-slate-700">
                      <table className="min-w-full text-[11px]">
                        <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="text-left px-2 py-1 border-b border-slate-200 dark:border-slate-700">#</th>
                            <th className="text-left px-2 py-1 border-b border-slate-200 dark:border-slate-700">Email</th>
                            <th className="text-left px-2 py-1 border-b border-slate-200 dark:border-slate-700">Status</th>
                            <th className="text-left px-2 py-1 border-b border-slate-200 dark:border-slate-700">Result</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900">
                          {excelResults.map((r, idx) => (
                            <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                              <td className="px-2 py-1 text-slate-500 dark:text-slate-400">{idx + 1}</td>
                              <td className="px-2 py-1 font-mono text-slate-800 dark:text-slate-100">{r?.toEmail || '—'}</td>
                              <td className="px-2 py-1">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
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
                              <td className="px-2 py-1 text-slate-600 dark:text-slate-300">
                                {r?.status === 'sent' ? (
                                  <span className="text-slate-500 dark:text-slate-400">Sent</span>
                                ) : r?.status === 'failed' ? (
                                  <span className="text-red-600 dark:text-red-400">{r.error || 'Failed'}</span>
                                ) : (
                                  '—'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Result</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Shows the Mailgun API response payload.</div>
                  </div>
                </div>

                <textarea
                  className="w-full h-[70vh] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                  readOnly
                  value={prettyResult || 'Click “Start Batch Send” to see responses here.'}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

