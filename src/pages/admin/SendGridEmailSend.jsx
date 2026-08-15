import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import { useToast } from '../../contexts/ToastContext';

export default function SendGridEmailSend() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const { success, error } = useToast();

  const DEFAULT_FROM_NAME = 'Daniel Melnick';
  const DEFAULT_SIGNATURE_TEXT = '\n\nBest,\nDaniel Melnick';
  const DEFAULT_SIGNATURE_HTML = '<br><br>Best,<br>Daniel Melnick';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form state
  const [apiKey, setApiKey] = useState(''); // input only (never stored persistently)
  const [activeApiKey, setActiveApiKey] = useState(''); // in-memory only during a run

  const [toEmailsRaw, setToEmailsRaw] = useState('');
  const [toName, setToName] = useState('');
  const [fromEmail, setFromEmail] = useState('dan@mymailgram.com');
  const [fromName, setFromName] = useState(DEFAULT_FROM_NAME);
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');

  const [intervalSeconds, setIntervalSeconds] = useState(2);
  const [repeat, setRepeat] = useState(true);

  const [sending, setSending] = useState(false); // single in-flight request indicator
  const [isRunning, setIsRunning] = useState(false); // batch runner indicator
  const [lastResult, setLastResult] = useState(null);
  const [batchStats, setBatchStats] = useState({
    batch: 1,
    totalSent: 0,
    totalFailed: 0,
    lastTo: null,
    lastOk: null,
    lastError: null
  });
  const [recentEvents, setRecentEvents] = useState([]); // newest first

  const stopRef = useRef(false);
  const runIdRef = useRef(0);

  // Enterprise keep-awake (Wake Lock API)
  const [keepAwakeEnabled, setKeepAwakeEnabled] = useState(true);
  const wakeLockRef = useRef(null);

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

  useEffect(() => {
    // Stop any running loops on unmount.
    return () => {
      stopRef.current = true;
    };
  }, []);

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
    const onVis = async () => {
      if (document.visibilityState === 'visible' && isRunning) {
        await requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, keepAwakeEnabled]);

  const getApiBaseUrl = () => (import.meta.env.VITE_API_URL || '').trim();

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const randomIntInclusive = (min, max) => {
    const a = Math.ceil(min);
    const b = Math.floor(max);
    if (b <= a) return a;
    return Math.floor(Math.random() * (b - a + 1)) + a;
  };

  const extractJsonFromText = (value) => {
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
  };

  const applyPlaceholders = (template, values) => {
    const str = String(template || '');
    return str.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_m, key) => {
      const v = values?.[key];
      if (v === null || v === undefined) return `{{${key}}}`;
      return String(v);
    });
  };

  const normalizeKey = (key) =>
    String(key || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

  const parseEmails = (raw) => {
    // Split on commas, semicolons, whitespace, and newlines
    const parts = String(raw || '')
      .split(/[\s,;]+/g)
      .map((s) => s.trim())
      .filter(Boolean);

    // Deduplicate while preserving order (case-insensitive)
    const seen = new Set();
    const unique = [];
    for (const p of parts) {
      const key = p.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(p);
    }
    return unique;
  };

  // Recipient source: manual list or Excel upload
  const [recipientSource, setRecipientSource] = useState('manual'); // 'manual' | 'excel'
  const [excelFile, setExcelFile] = useState(null);
  const [excelFileName, setExcelFileName] = useState('');
  const [excelRows, setExcelRows] = useState([]);
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [excelEmailColumn, setExcelEmailColumn] = useState('');
  const [excelJsonColumn, setExcelJsonColumn] = useState('');
  const [placeholderToJsonKey, setPlaceholderToJsonKey] = useState({});
  const [intervalMinSec, setIntervalMinSec] = useState(1);
  const [intervalMaxSec, setIntervalMaxSec] = useState(2);

  const [excelResults, setExcelResults] = useState([]); // {status,toEmail,error?,appMessageId?,messageId?,startedAt?,finishedAt?}
  const [excelProgress, setExcelProgress] = useState({ total: 0, sent: 0, failed: 0, currentIndex: null, lastTo: null, lastError: null });

  const manualRecipients = useMemo(() => parseEmails(toEmailsRaw), [toEmailsRaw]);

  const excelRecipients = useMemo(() => {
    if (!excelRows?.length || !excelEmailColumn) return [];
    return excelRows
      .map((r) => String(r?.[excelEmailColumn] || '').trim())
      .filter(Boolean);
  }, [excelRows, excelEmailColumn]);

  const recipients = useMemo(() => (recipientSource === 'excel' ? excelRecipients : manualRecipients), [recipientSource, excelRecipients, manualRecipients]);

  const invalidRecipients = useMemo(() => {
    const list = recipients || [];
    return list.filter((r) => !emailRegex.test(r));
  }, [recipients, emailRegex]);

  const placeholdersInTemplates = useMemo(() => {
    const combined = `${subject || ''}\n${htmlContent || ''}\n${textContent || ''}`;
    const re = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
    const keys = new Set();
    let m;
    while ((m = re.exec(combined))) keys.add(m[1]);
    return Array.from(keys).sort();
  }, [subject, htmlContent, textContent]);

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
      const mapped = placeholderToJsonKey?.[ph];
      if (!mapped) return;
      if (values[ph] !== undefined) return;
      if (parsed && typeof parsed === 'object' && Object.prototype.hasOwnProperty.call(parsed, mapped)) {
        values[ph] = parsed[mapped];
      }
    });
    return values;
  };

  const previewValues = useMemo(() => (sampleRow ? getValuesForRow(sampleRow) : {}), [sampleRow, excelJsonColumn, placeholderToJsonKey, placeholdersInTemplates]);
  const previewSubject = useMemo(() => applyPlaceholders(subject, previewValues), [subject, previewValues]);
  const previewHtml = useMemo(() => applyPlaceholders(htmlContent, previewValues), [htmlContent, previewValues]);
  const previewText = useMemo(() => applyPlaceholders(textContent, previewValues), [textContent, previewValues]);

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
        }))
      );
      setExcelProgress({ total: json.length, sent: 0, failed: 0, currentIndex: null, lastTo: null, lastError: null });
      success(`Loaded ${json.length} rows from ${f.name}.`);
    } catch (e) {
      console.error(e);
      error(e.message || 'Failed to read file');
    }
  };


  const appendTextSignature = (input) => {
    const s = String(input || '');
    const trimmed = s.trim();
    if (!trimmed) return '';
    const alreadyHas = trimmed.trimEnd().endsWith(DEFAULT_SIGNATURE_TEXT.trim());
    return alreadyHas ? trimmed : `${trimmed}${DEFAULT_SIGNATURE_TEXT}`;
  };

  const appendHtmlSignature = (input) => {
    const s = String(input || '');
    const trimmed = s.trim();
    if (!trimmed) return '';

    const lower = trimmed.toLowerCase();
    const signatureVariants = [
      'best,<br>daniel melnick',
      'best,<br/>daniel melnick',
      'best,<br />daniel melnick',
    ];

    // If the HTML (case-insensitive) already ends with the signature, do nothing.
    const lowerNoWsEnd = lower.replace(/\s+$/g, '');
    if (signatureVariants.some((v) => lowerNoWsEnd.endsWith(v))) return trimmed;

    // Prefer inserting inside <body> if the template includes it.
    const bodyCloseIdx = lower.lastIndexOf('</body>');
    if (bodyCloseIdx !== -1) {
      const before = trimmed.slice(0, bodyCloseIdx).trimEnd();
      const after = trimmed.slice(bodyCloseIdx);
      const beforeLower = before.toLowerCase().replace(/\s+$/g, '');
      if (signatureVariants.some((v) => beforeLower.endsWith(v))) return `${before}${after}`;
      return `${before}${DEFAULT_SIGNATURE_HTML}${after}`;
    }

    return `${trimmed}${DEFAULT_SIGNATURE_HTML}`;
  };

  const sendOne = async ({ apiKeyToUse, toEmail, toNameOverride, subjectOverride, htmlOverride, textOverride }) => {
    const trimmedApiKey = String(apiKeyToUse || '').trim();
    const trimmedToEmail = String(toEmail || '').trim();
    const trimmedFromEmail = fromEmail.trim();
    const trimmedSubject = String(subjectOverride ?? subject).trim();
    const trimmedHtmlContent = String(htmlOverride ?? htmlContent).trim();
    const trimmedTextContent = String(textOverride ?? textContent).trim();

    const finalHtmlContent = trimmedHtmlContent ? appendHtmlSignature(trimmedHtmlContent) : '';
    const finalTextContent = trimmedTextContent ? appendTextSignature(trimmedTextContent) : '';

    if (!trimmedApiKey) {
      throw new Error('SendGrid API key is required.');
    }
    if (!trimmedApiKey.startsWith('SG.')) {
      throw new Error('That does not look like a SendGrid API key. SendGrid API keys typically start with "SG."');
    }
    if (!trimmedToEmail) {
      throw new Error('Recipient email is required.');
    }
    if (!emailRegex.test(trimmedToEmail)) {
      throw new Error(`Invalid recipient email format: ${trimmedToEmail}`);
    }
    if (!trimmedFromEmail) {
      throw new Error('Sender email is required.');
    }
    if (!emailRegex.test(trimmedFromEmail)) {
      throw new Error('Invalid sender email format.');
    }
    if (!trimmedSubject) {
      throw new Error('Subject is required.');
    }
    if (!finalHtmlContent && !finalTextContent) {
      throw new Error('Please provide either HTML content or plain text content.');
    }

    try {
      // Call backend endpoint that proxies to SendGrid API
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      const base = getApiBaseUrl();
      const normalizedBase = base.replace(/\/+$/, '');
      const url = normalizedBase ? `${normalizedBase}/api/sendgrid/send-single` : '/api/sendgrid/send-single';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          apiKey: trimmedApiKey,
          toEmail: trimmedToEmail,
          toName: String(toNameOverride ?? toName).trim() || undefined,
          fromEmail: trimmedFromEmail,
          fromName: fromName.trim() || undefined,
          subject: trimmedSubject,
          htmlContent: finalHtmlContent || undefined,
          textContent: finalTextContent || undefined
        })
      });

      const responseData = await response.json().catch(() => null);
      
      if (!response.ok) {
        const errorMessage = responseData?.error || responseData?.message || `Send failed (HTTP ${response.status})`;
        throw new Error(errorMessage);
      }

      if (!responseData?.success) {
        const errorMessage = responseData?.error || responseData?.message || 'Send failed';
        throw new Error(errorMessage);
      }

      return responseData;
    } catch (e) {
      console.error('SendGrid API error:', e);
      let errorMessage = 'Failed to send email via SendGrid';
      
      if (e instanceof TypeError && e.message.includes('fetch')) {
        errorMessage = 'Network error: Could not connect to server. Please ensure the backend server is running.';
      } else if (e.message) {
        errorMessage = e.message;
      }

      throw new Error(errorMessage);
    }
  };

  const startBatch = async () => {
    setLastResult(null);

    // Validate inputs before starting
    const trimmedApiKey = apiKey.trim();
    const trimmedFromEmail = fromEmail.trim();
    const trimmedSubject = subject.trim();
    const trimmedHtmlContent = htmlContent.trim();
    const trimmedTextContent = textContent.trim();

    if (!trimmedApiKey) {
      error('SendGrid API key is required.');
      return;
    }
    if (!trimmedApiKey.startsWith('SG.')) {
      error('That does not look like a SendGrid API key. SendGrid API keys typically start with "SG."');
      return;
    }
    if (recipientSource === 'excel') {
      if (!excelFile) {
        error('Upload an .xlsx file first.');
        return;
      }
      if (!excelEmailColumn) {
        error('Select the email column.');
        return;
      }
      if (!excelJsonColumn) {
        error('Select the JSON (Generated Text) column.');
        return;
      }
      if (!excelRows.length) {
        error('No rows found in the uploaded file.');
        return;
      }
      if (!recipients.length) {
        error('No recipient emails found in the selected email column.');
        return;
      }
      if (invalidRecipients.length) {
        const sample = invalidRecipients.slice(0, 5).join(', ');
        error(`Invalid recipient email(s) in Excel: ${sample}${invalidRecipients.length > 5 ? ' …' : ''}`);
        return;
      }
    } else {
      if (!recipients.length) {
        error('Please provide at least one recipient email (comma-separated).');
        return;
      }
      if (invalidRecipients.length) {
        const sample = invalidRecipients.slice(0, 5).join(', ');
        error(`Invalid recipient email(s): ${sample}${invalidRecipients.length > 5 ? ' …' : ''}`);
        return;
      }
    }
    if (!trimmedFromEmail) {
      error('Sender email is required.');
      return;
    }
    if (!emailRegex.test(trimmedFromEmail)) {
      error('Invalid sender email format.');
      return;
    }
    if (!trimmedSubject) {
      error('Subject is required.');
      return;
    }
    if (!trimmedHtmlContent && !trimmedTextContent) {
      error('Please provide either HTML content or plain text content.');
      return;
    }

    let delayMs = 0;
    let min = 0;
    let max = 0;
    if (recipientSource === 'excel') {
      min = Math.max(0, parseInt(intervalMinSec, 10) || 0);
      max = Math.max(min, parseInt(intervalMaxSec, 10) || 0);
    } else {
      const intervalNum = Number(intervalSeconds);
      if (!Number.isFinite(intervalNum) || intervalNum <= 0) {
        error('Interval must be a number greater than 0 (seconds).');
        return;
      }
      delayMs = Math.round(intervalNum * 1000);
    }

    // Start run
    stopRef.current = false;
    runIdRef.current += 1;
    const runId = runIdRef.current;

    setIsRunning(true);
    setSending(false);
    setActiveApiKey(trimmedApiKey); // in-memory only during run
    setApiKey(''); // clear input immediately after starting
    setBatchStats({
      batch: 1,
      totalSent: 0,
      totalFailed: 0,
      lastTo: null,
      lastOk: null,
      lastError: null
    });
    setRecentEvents([]);
    await requestWakeLock();
    if (recipientSource === 'excel') {
      setExcelResults(
        excelRows.map((r) => ({
          status: 'pending',
          toEmail: String(r?.[excelEmailColumn] || '').trim(),
          error: null,
          startedAt: null,
          finishedAt: null,
          appMessageId: null,
          messageId: null,
        }))
      );
      setExcelProgress({ total: excelRows.length, sent: 0, failed: 0, currentIndex: null, lastTo: null, lastError: null });
      success(`Started Excel batch: ${recipients.length} recipients, interval ${min}-${max}s`);
    } else {
      success(`Started batch send: ${recipients.length} recipients, interval ${Number(intervalSeconds)}s${repeat ? ' (repeating)' : ''}`);
    }

    let batch = 1;
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
        try {
          const values = getValuesForRow(row);
          const renderedSubject = applyPlaceholders(subject, values).trim();
          const renderedHtml = applyPlaceholders(htmlContent, values);
          const renderedText = applyPlaceholders(textContent, values);

          // Optional per-row name if present, else use global toName (if provided)
          const rowToName =
            String(values.to_name || values.name || values.full_name || values.fullname || '').trim() || String(toName || '').trim() || undefined;

          const responseData = await sendOne({
            apiKeyToUse: trimmedApiKey,
            toEmail,
            toNameOverride: rowToName,
            subjectOverride: renderedSubject,
            htmlOverride: renderedHtml,
            textOverride: renderedText,
          });

          sent++;
          const finishedAtIso = new Date().toISOString();
          setLastResult({ success: true, message: 'Email sent successfully', response: responseData });
          setBatchStats((prev) => ({
            ...prev,
            batch,
            totalSent: prev.totalSent + 1,
            lastTo: toEmail,
            lastOk: true,
            lastError: null
          }));
          setRecentEvents((prev) => {
            const next = [
              {
                ts: new Date().toISOString(),
                to: toEmail,
                ok: true,
                ms: Date.now() - startedAt,
                appMessageId: responseData?.appMessageId || null,
                messageId: responseData?.messageId || null
              },
              ...prev
            ];
            return next.slice(0, 25);
          });
          setExcelResults((prev) => {
            const next = [...prev];
            next[i] = {
              ...(next[i] || {}),
              status: 'sent',
              finishedAt: finishedAtIso,
              error: null,
              appMessageId: responseData?.appMessageId || null,
              messageId: responseData?.messageId || null,
            };
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
            lastError: msg
          }));
          setRecentEvents((prev) => {
            const next = [
              {
                ts: new Date().toISOString(),
                to: toEmail,
                ok: false,
                ms: Date.now() - startedAt,
                error: msg
              },
              ...prev
            ];
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
        const delaySec = randomIntInclusive(min, max);
        if (delaySec > 0) await sleep(delaySec * 1000);
      }
    } else {
      while (!stopRef.current && runIdRef.current === runId) {
        for (const toEmail of recipients) {
          if (stopRef.current || runIdRef.current !== runId) break;

          setSending(true);
          const startedAt = Date.now();
          try {
            const responseData = await sendOne({ apiKeyToUse: trimmedApiKey, toEmail });

            setLastResult({
              success: true,
              message: 'Email sent successfully',
              response: responseData
            });
            setBatchStats((prev) => ({
              ...prev,
              batch,
              totalSent: prev.totalSent + 1,
              lastTo: toEmail,
              lastOk: true,
              lastError: null
            }));
            setRecentEvents((prev) => {
              const next = [
                {
                  ts: new Date().toISOString(),
                  to: toEmail,
                  ok: true,
                  ms: Date.now() - startedAt,
                  appMessageId: responseData?.appMessageId || null,
                  messageId: responseData?.messageId || null
                },
                ...prev
              ];
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
              lastError: msg
            }));
            setRecentEvents((prev) => {
              const next = [
                {
                  ts: new Date().toISOString(),
                  to: toEmail,
                  ok: false,
                  ms: Date.now() - startedAt,
                  error: msg
                },
                ...prev
              ];
              return next.slice(0, 25);
            });
          } finally {
            setSending(false);
          }

          if (stopRef.current || runIdRef.current !== runId) break;
          await sleep(delayMs);
        }

        if (!repeat) break;
        batch += 1;
        setBatchStats((prev) => ({ ...prev, batch }));
      }
    }

    // Stop/cleanup
    setIsRunning(false);
    setSending(false);
    setActiveApiKey('');
    stopRef.current = true;
    await releaseWakeLock();
  };

  const stopBatch = async () => {
    stopRef.current = true;
    runIdRef.current += 1; // invalidate any in-flight loop
    setIsRunning(false);
    setSending(false);
    setActiveApiKey('');
    setExcelProgress((p) => ({ ...p, currentIndex: null }));
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
              <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">
                SendGrid Email Send
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Send emails via SendGrid SMTP. For batch runs, the API key is kept in memory only during the run (cleared on Stop / refresh).
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 mb-5">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={keepAwakeEnabled} onChange={(e) => setKeepAwakeEnabled(e.target.checked)} />
                Keep screen awake during batch runs (Wake Lock)
              </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: form */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-5">
                <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                  <div className="font-semibold mb-1">Important</div>
                  <div>
                    “Sent successfully” means SendGrid SMTP accepted/queued the message. Delivery can still fail later (suppression list, unverified sender,
                    spam filtering). Use the SMTP response below to look up the message in SendGrid Email Activity.
                  </div>
                </div>
                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    SendGrid API Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    autoComplete="off"
                    disabled={isRunning}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setApiKey('');
                        success('Cleared API key input (not stored).');
                      }}
                      disabled={isRunning}
                      className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium"
                    >
                      Clear
                    </button>
                    {isRunning ? (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        In-memory key active: <span className="font-medium">{activeApiKey ? 'Yes' : 'No'}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    This key is sent to the backend for this request only. It is not saved in the browser.
                  </div>
                </div>

                {/* Recipient */}
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
                        onClick={() => setRecipientSource('excel')}
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
                        {recipientSource === 'excel' ? 'Upload recipients (.xlsx)' : 'To Emails (comma-separated)'}{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Parsed: <span className="font-medium">{recipients.length}</span>
                        {invalidRecipients.length ? (
                          <span className="text-red-600 dark:text-red-400">
                            {' '}
                            (invalid: {invalidRecipients.length})
                          </span>
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
                      </div>
                    ) : (
                      <textarea
                        className="w-full h-28 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                        value={toEmailsRaw}
                        onChange={(e) => setToEmailsRaw(e.target.value)}
                        placeholder="lucindasmith7291@gmail.com,marcusrodriguez5042@gmail.com,..."
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">To Name (optional)</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                        value={toName}
                        onChange={(e) => setToName(e.target.value)}
                        placeholder="John Doe"
                        disabled={isRunning}
                      />
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        If set, it will be applied to every recipient.
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        {recipientSource === 'excel' ? 'Interval (seconds, min/max)' : 'Interval (seconds)'}{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      {recipientSource === 'excel' ? (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                            value={intervalMinSec}
                            onChange={(e) => setIntervalMinSec(e.target.value)}
                            disabled={isRunning}
                            placeholder="Min"
                          />
                          <input
                            type="number"
                            min={0}
                            step={1}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                            value={intervalMaxSec}
                            onChange={(e) => setIntervalMaxSec(e.target.value)}
                            disabled={isRunning}
                            placeholder="Max"
                          />
                        </div>
                      ) : (
                        <>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                            value={intervalSeconds}
                            onChange={(e) => setIntervalSeconds(e.target.value === '' ? '' : Number(e.target.value))}
                            disabled={isRunning}
                          />
                          <label className="mt-2 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={repeat}
                              onChange={(e) => setRepeat(e.target.checked)}
                              disabled={isRunning}
                            />
                            Repeat continuously
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                      From Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      placeholder="dan@mymailgram.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">From Name</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      placeholder="Daniel Melnick"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject line"
                  />
                </div>

                {/* HTML Content */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                      HTML Content
                    </label>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Optional (provide HTML, plain text, or both)
                    </div>
                  </div>
                  <textarea
                    className="w-full h-64 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    placeholder="<html><body><h1>Hello!</h1><p>This is your email content.</p></body></html>"
                  />
                </div>

                {/* Plain Text Content */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Plain Text Content</label>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Optional plain text version
                    </div>
                  </div>
                  <textarea
                    className="w-full h-28 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Plain text version of your email (optional)"
                  />
                </div>

                {/* Send Button */}
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
                    {lastResult?.success && lastResult?.response?.appMessageId ? (
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 break-words">
                        app_message_id: {String(lastResult.response.appMessageId)}
                      </div>
                    ) : null}
                  </div>
                </div>

                {recentEvents.length ? (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-900">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">Recent activity</div>
                    <div className="space-y-1 max-h-40 overflow-auto">
                      {recentEvents.map((ev, idx) => (
                        <div key={`${ev.ts}-${ev.to}-${idx}`} className="text-[11px] text-slate-700 dark:text-slate-200 break-words">
                          <span className={ev.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {ev.ok ? '✓' : '✗'}
                          </span>{' '}
                          <span className="font-medium">{ev.to}</span>{' '}
                          <span className="text-slate-500 dark:text-slate-400">({ev.ms}ms)</span>
                          {ev.ok && ev.appMessageId ? (
                            <span className="text-slate-500 dark:text-slate-400"> · {String(ev.appMessageId)}</span>
                          ) : null}
                          {!ev.ok && ev.error ? (
                            <span className="text-red-600 dark:text-red-400"> · {String(ev.error)}</span>
                          ) : null}
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
                                  <span className="text-slate-500 dark:text-slate-400">
                                    {r.appMessageId ? `app_message_id: ${String(r.appMessageId)}` : 'Sent'}
                                  </span>
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

              {/* Right: preview */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Preview</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {recipientSource === 'excel' ? (
                        <>
                          Row 1 subject: <span className="font-medium">{previewSubject || '—'}</span>
                        </>
                      ) : (
                        'This is how the HTML renders (approx.)'
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const toCopy = recipientSource === 'excel' ? previewHtml : htmlContent;
                        await navigator.clipboard.writeText(toCopy);
                        success('HTML copied to clipboard');
                      } catch {
                        error('Failed to copy HTML');
                      }
                    }}
                    disabled={!(recipientSource === 'excel' ? previewHtml?.trim() : htmlContent.trim())}
                    className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium"
                  >
                    Copy HTML
                  </button>
                </div>

                <iframe
                  title="Email preview"
                  className="w-full h-[70vh] rounded-lg border border-slate-200 dark:border-slate-700 bg-white"
                  srcDoc={
                    (recipientSource === 'excel' ? previewHtml : htmlContent) ||
                    '<div style="font-family: Arial; padding: 16px; color:#64748b;">Enter HTML content to preview.</div>'
                  }
                />

                {recipientSource === 'excel' ? (
                  <div className="mt-3">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Plain text preview (row 1):</div>
                    <pre className="mt-1 max-h-24 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-[11px] text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                      {previewText || '—'}
                    </pre>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
