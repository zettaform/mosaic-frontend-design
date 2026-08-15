import React, { useState, useEffect } from 'react';

import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import Pagination from '../../components/Pagination';

const CryptoLogs = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    dateRange: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  });

  const statusOptions = ['all', 'pending', 'confirmed', 'failed', 'expired'];
  const typeOptions = ['all', 'payment', 'withdrawal', 'refund', 'fee'];
  const dateRangeOptions = ['all', 'today', 'week', 'month', 'year'];

  useEffect(() => {
    // Simulate loading transaction logs
    setTimeout(() => {
      const allLogs = [
        {
          id: '1',
          transactionId: 'tx_2024_001_abc123',
          type: 'payment',
          status: 'confirmed',
          amount: '0.001',
          currency: 'BTC',
          fromAddress: 'tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          toAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
          fee: '0.00001',
          network: 'testnet',
          blockHeight: 123456,
          confirmations: 6,
          createdAt: '2024-01-20T14:22:00Z',
          confirmedAt: '2024-01-20T14:25:00Z',
          description: 'Premium subscription payment',
          paymentLinkId: 'pay_premium_2024_001'
        },
        {
          id: '2',
          transactionId: 'tx_2024_002_def456',
          type: 'withdrawal',
          status: 'pending',
          amount: '0.0005',
          currency: 'BTC',
          fromAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
          toAddress: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sL5k7',
          fee: '0.000005',
          network: 'testnet',
          blockHeight: null,
          confirmations: 0,
          createdAt: '2024-01-20T15:30:00Z',
          confirmedAt: null,
          description: 'Withdrawal to external wallet',
          paymentLinkId: null
        },
        {
          id: '3',
          transactionId: 'tx_2024_003_ghi789',
          type: 'payment',
          status: 'failed',
          amount: '0.002',
          currency: 'BTC',
          fromAddress: 'tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          toAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
          fee: '0.00002',
          network: 'testnet',
          blockHeight: null,
          confirmations: 0,
          createdAt: '2024-01-20T16:45:00Z',
          confirmedAt: null,
          description: 'Service fee payment',
          paymentLinkId: 'pay_service_2024_003',
          errorMessage: 'Insufficient funds'
        },
        {
          id: '4',
          transactionId: 'tx_2024_004_jkl012',
          type: 'refund',
          status: 'confirmed',
          amount: '0.0015',
          currency: 'BTC',
          fromAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
          toAddress: 'tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          fee: '0.000015',
          network: 'testnet',
          blockHeight: 123457,
          confirmations: 3,
          createdAt: '2024-01-20T17:10:00Z',
          confirmedAt: '2024-01-20T17:15:00Z',
          description: 'Refund for cancelled service',
          paymentLinkId: 'pay_service_2024_002'
        },
        {
          id: '5',
          transactionId: 'tx_2024_005_mno345',
          type: 'fee',
          status: 'confirmed',
          amount: '0.0001',
          currency: 'BTC',
          fromAddress: 'tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          toAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
          fee: '0.000001',
          network: 'testnet',
          blockHeight: 123458,
          confirmations: 1,
          createdAt: '2024-01-20T18:00:00Z',
          confirmedAt: '2024-01-20T18:02:00Z',
          description: 'Network fee',
          paymentLinkId: null
        }
      ];
      
      // Generate more sample data for pagination testing
      for (let i = 6; i <= 50; i++) {
        allLogs.push({
          id: i.toString(),
          transactionId: `tx_2024_${i.toString().padStart(3, '0')}_${Math.random().toString(36).substring(2, 8)}`,
          type: ['payment', 'withdrawal', 'refund', 'fee'][Math.floor(Math.random() * 4)],
          status: ['confirmed', 'pending', 'failed', 'expired'][Math.floor(Math.random() * 4)],
          amount: (Math.random() * 0.01).toFixed(8),
          currency: 'BTC',
          fromAddress: `tb1q${Math.random().toString(36).substring(2, 42)}`,
          toAddress: `tb1q${Math.random().toString(36).substring(2, 42)}`,
          fee: (Math.random() * 0.0001).toFixed(8),
          network: 'testnet',
          blockHeight: 123450 + i,
          confirmations: Math.floor(Math.random() * 10),
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          confirmedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          description: `Transaction ${i} description`,
          paymentLinkId: Math.random() > 0.5 ? `pay_${i}_${Math.random().toString(36).substring(2, 8)}` : null
        });
      }
      
      setLogs(allLogs);
      setPagination(prev => ({
        ...prev,
        totalItems: allLogs.length,
        totalPages: Math.ceil(allLogs.length / prev.itemsPerPage)
      }));
      setLoading(false);
    }, 1000);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesStatus = filters.status === 'all' || log.status === filters.status;
    const matchesType = filters.type === 'all' || log.type === filters.type;
    const matchesSearch = searchTerm === '' || 
      log.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.fromAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.toAddress.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  // Update pagination when filters change
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
      totalItems: filteredLogs.length,
      totalPages: Math.ceil(filteredLogs.length / prev.itemsPerPage)
    }));
  }, [filteredLogs, pagination.itemsPerPage]);

  // Get paginated logs
  const paginatedLogs = filteredLogs.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  // Pagination handlers
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleItemsPerPageChange = (itemsPerPage) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage,
      currentPage: 1,
      totalPages: Math.ceil(prev.totalItems / itemsPerPage)
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'payment': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'withdrawal': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'refund': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'fee': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const formatAmount = (amount, currency) => {
    return `${parseFloat(amount).toFixed(8)} ${currency}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
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
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-20 bg-slate-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : (
              <>
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              Transaction Logs
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Monitor and track all crypto transactions and payments
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Transactions</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{logs.length}</p>
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
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Confirmed</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {logs.filter(log => log.status === 'confirmed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {logs.filter(log => log.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Failed</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {logs.filter(log => log.status === 'failed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
              >
                {typeOptions.map(option => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
              >
                {dateRangeOptions.map(option => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Transaction Logs Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Transaction History ({filteredLogs.length} transactions)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Confirmations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {log.description}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                          {log.transactionId}
                        </div>
                        {log.paymentLinkId && (
                          <div className="text-xs text-indigo-600 dark:text-indigo-400">
                            Link: {log.paymentLinkId}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(log.type)}`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      <div>
                        <div className="font-medium">{formatAmount(log.amount, log.currency)}</div>
                        {log.fee && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Fee: {formatAmount(log.fee, log.currency)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                      {log.errorMessage && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {log.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {log.confirmations}/6
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => copyToClipboard(log.transactionId)}
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Copy ID
                        </button>
                        <button className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300">
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {filteredLogs.length > 0 && (
          <div className="mt-8">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4"
            />
          </div>
        )}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">No transactions found</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Try adjusting your filters or search terms.
            </p>
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

export default CryptoLogs;