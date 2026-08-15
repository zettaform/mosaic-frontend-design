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
    generated: { 
      bg: 'bg-emerald-100 dark:bg-emerald-900/30', 
      text: 'text-emerald-800 dark:text-emerald-300',
      icon: '✓',
      pulse: 'animate-pulse'
    },
    generating: { 
      bg: 'bg-blue-100 dark:bg-blue-900/30', 
      text: 'text-blue-800 dark:text-blue-300',
      icon: '⟳',
      pulse: 'animate-spin'
    },
    error: { 
      bg: 'bg-red-100 dark:bg-red-900/30', 
      text: 'text-red-800 dark:text-red-300',
      icon: '✗'
    }
  };
  
  const config = statusConfig[status] || statusConfig.generating;
  
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

const CryptoCard = ({ title, value, subtitle, icon, status, onCopy, className = "" }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all duration-300 ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <span className="text-indigo-600 dark:text-indigo-400 text-lg">{icon}</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        {status && <StatusBadge status={status} />}
      </div>
      
      <div className="space-y-3">
        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
          <p className="font-mono text-sm break-all text-slate-900 dark:text-slate-100">
            {value}
          </p>
        </div>
        
        {onCopy && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCopy}
            className="w-full px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
          >
            Copy to Clipboard
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

const AddressCard = ({ address, index, type, network, onCopy }) => {
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
          </div>
        </div>
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
      
      <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
        <p className="font-mono text-sm break-all text-slate-900 dark:text-slate-100">
          {address}
        </p>
      </div>
    </motion.div>
  );
};

const BTCXpubGeneratorLuxury = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [xpubInput, setXpubInput] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [generatingAddresses, setGeneratingAddresses] = useState(false);
  const [addressCount, setAddressCount] = useState(5);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
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

  // Generate addresses from xpub
  const generateAddresses = async (xpub, count = addressCount) => {
    try {
      setGeneratingAddresses(true);
      setError('');

      const data = await cryptoService.generateAddresses(count, xpub);
      return data;
    } catch (error) {
      console.error('Error generating addresses:', error);
      setError(error.message || 'Failed to generate addresses');
      return { success: false, error: error.message };
    } finally {
      setGeneratingAddresses(false);
    }
  };

  const handleGenerateAddresses = async () => {
    // Validate XPUB input
    const xpub = xpubInput.trim();
    if (!xpub) {
      setError('Please enter a Bitcoin XPUB (SegWit format)');
      return;
    }
    
    // Validate XPUB format
    const validPrefixes = ['xpub', 'zpub', 'tpub', 'upub'];
    const isValidXpub = validPrefixes.some(prefix => xpub.startsWith(prefix));
    
    if (!isValidXpub) {
      setError('Invalid XPUB format. Must start with xpub, zpub, tpub, or upub (SegWit format)');
      return;
    }
    
    if (addressCount < 1 || addressCount > 1000) {
      setError('Address count must be between 1 and 1000');
      return;
    }
    
    const result = await generateAddresses(xpub, addressCount);
    
    if (result.success) {
      setAddresses(result.data.addresses);
      setSuccess(`${result.data.count} addresses generated and saved to database!`);
      setError('');
      setXpubInput(''); // Clear input after successful generation
      
      // Show success message for 2 seconds, then redirect to Generated Addresses page
      setTimeout(() => {
        navigate('/crypto/generated-addresses');
      }, 2000);
    } else {
      setError(result.error || 'Failed to generate addresses');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

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
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">BTC XPUB Generator</h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">Input a Bitcoin XPUB (SegWit format) to generate and store multiple BTC addresses</p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/crypto/generated-addresses"
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    View Generated Addresses
                  </Link>
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
                  <div className="flex items-center justify-between">
                    <span>{success}</span>
                    {success.includes('saved to database') && (
                      <span className="text-sm text-green-600 dark:text-green-400">
                        Redirecting to Generated Addresses page...
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* XPUB Input Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Bitcoin XPUB (SegWit Format)
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Enter a Bitcoin extended public key. Supported formats: xpub (mainnet), zpub (mainnet SegWit), tpub (testnet), upub (testnet SegWit)
                  </p>
                  <textarea
                    value={xpubInput}
                    onChange={(e) => setXpubInput(e.target.value)}
                    placeholder="xpub... or zpub... or tpub... or upub..."
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100 font-mono text-sm"
                  />
                  {xpubInput && (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(xpubInput)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Copy XPUB
                      </button>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {xpubInput.length} characters
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Number of Addresses to Generate
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={addressCount}
                      onChange={(e) => setAddressCount(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="5"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Generate between 1 and 1000 addresses
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Derivation Path
                    </label>
                    <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                      <p className="font-mono text-sm text-slate-900 dark:text-slate-100">
                        m/0/{'{index}'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Addresses will be derived sequentially from index 0
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerateAddresses}
                    disabled={generatingAddresses || !xpubInput.trim()}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingAddresses ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      `Generate ${addressCount} Address${addressCount > 1 ? 'es' : ''}`
                    )}
                  </motion.button>
                  
                  <Link
                    to="/crypto/generated-addresses"
                    className="px-6 py-3 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-medium rounded-lg transition-colors"
                  >
                    View All Addresses
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Generated Addresses */}
            {addresses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Generated Addresses</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">{addresses.length} addresses generated</p>
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

                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {addresses.map((addr, index) => (
                      <AddressCard
                        key={index}
                        address={addr.address}
                        index={addr.index}
                        type={addr.type}
                        network={addr.network}
                        onCopy={() => copyToClipboard(addr.address)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                      <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Index
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Address
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Network
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {addresses.map((addr, index) => (
                          <motion.tr
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                              {addr.index}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-900 dark:text-slate-100">
                              {addr.address}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                {addr.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                              {addr.network}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => copyToClipboard(addr.address)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                Copy
                              </motion.button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}


          </div>
        </main>
      </div>
    </div>
  );
};

export default BTCXpubGeneratorLuxury;
