import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import { useToast } from '../../contexts/ToastContext';
import adminApiService from '../../services/adminApiService';
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
 
  // Handle fenced blocks like ```json ... ```
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenceMatch?.[1]?.trim() || raw;
 
  try {
    return JSON.parse(candidate);
  } catch {
    // Try to find a JSON object substring
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
 
function getDefaultNewsletterTemplate() {
  const APP_URL = 'https://www.mymailgram.com';
  const LOGO_URL = `${APP_URL}/fav3-logo-512x512.png`;
 
  // High-converting, email-client-safe table layout inspired by the existing newsletter template.
  // Placeholders required by the user:
  // - {{opening_hook}}
  // - {{personalized_insight}}
  // - {{value_proposition}}
  // - {{call_to_action}}
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MyMailGram Newsletter</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8;">
  <!-- Preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; mso-hide:all;">
    {{opening_hook}}
  </div>
 
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f5f7fb;">
    <tr>
      <td align="center" style="padding:30px 10px;">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#ffffff; border-radius:14px; overflow:hidden;">
          <!-- Header -->
          <tr>
            <td align="center" valign="middle" style="padding:30px 24px 22px; text-align:center; vertical-align:middle; background:#0b1220;">
              <img src="${LOGO_URL}" alt="MyMailGram" width="56" height="56" style="display:block; margin:0 auto; border:0; outline:none; text-decoration:none;">
              <div style="font-family: Arial, Helvetica, sans-serif; font-size:13px; line-height:18px; color:#cbd5e1; padding-top:10px;">
                My Mail Gram (MMG)
              </div>
            </td>
          </tr>
 
          <!-- Hero -->
          <tr>
            <td style="padding:26px 40px 8px; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
              <h1 style="margin:0; font-size:24px; line-height:1.25; text-align:center; font-weight:800;">
                A smarter way to keep your community informed
              </h1>
              <div style="margin-top:10px; font-size:15px; line-height:1.6; text-align:center; color:#475569;">
                {{opening_hook}}
              </div>
            </td>
          </tr>
 
          <!-- Social proof / personalization -->
          <tr>
            <td style="padding:14px 40px 0; font-family:Arial, Helvetica, sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px;">
                <tr>
                  <td style="padding:16px 16px;">
                    <div style="font-size:12px; line-height:16px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.04em;">
                      Why this matters
                    </div>
                    <div style="margin-top:6px; font-size:14px; line-height:1.6; color:#334155;">
                      {{personalized_insight}}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
 
          <!-- Value proposition -->
          <tr>
            <td style="padding:14px 40px 0; font-family:Arial, Helvetica, sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px;">
                <tr>
                  <td style="padding:16px 16px;">
                    <div style="font-size:12px; line-height:16px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.04em;">
                      What you get
                    </div>
                    <div style="margin-top:6px; font-size:14px; line-height:1.6; color:#334155;">
                      {{value_proposition}}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
 
          <!-- CTA -->
          <tr>
            <td style="padding:22px 40px 6px; font-family:Arial, Helvetica, sans-serif; text-align:center;">
              <div style="font-size:15px; line-height:1.6; color:#334155;">
                {{call_to_action}}
              </div>
              <table align="center" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:16px;">
                <tr>
                  <td align="center" bgcolor="#1e40ff" style="border-radius:10px;">
                    <a href="${APP_URL}"
                       target="_blank"
                       style="display:inline-block; padding:14px 26px; font-size:15px;
                              font-family:Arial, Helvetica, sans-serif; color:#ffffff;
                              text-decoration:none; font-weight:800;">
                      Schedule a live demo
                    </a>
                  </td>
                </tr>
              </table>
              <div style="margin-top:12px; font-size:12px; line-height:16px; color:#64748b;">
                No pressure — just a quick walkthrough tailored to your team.
              </div>
            </td>
          </tr>
 
          <!-- Footer -->
          <tr>
            <td style="padding:20px 30px; background-color:#f8fafc; font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#64748b; text-align:center;">
              © 2026 MyMailGram · Smarter Outreach, Better Conversations
              <br><br>
              <a href="{{unsubscribe}}" style="color:#64748b; text-decoration:underline;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
 
export default function MauticCampaignSend() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const { success, error } = useToast();
 
  const [sidebarOpen, setSidebarOpen] = useState(false);
 
  // Campaign selection + sample record
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignsError, setCampaignsError] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignId, setCampaignId] = useState('campaign_tenant_1767269369393_zcg0ke');
  const [sampleRecord, setSampleRecord] = useState(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleError, setSampleError] = useState(null);
  const [sampleRecordNumber, setSampleRecordNumber] = useState(1);
  const [sampleNextToken, setSampleNextToken] = useState(null);
  // History of continuationTokens used to fetch the *current* record (pageSize=1).
  // Example: [null] => record #1, [null, t1] => record #2, etc.
  const [sampleTokenHistory, setSampleTokenHistory] = useState([null]);
 
  // Template + params
  const [fromAddress, setFromAddress] = useState('dan@mymailgram.com');
  const [fromName, setFromName] = useState('Dan from MyMailGram');
  const [subjectTemplate, setSubjectTemplate] = useState('MyMailGram Newsletter');
  const [htmlTemplate, setHtmlTemplate] = useState(getDefaultNewsletterTemplate());
  const [autoPlainText, setAutoPlainText] = useState(true);
  const [plainTextTemplate, setPlainTextTemplate] = useState('');
 
  const [generatedTextRaw, setGeneratedTextRaw] = useState('');
  const [generatedParams, setGeneratedParams] = useState({});
 
  // Mapping: placeholder -> contact column
  const [placeholderToColumn, setPlaceholderToColumn] = useState({});
 
  // Single send state
  const [singleToEmail, setSingleToEmail] = useState('');
  const [singleValues, setSingleValues] = useState({});
  const [sendingSingle, setSendingSingle] = useState(false);
  const [singleResult, setSingleResult] = useState(null);
 
  // Bulk send state
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkHeaders, setBulkHeaders] = useState([]);
  const [bulkEmailColumn, setBulkEmailColumn] = useState('email');
  const [bulkFirstNameColumn, setBulkFirstNameColumn] = useState('firstname');
  const [bulkLastNameColumn, setBulkLastNameColumn] = useState('lastname');
  const [sendingBulk, setSendingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ sent: 0, total: 0, lastError: null });
  const [bulkResults, setBulkResults] = useState([]);
 
  const placeholdersInTemplates = useMemo(() => {
    const combined = `${subjectTemplate || ''}\n${htmlTemplate || ''}\n${plainTextTemplate || ''}`;
    const re = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
    const keys = new Set();
    let m;
    while ((m = re.exec(combined))) {
      keys.add(m[1]);
    }
    return Array.from(keys).sort();
  }, [subjectTemplate, htmlTemplate, plainTextTemplate]);
 
  const paramKeys = useMemo(() => {
    const keys = Object.keys(generatedParams || {});
    return keys.sort();
  }, [generatedParams]);
 
  const allPlaceholderKeys = useMemo(() => {
    const keys = new Set([...placeholdersInTemplates, ...paramKeys]);
    return Array.from(keys).sort();
  }, [placeholdersInTemplates, paramKeys]);
 
  const availableColumns = useMemo(() => {
    const cols = new Set(bulkHeaders || []);
    // Also allow mapping to "built-in" campaign record fields for preview/testing.
    ['userid', 'login', 'name', 'public_email', 'fol_cnt'].forEach((c) => cols.add(c));
    return Array.from(cols).filter(Boolean).sort();
  }, [bulkHeaders]);
 
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
 
  // Load campaigns list (from campaignstats)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setCampaignsLoading(true);
      setCampaignsError(null);
      try {
        const res = await adminApiService.getCampaignStats({ search: '', sortBy: 'updated_at', sortOrder: 'desc' });
        if (!res?.success) throw new Error(res?.message || res?.error || 'Failed to load campaigns');
        const items = Array.isArray(res.items) ? res.items : [];
        if (mounted) {
          setCampaigns(items);
          // If the default campaign exists, keep it; otherwise pick the first campaign.
          const hasDefault = items.some((c) => c?.campaign_id === 'campaign_tenant_1767269369393_zcg0ke');
          if (!hasDefault && items[0]?.campaign_id) {
            setCampaignId(items[0].campaign_id);
          }
        }
      } catch (e) {
        if (mounted) setCampaignsError(e.message || 'Failed to load campaigns');
      } finally {
        if (mounted) setCampaignsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
 
  // Load a sample record to extract generated_text params
  useEffect(() => {
    let mounted = true;
    if (!campaignId) return;
    (async () => {
      setSampleLoading(true);
      setSampleError(null);
      setSampleRecord(null);
      setSampleRecordNumber(1);
      setSampleNextToken(null);
      setSampleTokenHistory([null]);
      try {
        const res = await adminApiService.getCampaignRecords(campaignId, { page: 1, pageSize: 1, continuationToken: null });
        if (!res?.success) throw new Error(res?.message || res?.error || 'Failed to load campaign records');
        const record = (res.items || [])[0] || null;
        if (mounted) setSampleRecord(record);
        if (mounted) setSampleNextToken(res.continuationToken || null);
 
        const gt = record?.openai_results?.generated_text;
        const rawText = typeof gt === 'string' ? gt : (gt ? JSON.stringify(gt, null, 2) : '');
        if (mounted) setGeneratedTextRaw(rawText);
 
        const parsed = extractJsonFromText(gt);
        if (mounted) {
          if (parsed && typeof parsed === 'object') {
            setGeneratedParams(parsed);
            // Common conventions: if OpenAI returns email content as JSON, prefill.
            const derivedSubject = parsed.subject || parsed.email_subject || parsed.emailSubject || '';
            const derivedHtml = parsed.html || parsed.newsletter_html || parsed.newsletterHtml || parsed.email_html || parsed.emailHtml || parsed.customHtml || '';
            const derivedSubjectLine = parsed.subject_line || parsed.subjectLine || '';
            const derivedFromName = parsed.from_name || parsed.fromName || '';
            const derivedFromAddress = parsed.from_address || parsed.fromAddress || '';
 
            if (derivedSubjectLine && typeof derivedSubjectLine === 'string') setSubjectTemplate(derivedSubjectLine);
            else if (derivedSubject && typeof derivedSubject === 'string') setSubjectTemplate(derivedSubject);
            if (derivedHtml && typeof derivedHtml === 'string') setHtmlTemplate(derivedHtml);
            if (derivedFromName && typeof derivedFromName === 'string') setFromName(derivedFromName);
            if (derivedFromAddress && typeof derivedFromAddress === 'string') setFromAddress(derivedFromAddress);
          } else {
            setGeneratedParams({});
          }
        }
      } catch (e) {
        if (mounted) setSampleError(e.message || 'Failed to load sample record');
      } finally {
        if (mounted) setSampleLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [campaignId]);

  const loadSampleRecordByToken = async (tokenToUse, nextRecordNumber, nextHistory) => {
    setSampleLoading(true);
    setSampleError(null);
    setSampleRecord(null);
    try {
      const res = await adminApiService.getCampaignRecords(campaignId, {
        page: 1,
        pageSize: 1,
        continuationToken: tokenToUse,
      });
      if (!res?.success) throw new Error(res?.message || res?.error || 'Failed to load campaign record');

      const record = (res.items || [])[0] || null;
      setSampleRecord(record);
      setSampleRecordNumber(nextRecordNumber);
      setSampleTokenHistory(nextHistory);
      setSampleNextToken(res.continuationToken || null);

      const gt = record?.openai_results?.generated_text;
      const rawText = typeof gt === 'string' ? gt : (gt ? JSON.stringify(gt, null, 2) : '');
      setGeneratedTextRaw(rawText);

      const parsed = extractJsonFromText(gt);
      if (parsed && typeof parsed === 'object') {
        setGeneratedParams(parsed);
        const derivedSubject = parsed.subject || parsed.email_subject || parsed.emailSubject || '';
        const derivedHtml =
          parsed.html ||
          parsed.newsletter_html ||
          parsed.newsletterHtml ||
          parsed.email_html ||
          parsed.emailHtml ||
          parsed.customHtml ||
          '';
        const derivedSubjectLine = parsed.subject_line || parsed.subjectLine || '';
        const derivedFromName = parsed.from_name || parsed.fromName || '';
        const derivedFromAddress = parsed.from_address || parsed.fromAddress || '';

        if (derivedSubjectLine && typeof derivedSubjectLine === 'string') setSubjectTemplate(derivedSubjectLine);
        else if (derivedSubject && typeof derivedSubject === 'string') setSubjectTemplate(derivedSubject);
        if (derivedHtml && typeof derivedHtml === 'string') setHtmlTemplate(derivedHtml);
        if (derivedFromName && typeof derivedFromName === 'string') setFromName(derivedFromName);
        if (derivedFromAddress && typeof derivedFromAddress === 'string') setFromAddress(derivedFromAddress);
      } else {
        setGeneratedParams({});
      }
    } catch (e) {
      console.error(e);
      setSampleError(e.message || 'Failed to load sample record');
    } finally {
      setSampleLoading(false);
    }
  };

  const goNextSampleRecord = async () => {
    if (!campaignId) return;
    if (!sampleNextToken) return;
    const tokenUsedForNext = sampleNextToken;
    const nextHistory = [...(sampleTokenHistory || [null]), tokenUsedForNext];
    await loadSampleRecordByToken(tokenUsedForNext, sampleRecordNumber + 1, nextHistory);
  };

  const goPrevSampleRecord = async () => {
    if (!campaignId) return;
    const hist = sampleTokenHistory || [null];
    if (hist.length <= 1) return;
    // Token that was used to fetch the previous record
    const prevTokenUsed = hist[hist.length - 2];
    const nextHistory = hist.slice(0, -1);
    await loadSampleRecordByToken(prevTokenUsed, Math.max(1, sampleRecordNumber - 1), nextHistory);
  };
 
  // Keep plain text template in sync when auto mode is on
  useEffect(() => {
    if (!autoPlainText) return;
    setPlainTextTemplate(htmlToPlainText(htmlTemplate));
  }, [htmlTemplate, autoPlainText]);
 
  // Prefill single values from generated params (if they are primitives)
  // Important: singleValues are treated as *manual overrides* only.
  // We do NOT auto-fill them from generated params; otherwise changing records
  // would keep sending the first record's content.
 
  const getPreviewValuesForRow = (row) => {
    const values = {};
    // 1) Start with any primitive params as defaults
    Object.entries(generatedParams || {}).forEach(([k, v]) => {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') values[k] = v;
    });
    // 2) Apply mapping from row columns
    allPlaceholderKeys.forEach((k) => {
      const col = placeholderToColumn?.[k];
      if (col && row && Object.prototype.hasOwnProperty.call(row, col)) {
        const v = row[col];
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          values[k] = v;
        }
      }
    });
    return values;
  };
 
  const getCurrentSampleRow = () => {
    if (!sampleRecord) return {};
    return {
      userid: sampleRecord.userid,
      login: sampleRecord.login,
      name: sampleRecord.name,
      public_email: sampleRecord.public_email,
      fol_cnt: sampleRecord.fol_cnt,
      // keep the raw record around too (sometimes mappings point at other columns)
      ...sampleRecord,
    };
  };

  const previewSampleRow = useMemo(() => {
    // Prefer first bulk row (if present), otherwise use campaign sample record fields.
    if (bulkRows?.length) return bulkRows[0];
    if (!sampleRecord) return null;
    return {
      userid: sampleRecord.userid,
      login: sampleRecord.login,
      name: sampleRecord.name,
      public_email: sampleRecord.public_email,
      fol_cnt: sampleRecord.fol_cnt,
    };
  }, [bulkRows, sampleRecord]);
 
  const previewValues = useMemo(() => getPreviewValuesForRow(previewSampleRow || {}), [previewSampleRow]);
  const previewSubject = useMemo(() => applyPlaceholders(subjectTemplate, previewValues), [subjectTemplate, previewValues]);
  const previewHtml = useMemo(() => applyPlaceholders(htmlTemplate, previewValues), [htmlTemplate, previewValues]);
  const previewPlainText = useMemo(() => applyPlaceholders(plainTextTemplate, previewValues), [plainTextTemplate, previewValues]);
 
  const sendOne = async ({ toEmail, toFirstName, toLastName, subject, html, plainText }) => {
    const res = await fetch('/api/mautic/send-single', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('sessionToken') || localStorage.getItem('token')
          ? { Authorization: `Bearer ${localStorage.getItem('sessionToken') || localStorage.getItem('token')}` }
          : {}),
      },
      body: JSON.stringify({
        toEmail,
        toFirstName,
        toLastName,
        fromAddress: fromAddress.trim(),
        fromName: fromName.trim(),
        subject,
        html,
        plainText,
        emailName: `Campaign Send (${campaignId}) - ${toEmail} - ${new Date().toISOString()}`,
      }),
    });
 
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      const msg = json?.error || `Send failed (HTTP ${res.status})`;
      throw new Error(msg);
    }
    return json;
  };
 
  const handleSendSingle = async () => {
    setSingleResult(null);
    const toEmail = singleToEmail.trim();
    if (!toEmail) return error('Recipient email is required.');
    if (!fromAddress.trim() || !fromName.trim()) return error('From name + from address are required.');
    if (!subjectTemplate.trim()) return error('Subject template is required.');
    if (!htmlTemplate.trim()) return error('HTML template is required.');
 
    setSendingSingle(true);
    try {
      // Always render using the CURRENT campaign record (the one you're previewing),
      // then apply *manual* overrides on top.
      const baseValues = getPreviewValuesForRow(getCurrentSampleRow());
      const overrides = {};
      Object.entries(singleValues || {}).forEach(([k, v]) => {
        // Only treat non-empty overrides as real overrides
        if (v === null || v === undefined) return;
        const s = String(v);
        if (s.trim() === '') return;
        overrides[k] = v;
      });
      const values = { ...baseValues, ...overrides };
      const subject = applyPlaceholders(subjectTemplate, values).trim();
      const html = applyPlaceholders(htmlTemplate, values);
      const plainText = applyPlaceholders(plainTextTemplate, values);
 
      const result = await sendOne({
        toEmail,
        toFirstName: String(values.firstname || values.first_name || '').trim(),
        toLastName: String(values.lastname || values.last_name || '').trim(),
        subject,
        html,
        plainText,
      });
 
      setSingleResult(result);
      success(`Sent to ${toEmail} (Mautic emailId: ${result.emailId})`);
    } catch (e) {
      console.error(e);
      error(e.message || 'Failed to send');
    } finally {
      setSendingSingle(false);
    }
  };
 
  const handleBulkFile = async (file) => {
    if (!file) return;
    setBulkFileName(file.name);
    setBulkRows([]);
    setBulkHeaders([]);
    setBulkResults([]);
    setBulkProgress({ sent: 0, total: 0, lastError: null });
 
    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!Array.isArray(json) || json.length === 0) {
        throw new Error('No rows found in file.');
      }
 
      const headers = Object.keys(json[0] || {});
      setBulkHeaders(headers);
      setBulkRows(json);
 
      // best-effort guesses
      const lower = headers.map((h) => ({ h, l: String(h).toLowerCase() }));
      const guessEmail = lower.find((x) => x.l === 'email' || x.l.includes('email'))?.h;
      const guessFirst = lower.find((x) => x.l === 'firstname' || x.l === 'first_name' || x.l.includes('first'))?.h;
      const guessLast = lower.find((x) => x.l === 'lastname' || x.l === 'last_name' || x.l.includes('last'))?.h;
      if (guessEmail) setBulkEmailColumn(guessEmail);
      if (guessFirst) setBulkFirstNameColumn(guessFirst);
      if (guessLast) setBulkLastNameColumn(guessLast);
 
      success(`Loaded ${json.length} rows from ${file.name}. (Bulk send will use first 5 only for now.)`);
    } catch (e) {
      console.error(e);
      error(e.message || 'Failed to read file');
    }
  };
 
  const handleSendBulk = async () => {
    if (!bulkRows?.length) return error('Upload a contacts file first.');
    if (!bulkEmailColumn) return error('Select the email column.');
 
    const maxToSend = Math.min(5, bulkRows.length);
    setSendingBulk(true);
    setBulkResults([]);
    setBulkProgress({ sent: 0, total: maxToSend, lastError: null });
 
    try {
      const nextResults = [];
      for (let i = 0; i < maxToSend; i++) {
        const row = bulkRows[i] || {};
        const toEmail = String(row[bulkEmailColumn] || '').trim();
        if (!toEmail) {
          nextResults.push({ index: i, success: false, error: `Missing email in column "${bulkEmailColumn}"` });
          setBulkProgress((p) => ({ ...p, sent: p.sent + 1, lastError: `Row ${i + 1}: missing email` }));
          continue;
        }
 
        const rowValues = getPreviewValuesForRow(row);
        const subject = applyPlaceholders(subjectTemplate, rowValues).trim();
        const html = applyPlaceholders(htmlTemplate, rowValues);
        const plainText = applyPlaceholders(plainTextTemplate, rowValues);
 
        try {
          const result = await sendOne({
            toEmail,
            toFirstName: String(row[bulkFirstNameColumn] || rowValues.firstname || rowValues.first_name || '').trim(),
            toLastName: String(row[bulkLastNameColumn] || rowValues.lastname || rowValues.last_name || '').trim(),
            subject,
            html,
            plainText,
          });
          nextResults.push({ index: i, success: true, emailId: result.emailId, contactId: result.contactId });
        } catch (e) {
          nextResults.push({ index: i, success: false, error: e.message || 'Send failed' });
          setBulkProgress((p) => ({ ...p, lastError: `Row ${i + 1}: ${e.message || 'Send failed'}` }));
        } finally {
          setBulkProgress((p) => ({ ...p, sent: p.sent + 1 }));
        }
      }
 
      setBulkResults(nextResults);
      success(`Bulk send finished (attempted ${maxToSend}).`);
    } finally {
      setSendingBulk(false);
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
              <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">
                Campaign Send (Mautic)
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Select a campaign from <span className="font-medium">Campaign Stats</span>, extract JSON parameters from the campaign’s “Generated Text”, preview the full send, then send via Mautic (single or bulk).
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Bulk testing is capped to <span className="font-medium">5 records</span>.
              </p>
            </div>
 
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-6">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Campaign</label>
                      <select
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                        value={campaignId}
                        onChange={(e) => setCampaignId(e.target.value)}
                      >
                        <option value="">— Choose a campaign —</option>
                        {campaigns.map((c) => (
                          <option key={c.campaign_id} value={c.campaign_id}>
                            {c.campaign_name || c.campaign_id}
                          </option>
                        ))}
                      </select>
                      {campaignsLoading ? (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Loading campaigns…</div>
                      ) : campaignsError ? (
                        <div className="text-xs text-rose-600 dark:text-rose-300 mt-1">{campaignsError}</div>
                      ) : null}
                    </div>
 
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Sample record</label>
                      <div className="text-xs text-slate-600 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-2">
                        {sampleLoading ? 'Loading…' : sampleError ? sampleError : sampleRecord?.public_email || sampleRecord?.login || '—'}
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Record <span className="font-medium">#{sampleRecordNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={goPrevSampleRecord}
                            disabled={sampleLoading || (sampleTokenHistory?.length || 1) <= 1}
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-xs font-medium"
                          >
                            Prev
                          </button>
                          <button
                            type="button"
                            onClick={goNextSampleRecord}
                            disabled={sampleLoading || !sampleNextToken}
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-xs font-medium"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
 
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Generated Text (raw)</label>
                    <textarea
                      className="w-full h-36 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                      value={generatedTextRaw}
                      onChange={(e) => setGeneratedTextRaw(e.target.value)}
                      placeholder="Loaded from the first record of this campaign…"
                    />
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Parsed params: <span className="font-medium">{Object.keys(generatedParams || {}).length}</span>
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
                    placeholder="Example: Hello {{name}}"
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
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Map placeholders to columns from your uploaded contacts file (or to campaign fields for preview).
                    </div>
                  </div>
 
                  {allPlaceholderKeys.length === 0 ? (
                    <div className="text-xs text-slate-500 dark:text-slate-400">No placeholders found yet.</div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {allPlaceholderKeys.map((k) => (
                        <div key={k} className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                          <div className="text-xs font-mono text-slate-700 dark:text-slate-200">
                            {'{{'}
                            {k}
                            {'}}'}
                          </div>
                          <select
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                            value={placeholderToColumn?.[k] || ''}
                            onChange={(e) => setPlaceholderToColumn((prev) => ({ ...prev, [k]: e.target.value }))}
                          >
                            <option value="">— (use generated/default value) —</option>
                            {availableColumns.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
 
                <div className="border-t border-slate-200 dark:border-slate-700 pt-5 space-y-4">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Single send</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">To (email)</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                        value={singleToEmail}
                        onChange={(e) => setSingleToEmail(e.target.value)}
                        placeholder="recipient@example.com"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleSendSingle}
                        disabled={sendingSingle}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 text-sm font-medium w-full"
                      >
                        {sendingSingle ? 'Sending…' : 'Send single'}
                      </button>
                    </div>
                  </div>
 
                  {allPlaceholderKeys.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Override placeholder values for this single send:</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-1">
                        {allPlaceholderKeys.map((k) => (
                          <div key={k}>
                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                              {k}
                            </label>
                            <input
                              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                              value={singleValues?.[k] ?? ''}
                              onChange={(e) => setSingleValues((prev) => ({ ...prev, [k]: e.target.value }))}
                              placeholder={String(getPreviewValuesForRow(getCurrentSampleRow())?.[k] ?? '(optional)')}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
 
                  {singleResult?.success ? (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Sent. <span className="font-medium">emailId</span>: {singleResult.emailId} · <span className="font-medium">contactId</span>: {singleResult.contactId}
                    </div>
                  ) : null}
                </div>
 
                <div className="border-t border-slate-200 dark:border-slate-700 pt-5 space-y-4">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Bulk send (file → Mautic)</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Upload contacts (.xlsx / .csv)</label>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => handleBulkFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-slate-700 dark:text-slate-200"
                      />
                      {bulkFileName ? (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Loaded: <span className="font-medium">{bulkFileName}</span> ({bulkRows.length} rows)
                        </div>
                      ) : null}
                    </div>
 
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <select
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                            value={bulkEmailColumn}
                            onChange={(e) => setBulkEmailColumn(e.target.value)}
                          >
                            <option value="">Email column…</option>
                            {bulkHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                          </select>
                          <select
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                            value={bulkFirstNameColumn}
                            onChange={(e) => setBulkFirstNameColumn(e.target.value)}
                          >
                            <option value="">First name…</option>
                            {bulkHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                          </select>
                          <select
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                            value={bulkLastNameColumn}
                            onChange={(e) => setBulkLastNameColumn(e.target.value)}
                          >
                            <option value="">Last name…</option>
                            {bulkHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
 
                        <button
                          type="button"
                          onClick={handleSendBulk}
                          disabled={sendingBulk || !bulkRows.length}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 text-sm font-medium"
                        >
                          {sendingBulk ? `Sending ${bulkProgress.sent}/${bulkProgress.total}…` : 'Send bulk (first 5)'}
                        </button>
 
                        {bulkProgress.total > 0 ? (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Progress: <span className="font-medium">{bulkProgress.sent}</span> / {bulkProgress.total}
                            {bulkProgress.lastError ? (
                              <div className="text-rose-600 dark:text-rose-300 mt-1">{bulkProgress.lastError}</div>
                            ) : null}
                          </div>
                        ) : null}
 
                        {bulkResults.length ? (
                          <div className="text-xs text-slate-600 dark:text-slate-300">
                            Results:
                            <div className="mt-1 max-h-28 overflow-y-auto pr-1 space-y-1">
                              {bulkResults.map((r) => (
                                <div key={r.index} className={r.success ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}>
                                  Row {r.index + 1}: {r.success ? `sent (emailId ${r.emailId})` : `failed (${r.error})`}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
 
              {/* Right: Preview */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Preview</div>
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
                  >
                    Copy rendered HTML
                  </button>
                </div>
 
                <div className="mb-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Sample row: <span className="font-medium">{bulkRows?.length ? 'from uploaded file (row 1)' : 'from campaign record (row 1)'}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Plain text preview (rendered):
                  </div>
                  <pre className="mt-1 max-h-24 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-[11px] text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                    {previewPlainText || '—'}
                  </pre>
                </div>
 
                <iframe
                  title="Email preview"
                  className="w-full h-[62vh] rounded-lg border border-slate-200 dark:border-slate-700 bg-white"
                  srcDoc={previewHtml || '<div style="font-family: Arial; padding: 16px; color:#64748b;">Fill in a template to preview.</div>'}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


