import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import SettingsSidebar from '../../partials/settings/SettingsSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessByokSettings } from '../../config/rbac';
import byokOpenAIService from '../../services/byokOpenAIService';

const KEY_TYPES = [
  { value: 'openai', label: 'OpenAI API key' },
  { value: 'mailgun', label: 'Mailgun API key' },
  { value: 'other', label: 'Other secret' },
];

function formatRef(id) {
  if (!id || id.length < 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function typeLabel(t) {
  const x = KEY_TYPES.find((k) => k.value === t);
  return x ? x.label : t || '—';
}

function BalanceHint({ summary }) {
  if (!summary || typeof summary !== 'object') return null;
  const spend = summary.organization?.costs?.totalSpendUsd;
  const cred = summary.dashboard?.credits?.totalAvailableUsd;
  const hard = summary.dashboard?.subscription?.hardLimitUsd;
  const inTok = summary.organization?.usageCompletions?.inputTokens;
  const outTok = summary.organization?.usageCompletions?.outputTokens;
  const models = summary.keyCheck?.modelCount;
  const parts = [];
  if (typeof spend === 'number') parts.push(`Spend (30d): $${spend.toFixed(4)}`);
  if (typeof cred === 'number') parts.push(`Credits (dash): $${cred.toFixed(2)}`);
  if (typeof hard === 'number') parts.push(`Hard limit: $${hard.toFixed(2)}`);
  if (inTok != null || outTok != null) {
    parts.push(`Tokens (30d): ${inTok ?? '—'} in / ${outTok ?? '—'} out`);
  }
  if (typeof models === 'number') parts.push(`Models: ${models}`);
  if (summary.message && typeof summary.message === 'string') {
    parts.push(summary.message.length > 120 ? `${summary.message.slice(0, 117)}…` : summary.message);
  }
  if (parts.length === 0) return null;
  return <span className="text-slate-600 dark:text-slate-400">{parts.join(' · ')}</span>;
}

export default function ByokKeys() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const [keyType, setKeyType] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [balanceBusy, setBalanceBusy] = useState(null);

  async function loadKeys() {
    try {
      setLoadingKeys(true);
      setError('');
      const result = await byokOpenAIService.listMyKeys();
      if (result?.success) {
        setItems(Array.isArray(result.items) ? result.items : []);
      } else {
        setItems([]);
        setError(result?.error || 'Failed to load keys');
      }
    } catch (e) {
      setError(e?.message || 'Failed to load keys');
    } finally {
      setLoadingKeys(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    if (!canAccessByokSettings(user)) return;
    loadKeys();
  }, [user, currentPath]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (!apiKey.trim()) {
        setError('Key or secret is required');
        return;
      }
      const result = await byokOpenAIService.submitKey({
        apiKey: apiKey.trim(),
        keyType,
        tenantId: keyType === 'openai' ? tenantId.trim() || undefined : undefined,
      });
      if (result?.success) {
        setApiKey('');
        setTenantId('');
        await loadKeys();
      } else {
        setError(result?.error || 'Failed to store key');
      }
    } catch (e2) {
      setError(e2?.message || 'Failed to store key');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBalance(referenceId) {
    setBalanceBusy(referenceId);
    setError('');
    try {
      const result = await byokOpenAIService.checkBalance(referenceId);
      if (result?.success === false && result?.error) {
        setError(result.error);
      }
      await loadKeys();
    } catch (e) {
      setError(e?.message || 'Balance check failed');
    } finally {
      setBalanceBusy(null);
    }
  }

  async function handleDelete(referenceId) {
    if (window.confirm('Remove this entry from the vault and delete metadata? This cannot be undone.')) {
      setError('');
      try {
        await byokOpenAIService.deleteKey(referenceId);
        await loadKeys();
      } catch (e) {
        setError(e?.message || 'Delete failed');
      }
    }
  }

  if (!user && !loading) return <Navigate to="/signin" replace />;
  if (user && !canAccessByokSettings(user)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">
                BYOK — API keys &amp; secrets
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
                Choose what kind of credential you are storing. Values are written only to the organization
                Secrets Vault (Azure Key Vault). This app keeps metadata only—you never see the secret again
                after you save it. You only have access to keys you stored yourself.
              </p>
            </div>

            {loading ? (
              <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm mb-8 p-6">
                <div className="animate-pulse text-slate-400">Loading…</div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm mb-8">
                <div className="flex flex-col md:flex-row md:-mr-px">
                  <SettingsSidebar />
                  <div className="flex-1 p-6 md:p-8 space-y-8">
                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/80 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100">
                      <strong>Secure storage:</strong> Secrets are stored exclusively in the Secrets Vault, not
                      in the database, logs, or browser storage. OpenAI billing snapshots are available only
                      for OpenAI keys via “Check balance”.
                    </div>

                    <section>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Add a key or secret
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Select the provider or “Other”, paste the value once, then save. Use a dedicated key
                        with limits where the provider allows it.
                      </p>
                      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Key type
                          </label>
                          <select
                            value={keyType}
                            onChange={(ev) => setKeyType(ev.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:text-slate-100"
                          >
                            {KEY_TYPES.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {keyType === 'other' ? 'Secret value' : 'API key'}
                          </label>
                          <input
                            type="password"
                            value={apiKey}
                            onChange={(ev) => setApiKey(ev.target.value)}
                            autoComplete="off"
                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:text-slate-100"
                            placeholder={
                              keyType === 'openai'
                                ? 'sk-…'
                                : keyType === 'mailgun'
                                  ? 'Paste your Mailgun private API key'
                                  : 'Your secret'
                            }
                          />
                        </div>
                        {keyType === 'openai' && (
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                              OpenAI Organization ID <span className="text-slate-400">(optional, org_…)</span>
                            </label>
                            <input
                              type="text"
                              value={tenantId}
                              onChange={(ev) => setTenantId(ev.target.value)}
                              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:text-slate-100"
                              placeholder="org_… — sent as OpenAI-Organization for Usage/Cost APIs"
                            />
                          </div>
                        )}
                        {error && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-50"
                        >
                          {submitting ? 'Saving to vault…' : 'Save key securely'}
                        </button>
                      </form>
                    </section>

                    <section>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Your stored credentials
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Metadata only: type, reference ID, vault secret name, and optional last balance snapshot
                        (OpenAI only).
                      </p>

                      {loadingKeys ? (
                        <div className="text-slate-500 text-sm">Loading…</div>
                      ) : items.length === 0 ? (
                        <p className="text-slate-500 text-sm">No keys registered yet.</p>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-900">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                  Type
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                  Reference
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                  Vault secret name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                  Created
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                  Last balance
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                              {items.map((row) => {
                                const kt = row.key_type || 'openai';
                                return (
                                  <tr key={row.reference_id}>
                                    <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-200">
                                      {typeLabel(kt)}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-mono text-slate-900 dark:text-slate-100">
                                      {formatRef(row.reference_id)}
                                    </td>
                                    <td className="px-4 py-3 text-xs font-mono text-slate-700 dark:text-slate-300">
                                      {row.vault_secret_name}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                      {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      <div className="space-y-1">
                                        <div className="text-xs text-slate-500">
                                          {row.last_balance_check_at
                                            ? new Date(row.last_balance_check_at).toLocaleString()
                                            : '—'}
                                        </div>
                                        <BalanceHint summary={row.last_balance_summary} />
                                        {row.last_balance_status && (
                                          <span className="text-xs text-slate-500">
                                            Status: {row.last_balance_status}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                      {kt === 'openai' && (
                                        <button
                                          type="button"
                                          onClick={() => handleBalance(row.reference_id)}
                                          disabled={balanceBusy === row.reference_id}
                                          className="mr-2 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                                        >
                                          {balanceBusy === row.reference_id ? 'Checking…' : 'Check balance'}
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleDelete(row.reference_id)}
                                        className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100"
                                      >
                                        Remove
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
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
