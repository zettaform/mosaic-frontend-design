import React, { useState, useEffect } from 'react';

import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import Pagination from '../../components/Pagination';

const PaymentGatewayLinks = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLink, setNewLink] = useState({
    name: '',
    description: '',
    amount: '',
    currency: 'BTC',
    expiresAt: '',
    webhookUrl: '',
    redirectUrl: ''
  });

  const currencies = ['BTC', 'ETH', 'USDT', 'LTC'];

  useEffect(() => {
    // Simulate loading payment links
    setTimeout(() => {
      setLinks([
        {
          id: '1',
          name: 'Premium Subscription',
          description: 'Monthly premium subscription payment',
          amount: '0.001',
          currency: 'BTC',
          status: 'active',
          linkId: 'pay_premium_2024_001',
          url: 'https://pay.example.com/link/premium_2024_001',
          qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==',
          expiresAt: '2024-02-15T23:59:59Z',
          createdAt: '2024-01-15T10:30:00Z',
          totalPayments: 5,
          totalAmount: '0.005',
          webhookUrl: 'https://api.example.com/webhooks/payment',
          redirectUrl: 'https://app.example.com/success'
        },
        {
          id: '2',
          name: 'One-time Donation',
          description: 'Support our development with a donation',
          amount: '0.0005',
          currency: 'BTC',
          status: 'active',
          linkId: 'donate_2024_002',
          url: 'https://pay.example.com/link/donate_2024_002',
          qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==',
          expiresAt: '2024-12-31T23:59:59Z',
          createdAt: '2024-01-16T09:15:00Z',
          totalPayments: 12,
          totalAmount: '0.006',
          webhookUrl: 'https://api.example.com/webhooks/donation',
          redirectUrl: 'https://app.example.com/thank-you'
        },
        {
          id: '3',
          name: 'Service Fee',
          description: 'Payment for premium service access',
          amount: '0.002',
          currency: 'BTC',
          status: 'expired',
          linkId: 'service_fee_2024_003',
          url: 'https://pay.example.com/link/service_fee_2024_003',
          qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==',
          expiresAt: '2024-01-20T23:59:59Z',
          createdAt: '2024-01-17T16:20:00Z',
          totalPayments: 3,
          totalAmount: '0.006',
          webhookUrl: 'https://api.example.com/webhooks/service',
          redirectUrl: 'https://app.example.com/service-success'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const generateLinkId = (name) => {
    return `pay_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-6)}`;
  };

  const generateUrl = (linkId) => {
    return `https://pay.example.com/link/${linkId}`;
  };

  const createPaymentLink = (e) => {
    e.preventDefault();
    const linkId = generateLinkId(newLink.name);
    const url = generateUrl(linkId);
    
    const linkData = {
      id: Date.now().toString(),
      name: newLink.name,
      description: newLink.description,
      amount: newLink.amount,
      currency: newLink.currency,
      status: 'active',
      linkId: linkId,
      url: url,
      qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==',
      expiresAt: newLink.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      totalPayments: 0,
      totalAmount: '0',
      webhookUrl: newLink.webhookUrl,
      redirectUrl: newLink.redirectUrl
    };

    setLinks([...links, linkData]);
    setNewLink({ name: '', description: '', amount: '', currency: 'BTC', expiresAt: '', webhookUrl: '', redirectUrl: '' });
    setShowCreateForm(false);
  };

  const toggleLinkStatus = (linkId) => {
    setLinks(links.map(link => 
      link.id === linkId 
        ? { ...link, status: link.status === 'active' ? 'inactive' : 'active' }
        : link
    ));
  };

  const deleteLink = (linkId) => {
    if (window.confirm('Are you sure you want to delete this payment link? This action cannot be undone.')) {
      setLinks(links.filter(link => link.id !== linkId));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  // Loading state is handled within the main component structure

  return (
    <div className="flex h-screen overflow-hidden crypto-page">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="sidebar-shell-main route-transition">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 page-content-smooth min-h-0">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
            
            {/* Loading state */}
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-slate-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : (
              <>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                Payment Gateway Links
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Create and manage payment links for crypto transactions
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Create Payment Link
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Links</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{links.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Links</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {links.filter(link => link.status === 'active' && !isExpired(link.expiresAt)).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {links.reduce((sum, link) => sum + parseFloat(link.totalAmount), 0).toFixed(8)} BTC
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Payments</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {links.reduce((sum, link) => sum + link.totalPayments, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Links Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Payment Links</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Link Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Payments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {links.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {link.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {link.description}
                        </div>
                        <div className="mt-1 flex items-center">
                          <code className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded font-mono">
                            {link.linkId}
                          </code>
                          <button
                            onClick={() => copyToClipboard(link.url)}
                            className="ml-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {link.amount} {link.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(link.status)}`}>
                        {isExpired(link.expiresAt) ? 'expired' : link.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {link.totalPayments} ({link.totalAmount} BTC)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {new Date(link.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                          View
                        </button>
                        <button
                          onClick={() => toggleLinkStatus(link.id)}
                          className={`${
                            link.status === 'active'
                              ? 'text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300'
                              : 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300'
                          }`}
                        >
                          {link.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deleteLink(link.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Payment Link Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-lg mx-4">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
                Create Payment Link
              </h3>
              <form onSubmit={createPaymentLink}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Link Name
                    </label>
                    <input
                      type="text"
                      value={newLink.name}
                      onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newLink.description}
                      onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Amount
                      </label>
                      <input
                        type="number"
                        step="0.00000001"
                        value={newLink.amount}
                        onChange={(e) => setNewLink({ ...newLink, amount: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Currency
                      </label>
                      <select
                        value={newLink.currency}
                        onChange={(e) => setNewLink({ ...newLink, currency: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                      >
                        {currencies.map(currency => (
                          <option key={currency} value={currency}>{currency}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Expires At
                    </label>
                    <input
                      type="datetime-local"
                      value={newLink.expiresAt}
                      onChange={(e) => setNewLink({ ...newLink, expiresAt: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      value={newLink.webhookUrl}
                      onChange={(e) => setNewLink({ ...newLink, webhookUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="https://api.example.com/webhooks/payment"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Redirect URL
                    </label>
                    <input
                      type="url"
                      value={newLink.redirectUrl}
                      onChange={(e) => setNewLink({ ...newLink, redirectUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="https://app.example.com/success"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    Create Link
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PaymentGatewayLinks;