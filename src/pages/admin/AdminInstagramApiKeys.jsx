import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import adminApiService, { API_BASE_URL } from '../../services/adminApiService';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';

const LoadingSpinner = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center justify-center py-12"
  >
    <div className="relative">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  </motion.div>
);

const StatusBadge = ({ status }) => {
  const normalized = (status || '').toString().toUpperCase();
  const isActive = normalized === 'ACTIVE';
  const color =
    normalized === 'DISABLED'
      ? 'bg-red-100 text-red-800'
      : normalized === 'SUSPENDED'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-emerald-100 text-emerald-800';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {isActive ? '●' : '○'} {normalized || 'UNKNOWN'}
    </span>
  );
};

const UsageBar = ({ used, limit }) => {
  const usedVal = used ?? 0;
  const limitVal = limit || 0;
  const percentage = limitVal > 0 ? Math.min(100, Math.round((usedVal / limitVal) * 100)) : 0;
  const colorClass =
    percentage >= 90 ? 'bg-red-500' : percentage >= 75 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-slate-600 mb-1">
        <span>
          {usedVal} / {limitVal}
        </span>
        <span>{percentage}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full ${colorClass} rounded-full`}
        />
      </div>
    </div>
  );
};

const CreateKeyModal = ({ isOpen, onClose, onSubmit, formData, setFormData, isSubmitting, isEditing = false }) => {
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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {isEditing ? 'Update Instagram API Key' : 'Create Instagram API Key'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Keys are stored in the <span className="font-mono">instagramapikeys</span> Azure Table Storage table and used by the Instagram serverless function.
            </p>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Request Limit *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.requestLimit}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, requestLimit: e.target.value }))
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-slate-100"
                placeholder="1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Owner (optional)
              </label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, owner: e.target.value }))
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-slate-100"
                placeholder="e.g. client email or name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                API Key {isEditing && <span className="text-xs text-slate-500 font-normal">(cannot be changed)</span>}
              </label>
              <input
                type="text"
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                disabled={isEditing}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
                placeholder="Leave blank to auto-generate"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DISABLED">DISABLED</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting 
                  ? (isEditing ? 'Updating...' : 'Creating...') 
                  : (isEditing ? 'Update Key' : 'Create Key')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-medium rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

function AdminInstagramApiKeys() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [error, setError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [testingKey, setTestingKey] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [pagination, setPagination] = useState({
    hasMore: false,
    lastKey: null,
    totalCount: 0,
    limit: 20
  });
  const [formData, setFormData] = useState({
    apiKey: '',
    requestLimit: '',
    owner: '',
    status: 'ACTIVE'
  });

  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  // RBAC guard
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  const routeInfo = ROUTE_TO_SECTION[currentPath];
  if (routeInfo) {
    const { section, page } = routeInfo;
    if (!hasAccess(user, section, page)) {
      return <Navigate to="/unauthorized" replace />;
    }
  } else {
    return <Navigate to="/unauthorized" replace />;
  }

  const stats = useMemo(() => {
    const totalKeys = keys.length;
    const totalLimit = keys.reduce((sum, k) => sum + (k.requestLimit || 0), 0);
    const totalUsed = keys.reduce((sum, k) => sum + (k.usedRequests || 0), 0);
    const totalRemaining = keys.reduce(
      (sum, k) => sum + (k.remainingRequests ?? Math.max(0, (k.requestLimit || 0) - (k.usedRequests || 0))),
      0
    );
    return { totalKeys, totalLimit, totalUsed, totalRemaining };
  }, [keys]);

  const fetchKeys = async (lastKey = null, reset = false) => {
    try {
      setLoading(true);
      setError('');

      const result = await adminApiService.getInstagramApiKeys(pagination.limit, lastKey);

      if (result.success) {
        const items = result.items || [];
        setKeys((prev) => (reset || !lastKey ? items : [...prev, ...items]));
        setPagination((prev) => ({
          ...prev,
          hasMore: result.hasMore || false,
          lastKey: result.lastEvaluatedKey || null,
          totalCount: result.total || items.length
        }));
        
        // Clear error if we successfully got an empty array
        if (items.length === 0 && !result.error) {
          setError('');
        }
      } else {
        const errorMsg = result.error || 'Failed to fetch Instagram API keys';
        setError(errorMsg);
        
        // If it's a 404, provide helpful message
        if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
          setError('Azure Table Storage table "instagramapikeys" not found. The table will be created automatically when you create your first API key.');
        }
      }
    } catch (err) {
      console.error('Error fetching Instagram API keys:', err);
      const errorMsg = err.message || 'Error fetching Instagram API keys';
      setError(errorMsg);
      
      // Check if it's a connection/authentication error
      if (errorMsg.includes('credentials') || errorMsg.includes('not configured')) {
        setError('Azure Storage credentials not configured. Please check your environment variables.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      const payload = {
        apiKey: formData.apiKey || undefined,
        requestLimit: parseInt(formData.requestLimit, 10),
        owner: formData.owner || undefined,
        status: formData.status
      };

      const result = await adminApiService.createInstagramApiKey(payload);
      if (result.success) {
        setShowCreateModal(false);
        setFormData({
          apiKey: '',
          requestLimit: '',
          owner: '',
          status: 'ACTIVE'
        });
        await fetchKeys(null, true);
      } else {
        setError(result.error || 'Failed to create Instagram API key');
      }
    } catch (err) {
      setError(err.message || 'Error creating Instagram API key');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateKey = async (e) => {
    e.preventDefault();
    if (!editingKey) return;
    try {
      setSubmitting(true);
      setError('');

      const updates = {};
      if (formData.requestLimit) {
        updates.requestLimit = parseInt(formData.requestLimit, 10);
      }
      if (formData.owner !== undefined) {
        updates.owner = formData.owner;
      }
      if (formData.status) {
        updates.status = formData.status;
      }

      const result = await adminApiService.updateInstagramApiKey(editingKey.apiKey, updates);
      if (result.success) {
        setEditingKey(null);
        setFormData({
          apiKey: '',
          requestLimit: '',
          owner: '',
          status: 'ACTIVE'
        });
        await fetchKeys(null, true);
      } else {
        setError(result.error || 'Failed to update Instagram API key');
      }
    } catch (err) {
      setError(err.message || 'Error updating Instagram API key');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteKey = async (apiKey) => {
    if (!window.confirm('Delete this Instagram API key? This cannot be undone.')) return;
    try {
      setError('');
      const result = await adminApiService.deleteInstagramApiKey(apiKey);
      if (result.success) {
        await fetchKeys(null, true);
      } else {
        setError(result.error || 'Failed to delete Instagram API key');
      }
    } catch (err) {
      setError(err.message || 'Error deleting Instagram API key');
    }
  };

  const handleEditClick = (key) => {
    setEditingKey(key);
    setFormData({
      apiKey: key.apiKey,
      requestLimit: key.requestLimit?.toString() || '',
      owner: key.owner || '',
      status: key.status || 'ACTIVE'
    });
    setShowCreateModal(true);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage('API key copied to clipboard');
      setTimeout(() => setCopyMessage(''), 2500);
    } catch (err) {
      console.error('Failed to copy key:', err);
      setCopyMessage('Failed to copy API key');
      setTimeout(() => setCopyMessage(''), 2500);
    }
  };

  const handleTestKey = async (apiKey) => {
    setTestingKey(apiKey);
    setTestResult(null);
    setError('');

    try {
      const testParams = new URLSearchParams({
        apiKey: apiKey,
        userId: '403377154',
        limit: '48'
      });

      const startTime = Date.now();
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      let response;
      try {
        response = await fetch(`${API_BASE_URL}/admin/instagram-api-keys/test?${testParams.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('sessionToken') || localStorage.getItem('token')
              ? { Authorization: `Bearer ${localStorage.getItem('sessionToken') || localStorage.getItem('token')}` }
              : {})
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out after 30 seconds');
        }
        throw fetchError;
      }

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      let responseData;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = { text: await response.text() };
        }
      } catch (parseError) {
        responseData = { 
          error: 'Failed to parse response',
          rawError: parseError.message 
        };
      }

      setTestResult({
        success: response.ok && responseData.success !== false,
        status: response.status,
        statusText: response.statusText,
        responseTime: responseData.responseTime || responseTime,
        data: responseData.data || responseData,
        timestamp: responseData.timestamp || new Date().toISOString()
      });

      if (!response.ok || responseData.success === false) {
        const errorMsg = responseData?.error || responseData?.data?.error || `HTTP ${response.status} ${response.statusText}`;
        setError(`Test failed: ${errorMsg}`);
      } else {
        // Clear any previous errors on success
        setError('');
      }
    } catch (err) {
      console.error('Error testing API key:', err);
      let errorMessage = err.message || 'Unknown error';
      
      // Provide more helpful error messages
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = 'Network error: Could not reach the backend server. Please ensure the server is running.';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Request timed out. The serverless function may be slow or unavailable.';
      } else if (errorMessage.includes('CORS')) {
        errorMessage = 'CORS error: Please check backend server configuration.';
      }
      
      setTestResult({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
      setError(`Test error: ${errorMessage}`);
    } finally {
      setTestingKey(null);
    }
  };

  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      fetchKeys(pagination.lastKey, false);
    }
  };

  useEffect(() => {
    fetchKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Instagram API Keys
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Manage API keys stored in the <span className="font-mono">instagramapikeys</span> Azure Table Storage table.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  {viewMode === 'grid' ? 'Table View' : 'Grid View'}
                </button>
                <button
                  onClick={() => {
                    setEditingKey(null);
                    setFormData({
                      apiKey: '',
                      requestLimit: '',
                      owner: '',
                      status: 'ACTIVE'
                    });
                    setShowCreateModal(true);
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg"
                >
                  Create Key
                </button>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
            >
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500">Total Keys</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {stats.totalKeys}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500">Total Limit</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {stats.totalLimit}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500">Used Requests</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {stats.totalUsed}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500">Remaining Requests</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {stats.totalRemaining}
                </p>
              </div>
            </motion.div>

            {/* Alerts */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {copyMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg"
                >
                  {copyMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content */}
            {loading ? (
              <LoadingSpinner />
            ) : keys.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  No Instagram API keys yet
                </p>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Create a key to start tracking RapidAPI usage for Instagram.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg"
                >
                  Create First Key
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {keys.map((key) => (
                  <motion.div
                    key={key.apiKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-500 mb-1">API Key</p>
                        <p className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded truncate">
                          {key.apiKey}
                        </p>
                        <button
                          onClick={() => copyToClipboard(key.apiKey)}
                          className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                      <StatusBadge status={key.status} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Usage</p>
                      <UsageBar used={key.usedRequests} limit={key.requestLimit} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
                      <div>
                        <p className="font-medium">Owner</p>
                        <p className="truncate">{key.owner || '—'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Remaining</p>
                        <p>{key.remainingRequests ?? '—'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Created</p>
                        <p>{key.createdAt ? new Date(key.createdAt).toLocaleString() : '—'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Updated</p>
                        <p>{key.updatedAt ? new Date(key.updatedAt).toLocaleString() : '—'}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleEditClick(key)}
                        className="flex-1 px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleTestKey(key.apiKey)}
                        disabled={testingKey === key.apiKey}
                        className="flex-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                      >
                        {testingKey === key.apiKey ? 'Testing...' : 'Test'}
                      </button>
                      <button
                        onClick={() => handleDeleteKey(key.apiKey)}
                        className="flex-1 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-900">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          API Key
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Owner
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Usage
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Updated
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      {keys.map((key) => (
                        <tr key={key.apiKey}>
                          <td className="px-4 py-2 text-sm">
                            <div className="flex flex-col">
                              <span className="font-mono text-xs truncate">{key.apiKey}</span>
                              <button
                                onClick={() => copyToClipboard(key.apiKey)}
                                className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline self-start"
                              >
                                Copy
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-slate-800 dark:text-slate-100">
                            {key.owner || '—'}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <UsageBar used={key.usedRequests} limit={key.requestLimit} />
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <StatusBadge status={key.status} />
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            {key.createdAt ? new Date(key.createdAt).toLocaleString() : '—'}
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            {key.updatedAt ? new Date(key.updatedAt).toLocaleString() : '—'}
                          </td>
                          <td className="px-4 py-2 text-right text-sm">
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => handleEditClick(key)}
                                className="px-3 py-1 text-xs font-medium border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleTestKey(key.apiKey)}
                                disabled={testingKey === key.apiKey}
                                className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                              >
                                {testingKey === key.apiKey ? 'Testing...' : 'Test'}
                              </button>
                              <button
                                onClick={() => handleDeleteKey(key.apiKey)}
                                className="px-3 py-1 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100"
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
            )}

            {pagination.hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-5 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}

            {/* Test Result Display */}
            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Test Result
                  </h3>
                  <button
                    onClick={() => setTestResult(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      testResult.success
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {testResult.success ? '✓ Success' : '✗ Failed'}
                    </span>
                    {testResult.status && (
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Status: {testResult.status} {testResult.statusText || ''}
                      </span>
                    )}
                    {testResult.responseTime && (
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Response Time: {testResult.responseTime}ms
                      </span>
                    )}
                  </div>
                  {testResult.data && (
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                        {JSON.stringify(testResult.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  {testResult.error && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                      <p className="text-sm text-red-800 dark:text-red-200">{testResult.error}</p>
                    </div>
                  )}
                  {testResult.timestamp && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tested at: {new Date(testResult.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* Reuse CreateKeyModal for both create and edit */}
      <CreateKeyModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingKey(null);
          setFormData({
            apiKey: '',
            requestLimit: '',
            owner: '',
            status: 'ACTIVE'
          });
        }}
        onSubmit={editingKey ? handleUpdateKey : handleCreateKey}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={submitting}
        isEditing={!!editingKey}
      />
    </div>
  );
}

export default AdminInstagramApiKeys;


