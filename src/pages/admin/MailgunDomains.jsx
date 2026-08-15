import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import { useToast } from '../../contexts/ToastContext';
import { getApiUrl } from '../../utils/getBackendUrl';
import secretsVaultService from '../../services/secretsVaultService';
import byokOpenAIService from '../../services/byokOpenAIService';

function formatRef(id) {
  if (!id || id.length < 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function formatWhen(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return String(iso);
  }
}

function StateBadge({ state }) {
  const s = (state || '').toString().toLowerCase();
  const active = s === 'active';
  const cls = active
    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {state || 'unknown'}
    </span>
  );
}

function VerifiedBadge({ verified }) {
  const cls = verified
    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
    : 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {verified ? 'Verified' : 'Not verified'}
    </span>
  );
}

export default function MailgunDomains() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const { error: toastError } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [secretsLoading, setSecretsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [senders, setSenders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sendersCount, setSendersCount] = useState(0);
  const [baseUrlUsed, setBaseUrlUsed] = useState('');
  /** @type {{ name: string; label: string; referenceId?: string; source: 'byok' | 'vault' }[]} */
  const [tokenOptions, setTokenOptions] = useState([]);
  const [byokMailgun, setByokMailgun] = useState([]);
  const [selectedSecretName, setSelectedSecretName] = useState('');
  const [tokenSource, setTokenSource] = useState('');
  const [lastError, setLastError] = useState(null);
  const [section, setSection] = useState('domains');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderSignature, setSenderSignature] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [senderSaving, setSenderSaving] = useState(false);
  const [deletingSenderId, setDeletingSenderId] = useState(null);
  const [savingSignatureId, setSavingSignatureId] = useState(null);
  const [signatureModalSender, setSignatureModalSender] = useState(null);
  const [signatureModalValue, setSignatureModalValue] = useState('');

  function mergeTokenOptions(vaultItems, mailgunByokRows) {
    const map = new Map();
    (mailgunByokRows || []).forEach((row) => {
      const name = String(row.vault_secret_name || '').trim();
      if (!name) return;
      map.set(name, {
        name,
        label: `Mailgun BYOK · ${formatRef(row.reference_id)}`,
        referenceId: row.reference_id,
        source: 'byok',
      });
    });
    (vaultItems || []).forEach((s) => {
      const name = String(s?.name || '').trim();
      if (!name || map.has(name)) return;
      map.set(name, {
        name,
        label: name,
        referenceId: '',
        source: 'vault',
      });
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }

  async function loadSecrets() {
    setSecretsLoading(true);
    try {
      let secretItems = [];
      try {
        const result = await secretsVaultService.listSecrets();
        secretItems = Array.isArray(result?.items) ? result.items : [];
      } catch (e) {
        const msg = e?.message || '';
        if (!/403|Admin access required|Forbidden/i.test(msg)) {
          toastError(msg || 'Failed to load vault secrets');
        }
        secretItems = [];
      }
      let mgRows = [];
      try {
        const byok = await byokOpenAIService.listMyKeys();
        if (byok?.success && Array.isArray(byok.items)) {
          mgRows = byok.items.filter((row) => (row.key_type || 'openai') === 'mailgun');
        }
      } catch (e2) {
        toastError(e2?.message || 'Failed to load Mailgun BYOK keys');
      }
      setByokMailgun(mgRows);

      const merged = mergeTokenOptions(secretItems, mgRows);
      setTokenOptions(merged);
      setSelectedSecretName((prev) => {
        if (prev && merged.some((m) => m.name === prev)) return prev;
        return merged[0]?.name || '';
      });
    } catch (e) {
      toastError(e?.message || 'Failed to load token sources');
      setByokMailgun([]);
      setTokenOptions([]);
    } finally {
      setSecretsLoading(false);
    }
  }

  async function loadDomains(secretName = selectedSecretName) {
    if (!secretName) {
      setItems([]);
      setTotalCount(0);
      setBaseUrlUsed('');
      setTokenSource('');
      setLastError('Select a Mailgun token (add one under Settings → BYOK if needed).');
      return;
    }
    setLoading(true);
    setLastError(null);
    // Clear stale data while switching tokens so wrong-key attempts don't look successful.
    setItems([]);
    setTotalCount(0);
    try {
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      const refId = byokMailgun.find((r) => r.vault_secret_name === secretName)?.reference_id;
      const refQ =
        refId && String(refId).trim()
          ? `&referenceId=${encodeURIComponent(String(refId).trim())}`
          : '';
      const url = getApiUrl(
        `/mailgun/domains?secretName=${encodeURIComponent(secretName)}${refQ}`
      );
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const msg =
          json?.error ||
          (typeof json?.message === 'string' ? json.message : null) ||
          `Request failed (HTTP ${res.status})`;
        setLastError(msg);
        setItems([]);
        setTotalCount(0);
        toastError(msg);
        return;
      }
      setItems(Array.isArray(json.items) ? json.items : []);
      setTotalCount(typeof json.totalCount === 'number' ? json.totalCount : json.items?.length ?? 0);
      setBaseUrlUsed(json.baseUrl || '');
      setTokenSource(json.tokenSource || '');
    } catch (e) {
      const msg = e?.message || 'Failed to load domains';
      setLastError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function loadSenders(secretName = selectedSecretName) {
    if (!secretName) {
      setSenders([]);
      setSendersCount(0);
      return;
    }
    try {
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      const refId = byokMailgun.find((r) => r.vault_secret_name === secretName)?.reference_id;
      const refQ =
        refId && String(refId).trim()
          ? `&referenceId=${encodeURIComponent(String(refId).trim())}`
          : '';
      const url = getApiUrl(
        `/mailgun/senders?secretName=${encodeURIComponent(secretName)}${refQ}`
      );
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const msg = json?.error || `Failed to load senders (HTTP ${res.status})`;
        setLastError(msg);
        toastError(msg);
        return;
      }
      setSenders(Array.isArray(json.items) ? json.items : []);
      setSendersCount(typeof json.totalCount === 'number' ? json.totalCount : json.items?.length ?? 0);
    } catch (e) {
      const msg = e?.message || 'Failed to load senders';
      setLastError(msg);
      toastError(msg);
    }
  }

  async function createSender() {
    const email = String(senderEmail || '').trim().toLowerCase();
    const name = String(senderName || '').trim();
    if (!selectedSecretName) {
      toastError('Select a vault token first.');
      return;
    }
    if (!selectedDomain) {
      toastError('Select a domain.');
      return;
    }
    if (!email) {
      toastError('Sender email is required.');
      return;
    }
    if (!email.endsWith(`@${selectedDomain}`)) {
      toastError(`Sender email must end with @${selectedDomain}`);
      return;
    }

    setSenderSaving(true);
    setLastError(null);
    try {
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      const url = getApiUrl('/mailgun/senders');
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          secretName: selectedSecretName,
          referenceId: (() => {
            const id = byokMailgun.find((r) => r.vault_secret_name === selectedSecretName)?.reference_id;
            return id ? String(id).trim() : undefined;
          })(),
          senderEmail: email,
          senderName: name,
          emailSignature: senderSignature,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const msg = json?.error || `Failed to create sender (HTTP ${res.status})`;
        setLastError(msg);
        toastError(msg);
        return;
      }
      setSenderEmail('');
      setSenderName('');
      setSenderSignature('');
      await loadSenders(selectedSecretName);
    } catch (e) {
      const msg = e?.message || 'Failed to create sender';
      setLastError(msg);
      toastError(msg);
    } finally {
      setSenderSaving(false);
    }
  }

  async function removeSender(senderId) {
    if (!senderId) return;
    setDeletingSenderId(senderId);
    setLastError(null);
    try {
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      const url = getApiUrl(`/mailgun/senders/${encodeURIComponent(senderId)}`);
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const msg = json?.error || `Failed to remove sender (HTTP ${res.status})`;
        setLastError(msg);
        toastError(msg);
        return;
      }
      await loadSenders(selectedSecretName);
    } catch (e) {
      const msg = e?.message || 'Failed to remove sender';
      setLastError(msg);
      toastError(msg);
    } finally {
      setDeletingSenderId(null);
    }
  }

  function openSignatureModal(row) {
    setSignatureModalSender(row || null);
    setSignatureModalValue(String(row?.email_signature || ''));
  }

  function closeSignatureModal() {
    if (savingSignatureId) return;
    setSignatureModalSender(null);
    setSignatureModalValue('');
  }

  async function saveSenderSignature() {
    const senderId = signatureModalSender?.id || signatureModalSender?.rowKey;
    if (!senderId) return;
    setSavingSignatureId(senderId);
    setLastError(null);
    try {
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      const url = getApiUrl(`/mailgun/senders/${encodeURIComponent(senderId)}`);
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          emailSignature: String(signatureModalValue || ''),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const msg = json?.error || `Failed to update sender signature (HTTP ${res.status})`;
        setLastError(msg);
        toastError(msg);
        return;
      }
      await loadSenders(selectedSecretName);
      closeSignatureModal();
    } catch (e) {
      const msg = e?.message || 'Failed to update sender signature';
      setLastError(msg);
      toastError(msg);
    } finally {
      setSavingSignatureId(null);
    }
  }

  useEffect(() => {
    if (authLoading || !user) return;
    loadSecrets();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once when auth is ready
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user || !selectedSecretName) return;
    loadDomains(selectedSecretName);
    loadSenders(selectedSecretName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSecretName, authLoading, user, byokMailgun]);

  useEffect(() => {
    const firstDomain = items[0]?.name || '';
    setSelectedDomain((prev) => (prev && items.some((d) => d.name === prev) ? prev : firstDomain));
  }, [items]);

  const sectionButtonClass = useMemo(
    () => (name) =>
      `px-3 py-2 rounded-lg text-sm font-medium border ${
        section === name
          ? 'bg-indigo-600 border-indigo-600 text-white'
          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
      }`,
    [section]
  );

  if (authLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="sidebar-shell-main-noscroll">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center justify-center h-full">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
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
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">Mailgun Domains</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Domains and senders for the Mailgun account tied to the selected token. Choose a{' '}
                  <strong>Mailgun BYOK</strong> key you added under Settings, or another vault secret you are
                  allowed to use. Keys are read server-side from Azure Key Vault only. Saved senders are stored per
                  user in Azure Table Storage (<span className="font-mono">senders</span>) and persist for future
                  sends. Verification follows the same rule as the Domains list: Mailgun state{' '}
                  <span className="font-mono">active</span> counts as verified.
                </p>
                {baseUrlUsed ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    API base: <span className="font-mono">{baseUrlUsed}</span>
                    {tokenSource ? <> | Token source: <span className="font-mono">{tokenSource}</span></> : null}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col sm:items-end gap-2">
                <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Mailgun API token
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedSecretName}
                    onChange={(e) => setSelectedSecretName(e.target.value)}
                    disabled={secretsLoading}
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 min-w-[260px] max-w-[min(100vw-2rem,420px)]"
                  >
                    <option value="">{secretsLoading ? 'Loading tokens…' : 'Select a Mailgun token'}</option>
                    {byokMailgun.length > 0 ? (
                      <optgroup label="Your Mailgun BYOK keys (Settings → BYOK)">
                        {tokenOptions
                          .filter((o) => o.source === 'byok')
                          .map((o) => (
                            <option key={o.name} value={o.name}>
                              {o.label}
                            </option>
                          ))}
                      </optgroup>
                    ) : null}
                    {tokenOptions.some((o) => o.source === 'vault') ? (
                      <optgroup label="Other vault secrets">
                        {tokenOptions
                          .filter((o) => o.source === 'vault')
                          .map((o) => (
                            <option key={o.name} value={o.name}>
                              {o.label}
                            </option>
                          ))}
                      </optgroup>
                    ) : null}
                  </select>
                  <button
                    type="button"
                    onClick={() => loadDomains(selectedSecretName)}
                    disabled={loading || !selectedSecretName}
                    className="inline-flex justify-center items-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button type="button" className={sectionButtonClass('domains')} onClick={() => setSection('domains')}>
                    Domains
                  </button>
                  <button type="button" className={sectionButtonClass('senders')} onClick={() => setSection('senders')}>
                    Senders
                  </button>
                </div>
              </div>
            </div>

            {lastError ? (
              <div className="mb-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-800 dark:text-red-200">
                {lastError}
              </div>
            ) : null}

            {section === 'domains' ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Domain</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">State</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Wildcard</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Spam action</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">SMTP login</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {loading && !items.length ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                            <div className="inline-flex items-center gap-2">
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                              Loading domains…
                            </div>
                          </td>
                        </tr>
                      ) : null}
                      {!loading && items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                            No domains returned. Confirm the selected vault token and Mailgun account access.
                          </td>
                        </tr>
                      ) : null}
                      {items.map((row) => (
                        <tr key={row.name || row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/30">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100"><span className="font-mono text-xs sm:text-sm break-all">{row.name}</span></td>
                          <td className="px-4 py-3 text-sm"><StateBadge state={row.state} /></td>
                          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{row.wildcard ? 'Yes' : 'No'}</td>
                          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 capitalize">{row.spam_action || '—'}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400 break-all">{row.smtp_login || '—'}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatWhen(row.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {items.length > 0 ? (
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                    {totalCount} domain{totalCount === 1 ? '' : 's'} total
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Add sender from existing domains</h2>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <select
                      value={selectedDomain}
                      onChange={(e) => {
                        const domain = e.target.value;
                        setSelectedDomain(domain);
                        setSenderEmail((prev) => {
                          const localPart = String(prev || '').split('@')[0] || '';
                          return localPart && domain ? `${localPart}@${domain}` : prev;
                        });
                      }}
                      className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Select domain</option>
                      {items.map((d) => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Sender full name (e.g. Dylan Brooks)"
                      className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
                    />
                    <input
                      type="email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder={selectedDomain ? `name@${selectedDomain}` : 'name@domain.com'}
                      className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
                    />
                    <input
                      type="text"
                      value={senderSignature}
                      onChange={(e) => setSenderSignature(e.target.value)}
                      placeholder="Email signature (e.g. Thanks, Dylan)"
                      className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={createSender}
                      disabled={senderSaving || !selectedDomain || !senderEmail}
                      className="inline-flex justify-center items-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {senderSaving ? 'Saving…' : 'Add Sender'}
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                      <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Sender</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Domain</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Signature</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Verified</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Created by</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Created</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {!senders.length ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                              No senders saved yet for your account and this Mailgun token. Add one above; data is
                              stored in Azure Table Storage and kept until you remove it.
                            </td>
                          </tr>
                        ) : null}
                        {senders.map((row) => {
                          const sid = row.id || row.rowKey;
                          return (
                            <tr key={sid || row.sender_email} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/30">
                              <td className="px-4 py-3 font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 break-all">{row.sender_email}</td>
                              <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{row.sender_name || '—'}</td>
                              <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{row.domain_name || '—'}</td>
                              <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 max-w-[340px]">
                                <div className="whitespace-pre-wrap line-clamp-3 break-words">
                                  {row.email_signature || '—'}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <VerifiedBadge verified={Boolean(row.domain_verified)} />
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 break-all">{row.created_by || '—'}</td>
                              <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatWhen(row.created_at)}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="inline-flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => openSignatureModal(row)}
                                    disabled={!sid}
                                    className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 disabled:opacity-50"
                                  >
                                    Edit Signature
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => sid && removeSender(sid)}
                                    disabled={!sid || deletingSenderId === sid}
                                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                  >
                                    {deletingSenderId === sid ? 'Removing…' : 'Remove'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                    {sendersCount} sender{sendersCount === 1 ? '' : 's'} total
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      {signatureModalSender ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60"
            onClick={closeSignatureModal}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') closeSignatureModal();
            }}
          />
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl p-5 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit Email Signature</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Sender: <span className="font-mono">{signatureModalSender.sender_email}</span>
              </p>
            </div>
            <textarea
              value={signatureModalValue}
              onChange={(e) => setSignatureModalValue(e.target.value)}
              placeholder={'Thanks,\nJohn Doe\nCompany Name'}
              className="w-full min-h-[220px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeSignatureModal}
                disabled={Boolean(savingSignatureId)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSenderSignature}
                disabled={Boolean(savingSignatureId)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {savingSignatureId ? 'Saving…' : 'Save Signature'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
