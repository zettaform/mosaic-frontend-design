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

const StatusBadge = ({ status, className = "" }) => {
  const statusConfig = {
    active: { 
      bg: 'bg-emerald-100 dark:bg-emerald-900/30', 
      text: 'text-emerald-800 dark:text-emerald-300',
      icon: '●',
      pulse: 'animate-pulse'
    },
    inactive: { 
      bg: 'bg-slate-100 dark:bg-slate-800', 
      text: 'text-slate-600 dark:text-slate-400',
      icon: '○'
    },
    expired: { 
      bg: 'bg-red-100 dark:bg-red-900/30', 
      text: 'text-red-800 dark:text-red-300',
      icon: '●'
    },
    suspended: { 
      bg: 'bg-amber-100 dark:bg-amber-900/30', 
      text: 'text-amber-800 dark:text-amber-300',
      icon: '●'
    }
  };
  
  const config = statusConfig[status] || statusConfig.inactive;
  
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

const UsageBar = ({ used, limit, className = "" }) => {
  const percentage = (used / limit) * 100;
  const colorClass = percentage >= 90 ? 'bg-red-500' : percentage >= 75 ? 'bg-amber-500' : 'bg-emerald-500';
  
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
        <span>{used} / {limit}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${colorClass} rounded-full`}
        />
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {limit - used} remaining
      </div>
    </div>
  );
};

const KeyCard = ({ keyData, onEdit, onDelete, onViewLogs, onCopy }) => {
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
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {keyData.description || 'Unnamed Key'}
            </h3>
          </div>
          <div className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-lg">
            {keyData.admin_key.substring(0, 24)}...
          </div>
        </div>
        <StatusBadge status={keyData.key_status} />
      </div>

      {/* Usage Stats */}
      <div className="mb-4">
        <UsageBar used={keyData.users_created} limit={keyData.user_creation_limit} />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
        <div>
          <div className="text-slate-500 dark:text-slate-400 mb-1">Created</div>
          <div className="text-slate-900 dark:text-slate-100">
            {new Date(keyData.created_at).toLocaleDateString()}
          </div>
        </div>
        <div>
          <div className="text-slate-500 dark:text-slate-400 mb-1">Expires</div>
          <div className="text-slate-900 dark:text-slate-100">
            {new Date(keyData.expires_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0.7 }}
        className="flex gap-2"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onCopy(keyData.admin_key)}
          className="flex-1 px-3 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
        >
          Copy Key
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onEdit(keyData)}
          className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          Edit
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onViewLogs(keyData.admin_key_id)}
          className="px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
        >
          Logs
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDelete(keyData.admin_key_id)}
          className="px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          Delete
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

const CreateKeyModal = ({ isOpen, onClose, onSubmit, formData, setFormData, isCreating }) => {
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
          className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Create New Admin Key</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Generate a new API key for external user creation</p>
          </div>
          
          <form onSubmit={onSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                User Creation Limit *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.user_creation_limit}
                onChange={(e) => setFormData({...formData, user_creation_limit: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100 transition-colors"
                placeholder="100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100 transition-colors resize-none"
                placeholder="Optional description for this key"
                rows="3"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Expires In (Days)
              </label>
              <input
                type="number"
                min="1"
                max="3650"
                value={formData.expires_in_days}
                onChange={(e) => setFormData({...formData, expires_in_days: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100 transition-colors"
                placeholder="365"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <motion.button
                type="submit"
                disabled={isCreating}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? 'Creating...' : 'Create Key'}
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

function AdminKeysLuxury() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminKeys, setAdminKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [selectedKeyLogs, setSelectedKeyLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    hasMore: false,
    lastKey: null,
    totalCount: 0,
    limit: 10
  });

  // Form state for creating/editing keys
  const [formData, setFormData] = useState({
    user_creation_limit: '',
    description: '',
    expires_in_days: '365',
    key_status: 'active'
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

  // Fetch admin keys with pagination
  const fetchAdminKeys = async (lastKey = null, resetPagination = false) => {
    try {
      setLoading(true);
      setError('');
      
      const result = await adminApiService.getAdminKeys(pagination.limit, lastKey);
      
      if (result.success) {
        if (resetPagination || !lastKey) {
          setAdminKeys(result.admin_keys || []);
        } else {
          setAdminKeys(prev => [...prev, ...(result.admin_keys || [])]);
        }
        
        setPagination(prev => ({
          ...prev,
          hasMore: result.hasMore || false,
          lastKey: result.lastEvaluatedKey,
          totalCount: result.total || result.admin_keys?.length || 0
        }));
      } else {
        setError(result.error || 'Failed to fetch admin keys');
      }
    } catch (error) {
      console.error('AdminKeys fetch error:', error);
      let errorMessage = 'Error fetching admin keys: ' + error.message;
      
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

  // Create new admin key
  const handleCreateKey = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError('');
      
      const result = await adminApiService.createAdminKey(formData);
      
      if (result.success) {
        setShowCreateModal(false);
        setFormData({ user_creation_limit: '', description: '', expires_in_days: '365', key_status: 'active' });
        fetchAdminKeys(null, true);
      } else {
        setError(result.error || 'Failed to create admin key');
      }
    } catch (error) {
      setError('Error creating admin key: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  // Update admin key
  const handleUpdateKey = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError('');
      
      const { getApiUrl } = await import('../../utils/getBackendUrl');
      const backendUrl = getApiUrl();
      const response = await fetch(`${backendUrl}/api/admin/keys/${editingKey.admin_key_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setShowEditModal(false);
        setEditingKey(null);
        setFormData({ user_creation_limit: '', description: '', expires_in_days: '365', key_status: 'active' });
        fetchAdminKeys(null, true);
      } else {
        setError(result.error || 'Failed to update admin key');
      }
    } catch (error) {
      setError('Error updating admin key: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  // Delete admin key
  const handleDeleteKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to delete this admin key? This action cannot be undone.')) {
      return;
    }
    
    try {
      const result = await adminApiService.deleteAdminKey(keyId);
      
      if (result.success) {
        fetchAdminKeys(null, true);
      } else {
        setError(result.error || 'Failed to delete admin key');
      }
    } catch (error) {
      setError('Error deleting admin key: ' + error.message);
    }
  };

  // Edit key
  const handleEdit = (key) => {
    setEditingKey(key);
    setFormData({
      user_creation_limit: key.user_creation_limit.toString(),
      description: key.description || '',
      expires_in_days: '365',
      key_status: key.key_status || 'active'
    });
    setShowEditModal(true);
  };

  // Copy key to clipboard
  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopySuccess('Key copied to clipboard!');
        setTimeout(() => setCopySuccess(''), 3000);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        setCopySuccess('Key copied to clipboard!');
        setTimeout(() => setCopySuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      setCopySuccess('Failed to copy key');
      setTimeout(() => setCopySuccess(''), 3000);
    }
  };

  // View logs
  const handleViewLogs = async (keyId) => {
    try {
      setLogsLoading(true);
      const result = await adminApiService.getAdminKeyLogs(keyId, 100); // Get up to 100 logs

      if (result.success) {
        setSelectedKeyLogs(result.logs || []);
        setLogsModalOpen(true);
      } else {
        setError(result.error || 'Failed to fetch logs');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Failed to fetch logs');
    } finally {
      setLogsLoading(false);
    }
  };

  // Load more admin keys
  const loadMoreKeys = () => {
    if (pagination.hasMore && !loading) {
      fetchAdminKeys(pagination.lastKey, false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = adminKeys.length;
    const active = adminKeys.filter(key => key.key_status === 'active').length;
    const totalUsage = adminKeys.reduce((sum, key) => sum + key.users_created, 0);
    const totalLimit = adminKeys.reduce((sum, key) => sum + key.user_creation_limit, 0);
    
    return { total, active, totalUsage, totalLimit };
  }, [adminKeys]);

  useEffect(() => {
    fetchAdminKeys();
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
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Admin Keys</h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">Manage API keys for external user creation</p>
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
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Create New Key
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Keys</p>
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
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Keys</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.active}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Users Created</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalUsage}</p>
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
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Limit</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalLimit}</p>
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

            {/* Copy success message */}
            <AnimatePresence>
              {copySuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-lg"
                >
                  {copySuccess}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content */}
            {loading ? (
              <LoadingSpinner />
            ) : adminKeys.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No admin keys found</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Create your first key to get started with external user creation.</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  Create Your First Key
                </motion.button>
              </motion.div>
            ) : viewMode === 'grid' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence>
                  {adminKeys.map((key) => (
                    <KeyCard
                      key={key.admin_key_id}
                      keyData={key}
                      onEdit={handleEdit}
                      onDelete={handleDeleteKey}
                      onViewLogs={handleViewLogs}
                      onCopy={copyToClipboard}
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
                          Key
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Usage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Expires
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      {adminKeys.map((key) => (
                        <motion.tr
                          key={key.admin_key_id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <div className="font-mono text-sm text-slate-900 dark:text-slate-100">
                                {key.admin_key.substring(0, 20)}...
                              </div>
                              <button
                                onClick={() => copyToClipboard(key.admin_key)}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mt-1"
                              >
                                Copy full key
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                            {key.description || 'No description'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <UsageBar used={key.users_created} limit={key.user_creation_limit} className="w-32" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={key.key_status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                            {new Date(key.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                            {new Date(key.expires_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleEdit(key)}
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                              >
                                Edit
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleViewLogs(key.admin_key_id)}
                                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300"
                              >
                                Logs
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDeleteKey(key.admin_key_id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                              >
                                Delete
                              </motion.button>
                            </div>
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
                  onClick={loadMoreKeys}
                  disabled={loading}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Load More Keys'}
                </motion.button>
              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* Create Key Modal */}
      <CreateKeyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateKey}
        formData={formData}
        setFormData={setFormData}
        isCreating={creating}
      />

      {/* Edit Key Modal - Similar to Create but with different title and pre-filled data */}
      <CreateKeyModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingKey(null);
        }}
        onSubmit={handleUpdateKey}
        formData={formData}
        setFormData={setFormData}
        isCreating={creating}
      />

      {/* Logs Modal */}
      {logsModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setLogsModalOpen(false)}></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Admin Key Activity Logs</h3>
                  <button
                    onClick={() => setLogsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {logsLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p className="mt-2 text-gray-600">Loading logs...</p>
                  </div>
                ) : selectedKeyLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No activity logs</h3>
                    <p className="mt-1 text-sm text-gray-500">This admin key hasn't been used to create any users yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            IP Address
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Timestamp
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedKeyLogs.map((log) => (
                          <tr key={log.log_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                log.action === 'user_created' ? 'bg-green-100 text-green-800' :
                                log.action === 'external_user_created' ? 'bg-blue-100 text-blue-800' :
                                log.action === 'external_user_created_get' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {log.action === 'user_created' ? 'User Created' :
                                 log.action === 'external_user_created' ? 'External API' :
                                 log.action === 'external_user_created_get' ? 'GET API' :
                                 log.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {log.user_created ? (
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {log.user_created.first_name} {log.user_created.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500">{log.user_created.email}</div>
                                  <div className="text-xs text-gray-400">ID: {log.user_created.user_id}</div>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {log.ip_address || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setLogsModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminKeysLuxury;
