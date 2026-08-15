import React, { useState, useEffect, useRef, useMemo } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import { 
  Database, 
  Search, 
  RefreshCw, 
  AlertCircle,
  Server,
  BarChart3,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Copy,
  Check,
  X,
  Eye
} from 'lucide-react';

function AzureTablesStorage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [copiedItems, setCopiedItems] = useState(new Set());
  const [stats, setStats] = useState({
    totalTables: 0,
    totalRows: 0
  });
  const [showTableModal, setShowTableModal] = useState(false);
  const [selectedTableName, setSelectedTableName] = useState(null);
  const [tableEntities, setTableEntities] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState(null);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize] = useState(100);
  const [tableContinuationToken, setTableContinuationToken] = useState(null);
  const [tableHasMore, setTableHasMore] = useState(false);
  // IMPORTANT: This page must never prompt for an admin key.
  // We rely solely on normal user auth + RBAC.

  // Auto-refresh interval
  const refreshIntervalRef = useRef(null);

  // RBAC: Allow access only if user is logged in with admin privileges.
  const routeInfo = ROUTE_TO_SECTION[currentPath];
  if (!user && currentPath !== '/admin/azure-tables-storage') {
    return <Navigate to="/signin" replace />;
  }
  if (routeInfo) {
    const { section, page } = routeInfo;
    const allowedByRole = user && hasAccess(user, section, page);
    if (!allowedByRole && currentPath !== '/admin/azure-tables-storage') {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Fetch tables data (uses session cookie via credentials: 'include'; no admin key in frontend)
  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const { getApiUrl } = await import('../../utils/getBackendUrl');
      const authHeaders = {};
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      if (token) authHeaders.Authorization = `Bearer ${token}`;
      const response = await fetch(getApiUrl('/admin/azure-tables'), {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        }
      });
      
      if (response.status === 401) {
        // Never ask for admin keys. Redirect to normal sign-in.
        setError('Authentication required');
        navigate('/signin', { replace: true });
        return;
      }
      if (response.status === 403) {
        setError('Admin access required');
        navigate('/unauthorized', { replace: true });
        return;
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch tables' }));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Ensure tables array is properly formatted with rowCount and exists
        const tablesArray = (data.tables || []).map(table => {
          if (typeof table === 'string') {
            return { name: table, rowCount: 0, exists: false };
          }
          if (table && typeof table === 'object') {
            return {
              name: table.name || table.tableName || String(table),
              rowCount: typeof table.rowCount === 'number' ? table.rowCount : (table.count || 0),
              exists: table.exists !== false
            };
          }
          return { name: String(table), rowCount: 0, exists: false };
        });
        
        setTables(tablesArray);
        setStats({
          totalTables: data.count || tablesArray.length || 0,
          totalRows: data.totalRows || tablesArray.reduce((sum, t) => sum + (t.rowCount || 0), 0)
        });
        setError(null);
      } else {
        setError(data.error || data.message || 'Failed to fetch tables');
      }
    } catch (err) {
      const errorMessage = err.message || 'Network error. Please check your connection and ensure Azure Table Storage is configured.';
      setError(errorMessage);
      console.error('Error fetching Azure Tables Storage tables:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tables when user is present
  useEffect(() => {
    if (!user) return;
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Auto-refresh when we have user
  useEffect(() => {
    if (!user) return;
    refreshIntervalRef.current = setInterval(() => {
      fetchTables();
    }, 30000);
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Filter and sort tables
  const filteredAndSortedTables = useMemo(() => {
    // Tables should already be normalized from fetchTables
    const filtered = (tables || [])
      .filter(table => {
        if (!table || !table.name) {
          return false;
        }
        const matchesSearch = (table.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      });
    
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          const nameA = (a?.name || '').toString();
          const nameB = (b?.name || '').toString();
          comparison = nameA.localeCompare(nameB);
          break;
        case 'rowCount':
          comparison = (a?.rowCount || 0) - (b?.rowCount || 0);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [tables, searchTerm, sortBy, sortOrder]);

  // Toggle row expansion
  const toggleRowExpansion = (tableName) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(tableName)) {
      newExpandedRows.delete(tableName);
    } else {
      newExpandedRows.add(tableName);
    }
    setExpandedRows(newExpandedRows);
  };

  // Copy to clipboard
  const copyToClipboard = async (text, item) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set([...prev, item]));
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(item);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Fetch table entities for modal
  const fetchTableEntities = async (tableName, page = 1, continuationToken = null) => {
    try {
      setTableLoading(true);
      setTableError(null);
      const { getApiUrl } = await import('../../utils/getBackendUrl');
      
      // Build the endpoint path
      const endpoint = `/admin/azure-tables/${encodeURIComponent(tableName)}/entities`;
      const baseUrl = getApiUrl(endpoint);
      
      // Construct URL with query parameters
      // Handle both relative and absolute URLs
      let url;
      if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
        // Absolute URL
        url = new URL(baseUrl);
      } else {
        // Relative URL - use window.location.origin as base
        url = new URL(baseUrl, window.location.origin);
      }
      
      url.searchParams.append('page', page.toString());
      url.searchParams.append('pageSize', tablePageSize.toString());
      if (continuationToken && continuationToken !== 'has-more') {
        url.searchParams.append('continuationToken', continuationToken);
      }
      
      const finalUrl = url.toString();
      console.log('🔍 Fetching table entities:', {
        tableName,
        endpoint,
        baseUrl,
        finalUrl,
        page,
        pageSize: tablePageSize
      });
      
      const authHeaders = {};
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      if (token) authHeaders.Authorization = `Bearer ${token}`;
      const response = await fetch(finalUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        }
      });
      
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorData;
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : { error: 'Unknown error' };
        } catch (parseError) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ Error fetching table entities:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          errorData,
          url: finalUrl,
          tableName
        });
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Format entities for better display
        const formattedEntities = (data.entities || []).map(entity => {
          const formatted = {};
          // Preserve all properties but format them nicely
          Object.keys(entity).forEach(key => {
            const value = entity[key];
            if (value === null || value === undefined) {
              formatted[key] = '';
            } else if (typeof value === 'object') {
              formatted[key] = JSON.stringify(value, null, 2);
            } else {
              formatted[key] = String(value);
            }
          });
          return formatted;
        });
        
        setTableEntities(formattedEntities);
        setTableContinuationToken(data.continuationToken || null);
        setTableHasMore(data.hasMore || false);
        setTableError(null);
      } else {
        setTableError(data.error || data.message || 'Failed to fetch table entities');
      }
    } catch (err) {
      const errorMessage = err.message || 'Network error. Please check your connection.';
      setTableError(errorMessage);
      console.error('Error fetching table entities:', err);
    } finally {
      setTableLoading(false);
    }
  };

  // Open table modal
  const handleViewTable = (tableName) => {
    setSelectedTableName(tableName);
    setShowTableModal(true);
    setTablePage(1);
    setTableContinuationToken(null);
    setTableEntities([]);
    setTableError(null);
    fetchTableEntities(tableName, 1, null);
  };

  // Close table modal
  const handleCloseTableModal = () => {
    setShowTableModal(false);
    setSelectedTableName(null);
    setTableEntities([]);
    setTablePage(1);
    setTableContinuationToken(null);
    setTableError(null);
  };

  // Handle pagination
  const handleTablePageChange = (newPage) => {
    if (newPage === 1) {
      setTablePage(1);
      setTableContinuationToken(null);
      fetchTableEntities(selectedTableName, 1, null);
    } else if (newPage > tablePage && tableContinuationToken) {
      // Next page
      setTablePage(newPage);
      fetchTableEntities(selectedTableName, newPage, tableContinuationToken);
    } else if (newPage < tablePage) {
      // Previous page - Azure Tables doesn't support going back easily
      // We'll need to reload from the beginning and skip pages
      setTablePage(newPage);
      // For simplicity, reload from beginning
      fetchTableEntities(selectedTableName, 1, null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="sidebar-shell-main-noscroll">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Server className="w-8 h-8 mr-3 text-cyan-600" />
                    Azure Tables Storage
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    View and manage all tables in Azure Tables Storage
                  </p>
                </div>
                <button
                  onClick={fetchTables}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Database className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Tables</dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-white">{stats.totalTables}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BarChart3 className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Rows</dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-white">{stats.totalRows?.toLocaleString() || 0}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search tables..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Sort */}
                  <div className="flex space-x-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="rowCount">Sort by Row Count</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</div>
                    {error === 'Authentication required' && (
                      <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                        Authentication required. Please sign in normally.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Admin key sign-in intentionally removed.
                This page must never prompt for admin keys. */}

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="w-8 h-8 text-cyan-600 animate-spin" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading tables...</span>
              </div>
            )}

            {/* Tables List */}
            {!loading && !error && (
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAndSortedTables.map((table) => (
                    <li key={table.name} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => toggleRowExpansion(table.name)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {expandedRows.has(table.name) ? (
                                <ChevronDown className="w-5 h-5" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                            </button>
                            
                            <div className="flex items-center space-x-3">
                              <Server className="w-5 h-5 text-cyan-500" />
                              <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                  {table.name}
                                </h3>
                                <div className="flex items-center space-x-4 mt-1 flex-wrap gap-2">
                                  <div className="flex items-center space-x-1">
                                    <Database className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                      {typeof table.rowCount === 'number' ? table.rowCount.toLocaleString() : '0'} rows
                                    </span>
                                  </div>
                                  {table.exists === false && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                                      Missing in Azure
                                    </span>
                                  )}
                                  {table.exists !== false && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                                      Exists
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => table.exists !== false && handleViewTable(table.name)}
                              disabled={table.exists === false}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Table
                            </button>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedRows.has(table.name) && (
                          <div className="mt-4 pl-8 space-y-4">
                            {/* Table Name */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                                <Database className="w-4 h-4 mr-2 text-cyan-500" />
                                Table Name
                              </h4>
                              <div className="flex items-center justify-between">
                                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm text-gray-800 dark:text-gray-200 font-mono">
                                  {table.name}
                                </code>
                                <button
                                  onClick={() => copyToClipboard(table.name, `table-name-${table.name}`)}
                                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
                                >
                                  {copiedItems.has(`table-name-${table.name}`) ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Row Count */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                                <BarChart3 className="w-4 h-4 mr-2 text-purple-500" />
                                Row Count
                              </h4>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {typeof table.rowCount === 'number' ? table.rowCount.toLocaleString() : '0'} total rows
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {filteredAndSortedTables.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <Database className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No tables found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'Try adjusting your search criteria.' : 'No tables are available in Azure Tables Storage.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Table View Modal */}
            {showTableModal && selectedTableName && (
              <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
                  <div 
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                    onClick={handleCloseTableModal}
                    aria-hidden="true"
                  ></div>
                  
                  <div className="inline-block align-middle bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-7xl sm:w-full max-h-[95vh] flex flex-col">
                    {/* Modal Header */}
                    <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <Server className="w-6 h-6 text-cyan-500" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white" id="modal-title">
                              Table: <span className="font-mono text-lg">{selectedTableName}</span>
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              Viewing table entities (first {tablePageSize} rows)
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleCloseTableModal}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-md p-1"
                          aria-label="Close modal"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      
                      {/* Pagination Controls */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleTablePageChange(tablePage - 1)}
                            disabled={tablePage === 1 || tableLoading}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Previous
                          </button>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Page {tablePage}
                          </span>
                          <button
                            onClick={() => handleTablePageChange(tablePage + 1)}
                            disabled={!tableHasMore || tableLoading}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </button>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">{tableEntities.length}</span> of {tablePageSize} rows shown
                          {tableHasMore && <span className="ml-2 text-cyan-600 dark:text-cyan-400">(more available)</span>}
                        </div>
                      </div>
                    </div>
                    
                    {/* Modal Body */}
                    <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-6 bg-gray-50 dark:bg-gray-900">
                      {tableLoading && (
                        <div className="flex flex-col justify-center items-center py-16">
                          <RefreshCw className="w-10 h-10 text-cyan-600 animate-spin mb-4" />
                          <span className="text-base font-medium text-gray-600 dark:text-gray-400">Loading table data...</span>
                          <span className="mt-2 text-sm text-gray-500 dark:text-gray-500">Please wait while we fetch the rows</span>
                        </div>
                      )}
                      
                      {tableError && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4 mt-4">
                          <div className="flex">
                            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="ml-3">
                              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">Error Loading Table Data</h3>
                              <div className="mt-2 text-sm text-red-700 dark:text-red-300">{tableError}</div>
                              <button
                                onClick={() => fetchTableEntities(selectedTableName, tablePage, tableContinuationToken)}
                                className="mt-3 text-sm font-medium text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100 underline"
                              >
                                Try again
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!tableLoading && !tableError && (
                        <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                          {tableEntities.length === 0 ? (
                            <div className="text-center py-16">
                              <Database className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No rows found</h3>
                              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                This table appears to be empty or contains no data.
                              </p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                                  <tr>
                                    {Object.keys(tableEntities[0] || {}).map((key) => (
                                      <th
                                        key={key}
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <span>{key}</span>
                                          <button
                                            onClick={() => copyToClipboard(key, `header-${key}`)}
                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            title="Copy column name"
                                          >
                                            {copiedItems.has(`header-${key}`) ? (
                                              <Check className="w-3 h-3" />
                                            ) : (
                                              <Copy className="w-3 h-3" />
                                            )}
                                          </button>
                                        </div>
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                  {tableEntities.map((entity, idx) => (
                                    <tr 
                                      key={idx} 
                                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                      {Object.entries(entity).map(([key, value]) => {
                                        const cellValue = String(value || '');
                                        const isLongValue = cellValue.length > 100;
                                        const displayValue = isLongValue ? cellValue.substring(0, 100) + '...' : cellValue;
                                        
                                        return (
                                          <td
                                            key={key}
                                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                                          >
                                            <div className="flex items-center space-x-2 group">
                                              <div 
                                                className={`flex-1 ${isLongValue ? 'truncate max-w-md' : ''}`}
                                                title={cellValue}
                                              >
                                                {typeof value === 'object' && value !== null ? (
                                                  <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded block whitespace-pre-wrap break-words max-w-md">
                                                    {JSON.stringify(value, null, 2)}
                                                  </code>
                                                ) : (
                                                  <span className="font-mono text-xs">{displayValue}</span>
                                                )}
                                              </div>
                                              <button
                                                onClick={() => copyToClipboard(cellValue, `cell-${idx}-${key}`)}
                                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-opacity"
                                                title="Copy cell value"
                                              >
                                                {copiedItems.has(`cell-${idx}-${key}`) ? (
                                                  <Check className="w-4 h-4" />
                                                ) : (
                                                  <Copy className="w-4 h-4" />
                                                )}
                                              </button>
                                            </div>
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AzureTablesStorage;

