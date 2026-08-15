import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import cryptoService from '../../services/cryptoService';

// Enhanced UI Components
const LoadingSpinner = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center justify-center py-12"
  >
    <div className="relative">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-indigo-300 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
    </div>
  </motion.div>
);

const StatusBadge = ({ status, className = "" }) => {
  const statusConfig = {
    unused: { 
      bg: 'bg-emerald-100 dark:bg-emerald-900/30', 
      text: 'text-emerald-800 dark:text-emerald-300',
      icon: '✓'
    },
    used: { 
      bg: 'bg-blue-100 dark:bg-blue-900/30', 
      text: 'text-blue-800 dark:text-blue-300',
      icon: '↗'
    },
    generating: { 
      bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
      text: 'text-yellow-800 dark:text-yellow-300',
      icon: '⟳',
      pulse: 'animate-pulse'
    },
    error: { 
      bg: 'bg-red-100 dark:bg-red-900/30', 
      text: 'text-red-800 dark:text-red-300',
      icon: '✗'
    }
  };
  
  const config = statusConfig[status] || statusConfig.unused;
  
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${config.pulse || ''} ${className}`}
    >
      <span className={`text-xs ${config.pulse || ''}`}>{config.icon}</span>
      {status}
    </motion.span>
  );
};

const AddressCard = ({ address, index, type, network, balance, transactions, status, created_at, onCopy, onQuery, onUseForPayment, isQuerying }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
            <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">#{index}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{type}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{network}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={status} />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onUseForPayment && onUseForPayment(address)}
            className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
            title="Use this address for payment link"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onQuery && onQuery(address)}
            disabled={isQuerying}
            className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded transition-colors disabled:cursor-not-allowed"
            title="Query address via AMB"
          >
            {isQuerying ? (
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCopy}
            className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </motion.button>
        </div>
      </div>
      
      <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg mb-3">
        <p className="font-mono text-sm break-all text-slate-900 dark:text-slate-100">
          {address}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-slate-500 dark:text-slate-400">Balance:</span>
          <p className="font-medium text-slate-900 dark:text-slate-100">{balance} BTC</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Transactions:</span>
          <p className="font-medium text-slate-900 dark:text-slate-100">{transactions}</p>
        </div>
      </div>
    </motion.div>
  );
};

const StatsCard = ({ title, value, subtitle, icon, trend, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <span className="text-indigo-600 dark:text-indigo-400 text-lg">{icon}</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {value}
      </div>
    </motion.div>
  );
};

const GeneratedAddressesLuxury = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'grid' or 'table'
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: 'index',
    direction: 'asc' // 'asc' or 'desc'
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  
  // Available page sizes
  const pageSizeOptions = [10, 20, 50, 100];
  
  const [stats, setStats] = useState({
    totalAddresses: 0,
    unusedAddresses: 0,
    usedAddresses: 0,
    totalBalance: '0.00000000'
  });
  const [queryingAddress, setQueryingAddress] = useState(null);
  const [ambResponse, setAmbResponse] = useState(null);
  const [showAmbModal, setShowAmbModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // RBAC: Check permissions instead of role
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  const routeInfo = ROUTE_TO_SECTION[currentPath];
  if (routeInfo) {
    const { section, page } = routeInfo;
    if (!hasAccess(user, section, page)) {
      console.log(`❌ Access denied: User ${user.email || user.user_id} (role: ${user.role}) attempted to access ${currentPath} (${section}/${page})`);
      return <Navigate to="/unauthorized" replace />;
    }
  } else {
    // Route not in ROUTE_TO_SECTION - deny access
    console.log(`❌ Access denied: Route ${currentPath} is not in ROUTE_TO_SECTION`);
    return <Navigate to="/unauthorized" replace />;
  }

  // Load addresses from the database
  const loadAddresses = async (page = 1, limit = null) => {
    try {
      setLoading(true);
      setError('');

      // Use provided limit or fall back to current pagination state
      const currentLimit = limit !== null ? limit : pagination.limit;

      console.log('🔍 Loading addresses page:', page, 'limit:', currentLimit);

      const data = await cryptoService.getAddresses(page, currentLimit);

      if (data.success) {
        const loadedAddresses = data.data?.addresses || [];
        const paginationData = data.data?.pagination || {
          page,
          limit: currentLimit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        };

        console.log('✅ Loaded addresses:', loadedAddresses.length, 'Pagination:', paginationData);

        setAddresses(loadedAddresses);
        setPagination(paginationData);

        // Use stats from backend (calculated from ALL addresses)
        const backendStats = data.data?.stats || {};
        setStats({
          totalAddresses: backendStats.totalAddresses || paginationData.total || 0,
          unusedAddresses: backendStats.unusedAddresses || 0,
          usedAddresses: backendStats.usedAddresses || 0,
          totalBalance: backendStats.totalBalance || '0.00000000'
        });
      } else {
        // Handle table not found error specifically
        let errorMsg = data.error || 'Failed to load addresses';
        if (errorMsg.includes('does not exist') || errorMsg.includes('table')) {
          errorMsg = `${errorMsg}${data.details ? `\n\n${data.details}` : ''}`;
        }
        console.error('❌ API returned success=false:', errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error loading addresses:', error);
      const errorMessage = error.message || 'Failed to load addresses. Please ensure the server is running and the endpoint is configured correctly.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Refresh addresses
  const refreshAddresses = async () => {
    await loadAddresses(pagination.page);
    setSuccess('Addresses refreshed successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  // Use address for payment link
  const useAddressForPayment = (address) => {
    // Store the selected address in localStorage for the payment links page
    localStorage.setItem('selectedPaymentAddress', JSON.stringify({
      address: address.address,
      index: address.index,
      type: address.type,
      network: address.network,
      balance: address.balance,
      status: address.status
    }));

    // Navigate to payment links page
    navigate('/crypto/payment-links-luxury');
  };

  // Query Bitcoin address via AMB
  const queryAddressViaAMB = async (address) => {
    try {
      setQueryingAddress(address);
      setError('');

      console.log('🔍 Querying address via AMB:', address);

      // Use cryptoService if it had this method, otherwise use direct API call
      // For now, let's use the centralized API service directly
      const api = (await import('../../services/api.js')).default;
      const response = await api.get(`/crypto/addresses/${encodeURIComponent(address)}/query`);

      if (response.data.success) {
        setAmbResponse(response.data);
        setShowAmbModal(true);

        // Refresh addresses to show updated balance
        await loadAddresses(pagination.page);
        setSuccess(`Balance updated: ${response.data.balance} BTC`);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        throw new Error(response.data.error || 'Failed to query address');
      }
    } catch (error) {
      console.error('❌ Error querying address:', error);
      setError(error.message || 'Failed to query Bitcoin address');
    } finally {
      setQueryingAddress(null);
    }
  };

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        // Toggle direction if clicking same column
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      // New column - default to ascending
      return {
        key,
        direction: 'asc'
      };
    });
  };

  // Sort addresses based on sortConfig
  // Note: Backend already sorts by index ascending by default
  const getSortedAddresses = (addressesToSort) => {
    // If no sort config or sorting by index ascending (default), return as-is (backend already sorted)
    if (!sortConfig.key || (sortConfig.key === 'index' && sortConfig.direction === 'asc')) {
      // Backend already sorted by index ascending, so return as-is unless user changed sort
      return addressesToSort;
    }
    
    return [...addressesToSort].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      // Handle different data types
      if (sortConfig.key === 'index') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else if (sortConfig.key === 'balance') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else if (sortConfig.key === 'transactions') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else if (sortConfig.key === 'created_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else {
        // String comparison
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    loadAddresses(newPage);
  };

  // Handle page size change
  const handlePageSizeChange = (newSize) => {
    setPagination(prev => ({
      ...prev,
      limit: newSize,
      page: 1 // Reset to first page when changing size
    }));
    // Reload addresses with new page size - pass limit directly to avoid stale state
    loadAddresses(1, newSize);
  };

  useEffect(() => {
    loadAddresses(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
            
            {/* Page header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Generated Addresses</h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">View and manage all generated Bitcoin mainnet addresses</p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/crypto/btc-xpub-generator"
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Generate New Addresses
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={refreshAddresses}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Error/Success messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6"
                >
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-6"
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <StatsCard
                title="Total Addresses"
                value={stats.totalAddresses}
                subtitle="All generated addresses"
                icon="🔗"
              />
              <StatsCard
                title="Unused Addresses"
                value={stats.unusedAddresses}
                subtitle="Available for use"
                icon="⚡"
              />
              <StatsCard
                title="Used Addresses"
                value={stats.usedAddresses}
                subtitle="Already in use"
                icon="✅"
              />
              <StatsCard
                title="Total Balance"
                value={`${stats.totalBalance} BTC`}
                subtitle="Combined balance"
                icon="💰"
              />
            </motion.div>

            {/* Addresses Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Address List</h2>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Showing {addresses.length} of {pagination.total} addresses
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                    className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    {viewMode === 'grid' ? 'Table View' : 'Grid View'}
                  </motion.button>
                </div>
              </div>

              {loading ? (
                <LoadingSpinner />
              ) : addresses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-slate-400 dark:text-slate-500 text-6xl mb-4">🔗</div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No addresses found</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">Generate some addresses to get started</p>
                  <Link
                    to="/crypto/btc-xpub-generator"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Generate Addresses
                  </Link>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getSortedAddresses(addresses).map((address, index) => (
                    <AddressCard
                      key={address.address || index}
                      address={address.address}
                      index={address.index}
                      type={address.type}
                      network={address.network}
                      balance={address.balance}
                      transactions={address.transactions}
                      status={address.status}
                      created_at={address.created_at}
                      onCopy={() => copyToClipboard(address.address)}
                      onQuery={queryAddressViaAMB}
                      onUseForPayment={useAddressForPayment}
                      isQuerying={queryingAddress === address.address}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors select-none"
                          onClick={() => handleSort('index')}
                        >
                          <div className="flex items-center gap-2">
                            Index
                            {sortConfig.key === 'index' && (
                              <span className="text-indigo-600 dark:text-indigo-400">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors select-none"
                          onClick={() => handleSort('address')}
                        >
                          <div className="flex items-center gap-2">
                            Address
                            {sortConfig.key === 'address' && (
                              <span className="text-indigo-600 dark:text-indigo-400">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors select-none"
                          onClick={() => handleSort('type')}
                        >
                          <div className="flex items-center gap-2">
                            Type
                            {sortConfig.key === 'type' && (
                              <span className="text-indigo-600 dark:text-indigo-400">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors select-none"
                          onClick={() => handleSort('network')}
                        >
                          <div className="flex items-center gap-2">
                            Network
                            {sortConfig.key === 'network' && (
                              <span className="text-indigo-600 dark:text-indigo-400">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors select-none"
                          onClick={() => handleSort('balance')}
                        >
                          <div className="flex items-center gap-2">
                            Balance
                            {sortConfig.key === 'balance' && (
                              <span className="text-indigo-600 dark:text-indigo-400">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors select-none"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center gap-2">
                            Status
                            {sortConfig.key === 'status' && (
                              <span className="text-indigo-600 dark:text-indigo-400">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors select-none"
                          onClick={() => handleSort('created_at')}
                        >
                          <div className="flex items-center gap-2">
                            Created
                            {sortConfig.key === 'created_at' && (
                              <span className="text-indigo-600 dark:text-indigo-400">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      {getSortedAddresses(addresses).map((address, index) => (
                        <motion.tr
                          key={address.address || index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                            {address.index}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-900 dark:text-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-xs">{address.address}</span>
                              <button
                                onClick={() => copyToClipboard(address.address)}
                                className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                              {address.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                            {address.network}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                            {address.balance} BTC
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                            <StatusBadge status={address.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                            {new Date(address.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => useAddressForPayment(address)}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
                                title="Use this address for payment link"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                                Use
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => queryAddressViaAMB(address.address)}
                                disabled={queryingAddress === address.address}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white text-xs font-medium rounded transition-colors disabled:cursor-not-allowed flex items-center gap-1"
                                title="Query address balance and transactions via AMB"
                              >
                                {queryingAddress === address.address ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                    Querying...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Query
                                  </>
                                )}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => copyToClipboard(address.address)}
                                className="px-3 py-1.5 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs font-medium"
                              >
                                Copy
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Enhanced Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} addresses
                  </div>
                  
                  {/* Page size selector */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600 dark:text-slate-400">Per page:</label>
                    <select
                      value={pagination.limit}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      disabled={loading}
                      className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {pageSizeOptions.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(1)}
                      disabled={!pagination.hasPrev || loading}
                      className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="First page"
                    >
                      ««
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrev || loading}
                      className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </motion.button>
                    
                    {/* Page numbers - improved */}
                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages = [];
                        const maxVisible = 7;
                        let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
                        let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
                        
                        // Adjust if near the end
                        if (endPage - startPage < maxVisible - 1) {
                          startPage = Math.max(1, endPage - maxVisible + 1);
                        }
                        
                        // First page
                        if (startPage > 1) {
                          pages.push(
                            <motion.button
                              key={1}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handlePageChange(1)}
                              className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                            >
                              1
                            </motion.button>
                          );
                          if (startPage > 2) {
                            pages.push(
                              <span key="ellipsis1" className="px-2 text-slate-500">...</span>
                            );
                          }
                        }
                        
                        // Visible pages
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <motion.button
                              key={i}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handlePageChange(i)}
                              disabled={loading}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                i === pagination.page
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {i}
                            </motion.button>
                          );
                        }
                        
                        // Last page
                        if (endPage < pagination.totalPages) {
                          if (endPage < pagination.totalPages - 1) {
                            pages.push(
                              <span key="ellipsis2" className="px-2 text-slate-500">...</span>
                            );
                          }
                          pages.push(
                            <motion.button
                              key={pagination.totalPages}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handlePageChange(pagination.totalPages)}
                              className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                            >
                              {pagination.totalPages}
                            </motion.button>
                          );
                        }
                        
                        return pages;
                      })()}
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext || loading}
                      className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(pagination.totalPages)}
                      disabled={!pagination.hasNext || loading}
                      className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Last page"
                    >
                      »»
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      {/* AMB Query Results Modal */}
      <AnimatePresence>
        {showAmbModal && ambResponse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAmbModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">AMB Query Results</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Address: {ambResponse.address}
                  </p>
                </div>
                <button
                  onClick={() => setShowAmbModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Summary Section */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Balance</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{ambResponse.balance} BTC</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Transactions</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{ambResponse.transactionCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total Received</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{ambResponse.totalReceived?.toFixed(8) || '0.00000000'} BTC</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
                    <StatusBadge status={ambResponse.status || 'unused'} />
                  </div>
                </div>
              </div>

              {/* Full JSON Response */}
              <div className="flex-1 overflow-auto px-6 py-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Full AMB Response (JSON)</h3>
                  <div className="bg-slate-900 rounded-lg p-4 overflow-auto">
                    <pre className="text-xs text-slate-100 font-mono">
                      {JSON.stringify(ambResponse.ambFullResponse || ambResponse, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Transaction Details */}
                {ambResponse.transactions && ambResponse.transactions.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Transactions ({ambResponse.transactions.length})
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 max-h-64 overflow-auto">
                      <pre className="text-xs text-slate-900 dark:text-slate-100 font-mono">
                        {JSON.stringify(ambResponse.transactions, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button
                  onClick={() => copyToClipboard(JSON.stringify(ambResponse.ambFullResponse || ambResponse, null, 2))}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Copy JSON
                </button>
                <button
                  onClick={() => setShowAmbModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GeneratedAddressesLuxury;
