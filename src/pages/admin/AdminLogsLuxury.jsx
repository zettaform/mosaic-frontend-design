import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import adminApiService from '../../services/adminApiService';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';

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

const StatusBadge = ({ success, className = "" }) => {
  const statusConfig = success ? {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-800 dark:text-emerald-300',
    icon: '✓',
    pulse: 'animate-pulse'
  } : {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-300',
    icon: '✗'
  };
  
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text} ${statusConfig.pulse || ''} ${className}`}
    >
      <span className={`text-xs ${statusConfig.pulse || ''}`}>{statusConfig.icon}</span>
      {success ? 'Success' : 'Failed'}
    </motion.span>
  );
};

const LogCard = ({ log, onViewDetails }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-2 h-2 rounded-full ${log.success ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {log.user_first_name} {log.user_last_name}
            </h3>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-lg">
            {log.user_email}
          </div>
        </div>
        <StatusBadge success={log.success} />
      </div>

      {/* User Details */}
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-slate-500 dark:text-slate-400 mb-1">Role</div>
            <div className="text-slate-900 dark:text-slate-100 font-medium">
              {log.user_role}
            </div>
          </div>
          <div>
            <div className="text-slate-500 dark:text-slate-400 mb-1">Status</div>
            <div className="text-slate-900 dark:text-slate-100 font-medium">
              {log.user_status}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Key Info */}
      <div className="mb-4">
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Admin Key</div>
        <div className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-lg">
          {log.admin_key_id ? log.admin_key_id.substring(0, 24) + '...' : 'Legacy Key'}
        </div>
        {log.metadata?.admin_key_description && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {log.metadata.admin_key_description}
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className="mb-4">
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Created</div>
        <div className="text-slate-900 dark:text-slate-100 text-sm">
          {new Date(log.created_at).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      </div>

      {/* Error Message */}
      {log.error_message && (
        <div className="mb-4">
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
            <div className="font-medium">Error:</div>
            <div className="text-xs mt-1">{log.error_message}</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0.7 }}
        className="flex gap-2"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onViewDetails(log)}
          className="flex-1 px-3 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
        >
          View Details
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

const FilterModal = ({ isOpen, onClose, filters, setFilters, onApply }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Filter Logs</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Refine your search with advanced filters</p>
          </div>
          
          <form onSubmit={onApply} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Admin Key ID
                </label>
                <input
                  type="text"
                  value={filters.admin_key_id}
                  onChange={(e) => setFilters({...filters, admin_key_id: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100 transition-colors"
                  placeholder="Enter admin key ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Status
                </label>
                <select
                  value={filters.success}
                  onChange={(e) => setFilters({...filters, success: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100 transition-colors"
                >
                  <option value="">All Status</option>
                  <option value="true">Success</option>
                  <option value="false">Failed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={filters.start_date}
                  onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={filters.end_date}
                  onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={filters.limit}
                  onChange={(e) => setFilters({...filters, limit: parseInt(e.target.value) || 100})}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100 transition-colors"
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                Apply Filters
              </motion.button>
              <motion.button
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
              >
                Cancel
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const LogDetailsModal = ({ isOpen, onClose, log }) => {
  if (!isOpen || !log) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Log Details</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Complete information about this log entry</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">User Information</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Name</div>
                    <div className="text-slate-900 dark:text-slate-100">{log.user_first_name} {log.user_last_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Email</div>
                    <div className="text-slate-900 dark:text-slate-100">{log.user_email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Role</div>
                    <div className="text-slate-900 dark:text-slate-100">{log.user_role}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Status</div>
                    <div className="text-slate-900 dark:text-slate-100">{log.user_status}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Admin Key Information</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Key ID</div>
                    <div className="text-slate-900 dark:text-slate-100 font-mono text-sm">{log.admin_key_id || 'Legacy Key'}</div>
                  </div>
                  {log.metadata?.admin_key_description && (
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Description</div>
                      <div className="text-slate-900 dark:text-slate-100">{log.metadata.admin_key_description}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Usage Before/After</div>
                    <div className="text-slate-900 dark:text-slate-100">
                      {log.metadata?.admin_key_usage_before || 0} → {log.metadata?.admin_key_usage_after || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Timing Information</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Created At</div>
                  <div className="text-slate-900 dark:text-slate-100">
                    {new Date(log.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      timeZoneName: 'short'
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            {log.error_message && (
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Error Details</h3>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="text-red-800 dark:text-red-300 font-medium">Error Message:</div>
                  <div className="text-red-700 dark:text-red-400 mt-2">{log.error_message}</div>
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Raw Data</h3>
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <pre className="text-xs text-slate-700 dark:text-slate-300 overflow-x-auto">
                  {JSON.stringify(log, null, 2)}
                </pre>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-slate-200 dark:border-slate-700">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="w-full px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
            >
              Close
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

function AdminLogsLuxury() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    hasMore: false,
    lastKey: null,
    totalCount: 0,
    limit: 50
  });

  // Filter state - simplified initialization
  const [filters, setFilters] = useState({
    admin_key: '',
    admin_key_id: '',
    start_date: '',
    end_date: '',
    success: '',
    limit: 50
  });

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

  // Fetch logs with pagination
  const fetchLogs = async (lastKey = null, resetPagination = false) => {
    try {
      setLoading(true);
      setError('');
      
      // Prepare filters with lastKey for pagination
      const filtersWithPagination = {
        ...filters,
        ...(lastKey && { last_key: JSON.stringify(lastKey) })
      };
      
      const result = await adminApiService.getExternalUserLogs(filtersWithPagination);
      
      if (result.success) {
        if (resetPagination || !lastKey) {
          setLogs(result.logs || []);
        } else {
          setLogs(prev => [...prev, ...(result.logs || [])]);
        }
        
        setPagination(prev => ({
          ...prev,
          hasMore: result.hasMore || false,
          lastKey: result.lastEvaluatedKey,
          totalCount: result.count || result.logs?.length || 0
        }));
      } else {
        setError(result.error || 'Failed to fetch logs');
      }
    } catch (error) {
      console.error('Logs fetch error:', error);
      let errorMessage = 'Error fetching logs: ' + error.message;
      
      if (error.name === 'TimeoutError') {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and ensure you can access the server.';
      } else if (error.message.includes('HTTP 4')) {
        errorMessage = 'Server error. Please refresh the page and try again.';
      } else if (error.message.includes('HTTP 5')) {
        errorMessage = 'Server error. Please try again later or contact support.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Reset pagination
    setPagination(prev => ({ ...prev, currentPage: 1, lastKey: null }));
  };

  // Apply filters
  const handleApplyFilters = (e) => {
    e.preventDefault();
    setShowFilterModal(false);
    fetchLogs(null, true);
  };

  // Clear filters
  const clearFilters = () => {
    const clearedFilters = {
      admin_key: '',
      admin_key_id: '',
      start_date: '',
      end_date: '',
      success: '',
      limit: 50
    };
    setFilters(clearedFilters);
    setPagination(prev => ({ ...prev, currentPage: 1, lastKey: null }));
  };

  // Load more logs
  const loadMoreLogs = () => {
    if (pagination.hasMore && !loading) {
      fetchLogs(pagination.lastKey, false);
    }
  };

  // View log details
  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = logs.length;
    const successful = logs.filter(log => log.success).length;
    const failed = logs.filter(log => !log.success).length;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;
    
    return { total, successful, failed, successRate };
  }, [logs]);

  // Initialize logs on mount
  useEffect(() => {
    fetchLogs();
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
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Admin Logs</h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">Comprehensive audit trail of all external user creation activities</p>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    {viewMode === 'grid' ? 'Table View' : 'Grid View'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowFilterModal(true)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Filters
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fetchLogs(null, true)}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Refresh
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            >
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Logs</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Successful</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.successful}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Failed</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.failed}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Success Rate</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.successRate}%</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content */}
            {loading ? (
              <LoadingSpinner />
            ) : logs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No logs found</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Try adjusting your filters or create some external users to see logs.</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFilterModal(true)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  Adjust Filters
                </motion.button>
              </motion.div>
            ) : viewMode === 'grid' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence>
                  {logs.map((log, index) => (
                    <LogCard
                      key={`${log.log_id || log.admin_key_id}-${log.created_at}-${index}`}
                      log={log}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          User Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Admin Key
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Error Details
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      {logs.map((log, index) => (
                        <motion.tr
                          key={`${log.log_id || log.admin_key_id}-${log.created_at}-${index}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge success={log.success} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-900 dark:text-slate-100">
                              <div className="font-medium">{log.user_first_name} {log.user_last_name}</div>
                              <div className="text-slate-500 dark:text-slate-400">{log.user_email}</div>
                              <div className="text-xs text-slate-400 dark:text-slate-500">
                                Role: {log.user_role} | Status: {log.user_status}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-900 dark:text-slate-100">
                              <div className="font-mono text-xs">{log.admin_key_id ? log.admin_key_id.substring(0, 20) + '...' : 'Legacy Key'}</div>
                              <div className="text-slate-500 dark:text-slate-400 text-xs">
                                {log.metadata?.admin_key_description || 'Legacy Key'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                            {new Date(log.created_at).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {log.error_message ? (
                              <div className="text-sm text-red-600 dark:text-red-400">
                                <div className="font-medium">Error:</div>
                                <div className="text-xs">{log.error_message}</div>
                              </div>
                            ) : (
                              <span className="text-sm text-green-600 dark:text-green-400">No errors</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleViewDetails(log)}
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                            >
                              View Details
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Load More Button */}
            {pagination.hasMore && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 text-center"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={loadMoreLogs}
                  disabled={loading}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Load More Logs'}
                </motion.button>
              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={handleApplyFilters}
      />

      {/* Log Details Modal */}
      <LogDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        log={selectedLog}
      />
    </div>
  );
}

export default AdminLogsLuxury;