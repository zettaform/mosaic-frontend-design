import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import byokOpenAIService from '../../services/byokOpenAIService';

function formatRef(id) {
  if (!id || id.length < 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
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

export default function OpenAIAdminKeys() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [balanceBusy, setBalanceBusy] = useState(null);

  async function loadAll() {
    try {
      setLoading(true);
      setError('');
      const result = await byokOpenAIService.listAllAdmin();
      if (result?.success) {
        setItems(Array.isArray(result.items) ? result.items : []);
      } else {
        setItems([]);
        setError(result?.error || 'Failed to load');
      }
    } catch (e) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    const ri = ROUTE_TO_SECTION[currentPath];
    if (!ri || !hasAccess(user, ri.section, ri.page)) return;
    loadAll();
  }, [user, currentPath]);

  async function handleBalance(referenceId) {
    setBalanceBusy(referenceId);
    setError('');
    try {
      const result = await byokOpenAIService.checkBalance(referenceId);
      if (result?.success === false && result?.error) {
        setError(result.error);
      }
      await loadAll();
    } catch (e) {
      setError(e?.message || 'Balance check failed');
    } finally {
      setBalanceBusy(null);
    }
  }

  async function handleDelete(referenceId) {
    if (!window.confirm('Delete vault secret and metadata for this registration?')) return;
    setError('');
    try {
      await byokOpenAIService.deleteKey(referenceId);
      await loadAll();
    } catch (e) {
      setError(e?.message || 'Delete failed');
    }
  }

  if (!user) return <Navigate to="/signin" replace />;
  const routeInfo = ROUTE_TO_SECTION[currentPath];
  if (!routeInfo || !hasAccess(user, routeInfo.section, routeInfo.page)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">OpenAI Admin Keys</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Metadata for all BYOK registrations (OpenAI, Mailgun, other). Secret values live only in the
                Secrets Vault—never in this table or the UI.
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">All registrations</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Includes user / tenant identifiers and vault references. Use “Check balance” to refresh billing
                  snapshots via OpenAI (keys are read server-side from Key Vault only).
                </p>
              </div>

              {loading ? (
                <div className="p-6 text-slate-600 dark:text-slate-300 text-sm">Loading…</div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                  No BYOK keys registered yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                          User ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                          Tenant
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
                          Last balance / status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      {items.map((row) => {
                        const kt = row.key_type || 'openai';
                        const typeLabel =
                          kt === 'mailgun' ? 'Mailgun' : kt === 'other' ? 'Other' : 'OpenAI';
                        return (
                        <tr key={`${row.user_id}-${row.reference_id}`}>
                          <td className="px-4 py-3 text-sm font-mono text-slate-800 dark:text-slate-200">
                            {row.user_id}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                            {row.user_email || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                            {typeLabel}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                            {row.tenant_id || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-xs">{formatRef(row.reference_id)}</td>
                          <td className="px-4 py-3 text-sm font-mono text-xs text-slate-700 dark:text-slate-300">
                            {row.vault_secret_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm max-w-xs">
                            <div className="text-xs text-slate-500">
                              {row.last_balance_check_at
                                ? new Date(row.last_balance_check_at).toLocaleString()
                                : 'Never'}
                            </div>
                            <BalanceHint summary={row.last_balance_summary} />
                            {row.last_balance_status && (
                              <div className="text-xs text-slate-500 mt-1">Status: {row.last_balance_status}</div>
                            )}
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
                              Delete
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
