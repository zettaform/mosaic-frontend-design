import React, { useEffect, useState } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import secretsVaultService from '../../services/secretsVaultService';

function SecretRow({ secret, onDelete, onTest, testStatus }) {
  return (
    <tr className="divide-y divide-slate-200 dark:divide-slate-700">
      <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100 whitespace-nowrap">
        <span className="font-mono text-xs">{secret.name}</span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
        {secret.created_at ? new Date(secret.created_at).toLocaleString() : '—'}
      </td>
      <td className="px-4 py-3 text-right text-sm whitespace-nowrap">
        <div className="inline-flex gap-2">
          <button
            type="button"
            onClick={() => onTest(secret.name)}
            disabled={testStatus?.loading && testStatus?.name === secret.name}
            className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
          >
            {testStatus?.loading && testStatus?.name === secret.name ? 'Testing...' : 'Test'}
          </button>
          <button
            type="button"
            onClick={() => onDelete(secret.name)}
            className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function SecretsVault() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  // RBAC guard (in addition to ProtectedRoute; keeps behavior consistent with other admin pages).
  if (!user) return <Navigate to="/signin" replace />;
  const routeInfo = ROUTE_TO_SECTION[currentPath];
  if (!routeInfo || !hasAccess(user, routeInfo.section, routeInfo.page)) {
    return <Navigate to="/unauthorized" replace />;
  }

  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  const [testStatus, setTestStatus] = useState({ loading: false, name: null, ok: null });

  async function loadSecrets() {
    try {
      setLoading(true);
      setError('');
      const result = await secretsVaultService.listSecrets();
      if (result?.success) {
        setItems(Array.isArray(result.items) ? result.items : []);
      } else {
        setItems([]);
        setError(result?.error || 'Failed to load secrets');
      }
    } catch (e) {
      setError(e?.message || 'Failed to load secrets');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSecrets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStoreSecret(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!name.trim()) {
        setError('Secret Name is required');
        return;
      }
      if (!apiKey) {
        setError('API Key is required');
        return;
      }

      const result = await secretsVaultService.storeSecret({ name: name.trim(), apiKey });
      if (result?.success) {
        // SECURITY: Never display or persist the secret in the UI after submission.
        setName('');
        setApiKey('');
        await loadSecrets();
      } else {
        setError(result?.error || 'Failed to store secret');
      }
    } catch (e2) {
      setError(e2?.message || 'Failed to store secret');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(secretName) {
    if (!window.confirm('Delete this secret? This cannot be undone.')) return;
    setError('');
    try {
      const result = await secretsVaultService.deleteSecret(secretName);
      if (result?.success) {
        await loadSecrets();
      } else {
        setError(result?.error || 'Failed to delete secret');
      }
    } catch (e) {
      setError(e?.message || 'Failed to delete secret');
    }
  }

  async function handleTest(secretName) {
    setError('');
    setTestStatus({ loading: true, name: secretName, ok: null });
    try {
      const result = await secretsVaultService.testSecret(secretName);
      // SUCCESS/FAILURE only; no values should ever come back.
      setTestStatus({ loading: false, name: secretName, ok: !!result?.success });
    } catch (e) {
      setTestStatus({ loading: false, name: secretName, ok: false });
    } finally {
      // Reload list so the UI stays consistent after any vault-side changes.
      await loadSecrets();
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-5xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Secrets Vault
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Securely store API keys in Azure Key Vault. Secrets are never stored in the database.
              </p>
            </div>

            {/* Store form */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Store Secret
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Secrets are securely stored and cannot be viewed again
                  </p>
                </div>
              </div>

              <form onSubmit={handleStoreSecret} className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Secret Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="off"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="e.g. my-openai-key"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Enter API key"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Storing...' : 'Store Secret'}
                  </button>
                </div>
              </form>
            </div>

            {/* Saved secrets list */}
            <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Saved Secrets
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Only secret names and created dates are displayed.
                </p>
              </div>

              {loading ? (
                <div className="p-6 text-slate-600 dark:text-slate-300 text-sm">Loading...</div>
              ) : items.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-slate-700 dark:text-slate-200 font-medium">
                    No secrets saved yet
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Store a secret above to see it here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Secret Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      {items.map((secret) => (
                        <SecretRow
                          key={secret.name}
                          secret={secret}
                          onDelete={handleDelete}
                          onTest={handleTest}
                          testStatus={testStatus}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Subtle security-focused test feedback */}
              {testStatus?.ok !== null && !testStatus.loading && (
                <div
                  className={`px-6 py-3 text-sm border-t ${
                    testStatus.ok
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {testStatus.ok ? 'Test succeeded.' : 'Test failed.'}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

