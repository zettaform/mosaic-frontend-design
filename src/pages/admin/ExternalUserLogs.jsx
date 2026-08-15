import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate, useLocation } from 'react-router-dom';

import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import DataTable from '../../components/DataTable';
import adminApiService from '../../services/adminApiService';
import { useAuth } from '../../contexts/AuthContext';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';

function ExternalUserLogs() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    admin_key: searchParams.get('admin_key') || '',
    admin_key_id: searchParams.get('admin_key_id') || '',
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || '',
    success: searchParams.get('success') || '',
    limit: parseInt(searchParams.get('limit')) || 100
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    hasMore: false,
    lastKey: null,
    totalCount: 0
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async (lastKey = null, resetPagination = false) => {
    try {
      setLoading(true);
      setError(null);

      const filtersWithLastKey = { ...filters };
      if (lastKey) {
        filtersWithLastKey.last_key = JSON.stringify(lastKey);
      }

      const result = await adminApiService.getExternalUserLogs(filtersWithLastKey);
      
      if (result.success) {
        if (resetPagination || !lastKey) {
          setLogs(result.logs || []);
        } else {
          setLogs(prev => [...prev, ...(result.logs || [])]);
        }
        
        setPagination(prev => ({
          ...prev,
          hasMore: result.hasMore,
          lastKey: result.lastEvaluatedKey,
          totalCount: result.count || 0
        }));
      } else {
        throw new Error(result.error || 'Failed to fetch logs');
      }
    } catch (err) {
      console.error('ExternalUserLogs fetch error:', err);
      let errorMessage = 'Failed to fetch logs. Please check your connection to the backend server.';
      
      // Provide mobile-specific error guidance
      if (err.name === 'TimeoutError') {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and ensure you can access the server.';
      } else if (err.message.includes('HTTP 4')) {
        errorMessage = 'Server error. Please refresh the page and try again.';
      } else if (err.message.includes('HTTP 5')) {
        errorMessage = 'Server error. Please try again later or contact support.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) {
        newSearchParams.append(k, v);
      }
    });
    setSearchParams(newSearchParams);
    
    // Reset pagination
    setPagination(prev => ({ ...prev, currentPage: 1, lastKey: null }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchLogs(null, true);
  };

  const loadMoreLogs = () => {
    if (pagination.hasMore && pagination.lastKey) {
      fetchLogs(pagination.lastKey);
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  const clearFilters = () => {
    const clearedFilters = {
      admin_key: '',
      admin_key_id: '',
      start_date: '',
      end_date: '',
      success: '',
      limit: 100
    };
    setFilters(clearedFilters);
    setSearchParams({});
    setPagination(prev => ({ ...prev, currentPage: 1, lastKey: null }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (success) => {
    return success 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  };

  const getStatusIcon = (success) => {
    return success ? '✅' : '❌';
  };

  // Wait for auth to finish loading before checking admin status
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

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

  if (loading && logs.length === 0) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="sidebar-shell-main">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex-1">
            <div className="px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Page header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    External User Creation Logs
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
                    Comprehensive audit trail of all external user creation activities
                  </p>
                  <div className="flex items-center mt-3 text-sm text-slate-500 dark:text-slate-400">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    {pagination.totalCount > 0 ? `${pagination.totalCount} log entries` : 'No logs found'}
                  </div>
                </div>
                <button
                  onClick={() => fetchLogs(null, true)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="w-5 h-5 fill-current mr-2" viewBox="0 0 16 16">
                    <path d="M8 3a5 5 0 0 0-5 5H1l3.5 3.5L7.5 8H6a2 2 0 1 1 2 2v2a4 4 0 1 0-4-4H1a7 7 0 1 1 7 7v-2a5 5 0 0 0 0-10z" />
                  </svg>
                  Refresh Logs
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Filter Logs</h3>
              <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Admin Key
                  </label>
                  <input
                    type="text"
                    value={filters.admin_key}
                    onChange={(e) => handleFilterChange('admin_key', e.target.value)}
                    placeholder="Enter admin key"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Admin Key ID
                  </label>
                  <input
                    type="text"
                    value={filters.admin_key_id}
                    onChange={(e) => handleFilterChange('admin_key_id', e.target.value)}
                    placeholder="Enter admin key ID"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Success Status
                  </label>
                  <select
                    value={filters.success}
                    onChange={(e) => handleFilterChange('success', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="true">Successful</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Results Limit
                  </label>
                  <select
                    value={filters.limit}
                    onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={50}>50 results</option>
                    <option value={100}>100 results</option>
                    <option value={200}>200 results</option>
                    <option value={500}>500 results</option>
                  </select>
                </div>
                
                <div className="flex items-end space-x-3">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Apply Filters
                  </button>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-6 py-2 bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Clear All
                  </button>
                </div>
              </form>
            </div>

            {/* Logs Table */}
            <DataTable
              title="External User Creation Logs"
              description="Comprehensive audit trail of all external user creation activities including success/failure status and error details."
              data={logs}
              columns={[
                {
                  key: 'status',
                  header: 'Status',
                  render: (log) => (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.success)}`}>
                      {getStatusIcon(log.success)} {log.success ? 'Success' : 'Failed'}
                    </span>
                  )
                },
                {
                  key: 'user_details',
                  header: 'User Details',
                  render: (log) => (
                    <div className="text-sm text-slate-900 dark:text-slate-100">
                      <div className="font-medium">{log.user_first_name} {log.user_last_name}</div>
                      <div className="text-slate-500 dark:text-slate-400">{log.user_email}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        Role: {log.user_role} | Status: {log.user_status}
                      </div>
                    </div>
                  )
                },
                {
                  key: 'admin_key_info',
                  header: 'Admin Key Info',
                  render: (log) => (
                    <div className="text-sm text-slate-900 dark:text-slate-100">
                      <div className="font-medium">{log.admin_key_id}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs">
                        {log.metadata?.admin_key_description || 'Legacy Key'}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        Usage: {log.metadata?.admin_key_usage_before || 0} → {log.metadata?.admin_key_usage_after || 0}
                      </div>
                    </div>
                  )
                },
                {
                  key: 'timestamp',
                  header: 'Timestamp',
                  render: (log) => formatDate(log.created_at)
                },
                {
                  key: 'error_details',
                  header: 'Error Details',
                  render: (log) => (
                    log.error_message ? (
                      <div className="text-sm text-red-600 dark:text-red-400">
                        <div className="font-medium">Error:</div>
                        <div className="text-xs">{log.error_message}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-green-600 dark:text-green-400">No errors</span>
                    )
                  )
                }
              ]}
              loading={loading}
              emptyMessage="No logs found. Try adjusting your filters or create some external users to see logs."
            />

            {/* Load More */}
            {pagination.hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMoreLogs}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                >
                  {loading ? 'Loading...' : 'Load More Logs'}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ExternalUserLogs;
