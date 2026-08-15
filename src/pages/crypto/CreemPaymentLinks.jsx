import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import { getApiUrl } from '../../utils/getBackendUrl';
import toast from 'react-hot-toast';
import {
  Link2,
  CreditCard,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  DollarSign,
  Calendar,
  AlertCircle,
} from 'lucide-react';

const LINK_TYPE_ONETIME = 'onetime';
const LINK_TYPE_RECURRING = 'recurring';

const BILLING_PERIODS = [
  { value: 'every-month', label: 'Every month' },
  { value: 'every-three-months', label: 'Every 3 months' },
  { value: 'every-six-months', label: 'Every 6 months' },
  { value: 'every-year', label: 'Every year' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
];

function CreemPaymentLinks() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [linkType, setLinkType] = useState(LINK_TYPE_ONETIME);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [billingPeriod, setBillingPeriod] = useState('every-month');
  const [creating, setCreating] = useState(false);
  const [links, setLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [createdLink, setCreatedLink] = useState(null);
  const [pageWarning, setPageWarning] = useState(null);

  const location = useLocation();
  const currentPath = location?.pathname || '';
  const routeInfo = ROUTE_TO_SECTION[currentPath];
  const allowedByRole = user && routeInfo && hasAccess(user, routeInfo.section, routeInfo.page);
  if (!user) return <Navigate to="/signin" replace />;
  if (routeInfo && !allowedByRole) return <Navigate to="/unauthorized" replace />;

  const fetchLinks = useCallback(async () => {
    try {
      setLoadingLinks(true);
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      const res = await fetch(getApiUrl('/crypto/creem-payment-links'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (res.status === 401 ? 'Unauthorized' : 'Failed to load links'));
      }

      setLinks(data.links || []);
      setPageWarning(data.warnings?.[0]?.message || null);
    } catch (err) {
      toast.error(err.message || 'Failed to load payment links');
      setLinks([]);
      setPageWarning(null);
    } finally {
      setLoadingLinks(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error('Please enter a title for the payment.');
      return;
    }
    const amountNum = parseFloat(amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid positive amount.');
      return;
    }
    setCreating(true);
    setCreatedLink(null);
    try {
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      const res = await fetch(getApiUrl('/crypto/creem-payment-links'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          linkType,
          title: trimmedTitle,
          amount: amountNum,
          currency,
          billingPeriod: linkType === LINK_TYPE_RECURRING ? billingPeriod : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Request failed: ${res.status}`);
      }
      setCreatedLink(data);
      setTitle('');
      setAmount('');
      setPageWarning(data.warnings?.[0]?.message || null);
      toast.success(
        data.warnings?.length
          ? 'Payment link created. History sync is temporarily unavailable.'
          : 'Payment link created successfully.'
      );
      fetchLinks();
    } catch (err) {
      toast.error(err.message || 'Failed to create payment link.');
    } finally {
      setCreating(false);
    }
  };

  const copyUrl = (url, id) => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      toast.success('Link copied to clipboard.');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const formatAmount = (cents, curr) => {
    if (cents == null) return '—';
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: curr || 'USD',
    }).format(cents / 100);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Payment Links
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Create Creem.io payment links for one-time or recurring payments. Link history is stored in the internal payment history service.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchLinks}
                disabled={loadingLinks}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loadingLinks ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {pageWarning && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500 dark:text-amber-300" />
                  <div>
                    <h2 className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Degraded service
                    </h2>
                    <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                      {pageWarning}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Create link form */}
            <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                <Link2 className="h-5 w-5" />
                Create payment link
              </h2>
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Link type
                  </label>
                  <div className="flex gap-6">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="linkType"
                        value={LINK_TYPE_ONETIME}
                        checked={linkType === LINK_TYPE_ONETIME}
                        onChange={() => setLinkType(LINK_TYPE_ONETIME)}
                        className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <CreditCard className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-700 dark:text-slate-300">One-time payment</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="linkType"
                        value={LINK_TYPE_RECURRING}
                        checked={linkType === LINK_TYPE_RECURRING}
                        onChange={() => setLinkType(LINK_TYPE_RECURRING)}
                        className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-700 dark:text-slate-300">Recurring subscription</span>
                    </label>
                  </div>
                </div>

                {linkType === LINK_TYPE_RECURRING && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Billing period
                    </label>
                    <select
                      value={billingPeriod}
                      onChange={(e) => setBillingPeriod(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    >
                      {BILLING_PERIODS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="creem-title" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Title
                  </label>
                  <input
                    id="creem-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Premium plan, Donation, One-time fee"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="creem-amount" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Amount
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="creem-amount"
                        type="number"
                        min="1"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Enter amount in whole units (e.g. 9.99 for $9.99).
                    </p>
                  </div>
                  <div>
                    <label htmlFor="creem-currency" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Currency
                    </label>
                    <select
                      id="creem-currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-slate-800"
                  >
                    {creating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Creating…
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4" />
                        Create the link
                      </>
                    )}
                  </button>
                </div>
              </form>

              {createdLink?.checkoutUrl && (
                <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                  <p className="mb-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    Link created
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={createdLink.checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 truncate rounded bg-emerald-100 px-2 py-1 text-sm text-emerald-800 hover:underline dark:bg-emerald-800/50 dark:text-emerald-200"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate max-w-md">{createdLink.checkoutUrl}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => copyUrl(createdLink.checkoutUrl, 'created')}
                      className="inline-flex items-center gap-1 rounded bg-slate-200 px-2 py-1 text-sm text-slate-700 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500"
                    >
                      {copiedId === 'created' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Log of created links */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h2 className="border-b border-slate-200 px-4 py-3 text-lg font-semibold text-slate-900 dark:border-slate-700 dark:text-white sm:px-6">
                Created links (log)
              </h2>
              {loadingLinks ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : links.length === 0 ? (
                <div className="px-4 py-12 text-center text-slate-500 dark:text-slate-400 sm:px-6">
                  No payment links created yet. Create one above.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300 sm:px-6">
                          Title
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300 sm:px-6">
                          Type
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300 sm:px-6">
                          Amount
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300 sm:px-6">
                          Created
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300 sm:px-6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
                      {links.map((link) => (
                        <tr key={link.checkoutId || link.checkoutUrl} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900 dark:text-white sm:px-6">
                            {link.title || '—'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              link.linkType === 'recurring'
                                ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                            }`}>
                              {link.linkType === 'recurring' ? 'Recurring' : 'One-time'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                            {formatAmount(link.amountCents, link.currency)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                            {link.createdAt
                              ? new Date(link.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
                              : '—'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-sm sm:px-6">
                            <div className="flex items-center justify-end gap-1">
                              <a
                                href={link.checkoutUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-600 dark:hover:text-slate-200"
                                title="Open link"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                              <button
                                type="button"
                                onClick={() => copyUrl(link.checkoutUrl, link.checkoutId)}
                                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-600 dark:hover:text-slate-200"
                                title="Copy link"
                              >
                                {copiedId === link.checkoutId ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
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

export default CreemPaymentLinks;
