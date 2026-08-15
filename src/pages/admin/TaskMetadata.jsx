import React, { useEffect, useState, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import Pagination from '../../components/Pagination';
import AdvancedDataTable from '../../components/AdvancedDataTable';
import { useAuth } from '../../contexts/AuthContext';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';

import {
  Database,
  RefreshCw,
  Search,
  Download,
  SlidersHorizontal
} from 'lucide-react';

const TaskMetadata = () => {
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('_unixTimestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  const [showFilters, setShowFilters] = useState(false);

  // RBAC enforcement
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  const routeInfo = ROUTE_TO_SECTION[currentPath];
  if (routeInfo) {
    const { section, page: pageName } = routeInfo;
    if (!hasAccess(user, section, pageName)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Debounce search term
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchTaskMetadata = async (opts = {}) => {
    const nextPage = opts.page ?? page;
    const nextPageSize = opts.pageSize ?? pageSize;
    const nextSortBy = opts.sortBy ?? sortBy;
    const nextSortOrder = opts.sortOrder ?? sortOrder;
    const nextSearch = opts.search ?? debouncedSearch;

    try {
      setLoading(true);
      setError(null);

      const base = (import.meta.env.VITE_API_URL || '').trim();
      const params = new URLSearchParams();
      params.append('page', String(nextPage));
      params.append('pageSize', String(nextPageSize));
      if (nextSearch) params.append('search', nextSearch);
      if (nextSortBy) params.append('sortBy', nextSortBy);
      if (nextSortOrder) params.append('sortOrder', nextSortOrder);

      const url = `${base}/api/admin/tasks/metadata/list?${params.toString()}`;
      const resp = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('sessionToken') || localStorage.getItem('token')
            ? { Authorization: `Bearer ${localStorage.getItem('sessionToken') || localStorage.getItem('token')}` }
            : {})
        }
      });

      if (!resp.ok) {
        const msg = await resp.text().catch(() => '');
        throw new Error(msg || `HTTP ${resp.status} ${resp.statusText}`);
      }

      const json = await resp.json();
      if (!json.success) {
        throw new Error(json.message || 'Failed to load task metadata');
      }

      setRecords(json.items || []);
      if (json.pagination) {
        setPage(json.pagination.page || nextPage);
        setPageSize(json.pagination.pageSize || nextPageSize);
        setTotalItems(json.pagination.totalItems || 0);
        setTotalPages(json.pagination.totalPages || 1);
      } else {
        setTotalItems(json.items?.length || 0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching task metadata list:', err);
      setError(err.message || 'Failed to load task metadata');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskMetadata({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const handlePageChange = (newPage) => {
    if (newPage === page) return;
    fetchTaskMetadata({ page: newPage });
  };

  const handlePageSizeChange = (newPageSize) => {
    if (newPageSize === pageSize) return;
    fetchTaskMetadata({ page: 1, pageSize: newPageSize });
  };

  const handleManualRefresh = () => {
    fetchTaskMetadata({});
  };

  const tableColumns = useMemo(
    () => [
      {
        id: 'task_id',
        header: 'Task ID',
        sortable: true,
        minWidth: 200,
        accessor: (row) => row.task_id,
        render: (value) => (
          <span className="font-mono text-xs text-slate-900 dark:text-slate-50">{value || '—'}</span>
        )
      },
      {
        id: 'hashtag',
        header: 'Hashtag',
        sortable: true,
        minWidth: 150,
        accessor: (row) => row.hashtag,
        render: (value) => (
          <span className="font-medium text-slate-900 dark:text-slate-50">{value || '—'}</span>
        )
      },
      {
        id: 'user_email',
        header: 'User Email',
        sortable: true,
        minWidth: 220,
        accessor: (row) => row.user_email,
        render: (value) => (
          <span className="text-slate-700 dark:text-slate-300">{value || '—'}</span>
        )
      },
      {
        id: 'status',
        header: 'Status',
        sortable: true,
        minWidth: 100,
        accessor: (row) => row.status,
        render: (value) => {
          const statusColors = {
            running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
            completed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
            failed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
            cancelled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
          };
          const colorClass = statusColors[value] || 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
              {value || '—'}
            </span>
          );
        }
      },
      {
        id: 'target_count',
        header: 'Target Count',
        sortable: true,
        align: 'right',
        minWidth: 110,
        accessor: (row) => row.target_count,
        render: (value) => value?.toLocaleString?.() ?? (value ?? '—')
      },
      {
        id: 'total_items',
        header: 'Total Items',
        sortable: true,
        align: 'right',
        minWidth: 110,
        accessor: (row) => row.total_items,
        render: (value) => value?.toLocaleString?.() ?? (value ?? '—')
      },
      {
        id: 'total_calls',
        header: 'Total Calls',
        sortable: true,
        align: 'right',
        minWidth: 110,
        accessor: (row) => row.total_calls,
        render: (value) => value?.toLocaleString?.() ?? (value ?? '—')
      },
      {
        id: 'summary_total_likes',
        header: 'Total Likes',
        sortable: true,
        align: 'right',
        minWidth: 110,
        accessor: (row) => row.summary?.total_likes,
        render: (value) => value?.toLocaleString?.() ?? (value ?? '—')
      },
      {
        id: 'summary_total_comments',
        header: 'Total Comments',
        sortable: true,
        align: 'right',
        minWidth: 120,
        accessor: (row) => row.summary?.total_comments,
        render: (value) => value?.toLocaleString?.() ?? (value ?? '—')
      },
      {
        id: 'summary_average_likes',
        header: 'Avg Likes',
        sortable: true,
        align: 'right',
        minWidth: 100,
        accessor: (row) => row.summary?.average_likes,
        render: (value) => value != null ? Number(value).toFixed(2) : '—'
      },
      {
        id: 'summary_average_comments',
        header: 'Avg Comments',
        sortable: true,
        align: 'right',
        minWidth: 110,
        accessor: (row) => row.summary?.average_comments,
        render: (value) => value != null ? Number(value).toFixed(2) : '—'
      },
      {
        id: 'summary_verified_users',
        header: 'Verified Users',
        sortable: true,
        align: 'right',
        minWidth: 120,
        accessor: (row) => row.summary?.verified_users,
        render: (value) => value?.toLocaleString?.() ?? (value ?? '—')
      },
      {
        id: 'summary_verified_percentage',
        header: 'Verified %',
        sortable: true,
        align: 'right',
        minWidth: 100,
        accessor: (row) => row.summary?.verified_percentage,
        render: (value) => value != null ? `${Number(value).toFixed(2)}%` : '—'
      },
      {
        id: 'summary_unique_users',
        header: 'Unique Users',
        sortable: true,
        align: 'right',
        minWidth: 120,
        accessor: (row) => row.summary?.unique_users,
        render: (value) => value?.toLocaleString?.() ?? (value ?? '—')
      },
      {
        id: 'summary_final_token',
        header: 'Final Token',
        sortable: true,
        minWidth: 150,
        accessor: (row) => row.summary?.final_token,
        render: (value) => (
          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
            {value ? (value.length > 20 ? `${value.substring(0, 20)}...` : value) : '—'}
          </span>
        )
      },
      {
        id: 'created_at',
        header: 'Created At',
        sortable: true,
        minWidth: 180,
        accessor: (row) => row.created_at,
        render: (value) =>
          value ? new Date(value).toLocaleString(undefined, { hour12: false }) : '—'
      },
      {
        id: '_unixTimestamp',
        header: 'Unix Timestamp',
        sortable: true,
        align: 'right',
        minWidth: 140,
        accessor: (row) => row._unixTimestamp,
        render: (value) => value?.toLocaleString?.() ?? (value ?? '—')
      }
    ],
    []
  );

  const handleSortChangeFromTable = (colId, order) => {
    setSortBy(colId);
    setSortOrder(order);
    fetchTaskMetadata({ sortBy: colId, sortOrder: order, page: 1 });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="sidebar-shell-main-noscroll">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-900">
          <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
            {/* Page header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-700/60 mb-2">
                    <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-300 mr-1.5" />
                    <span className="text-xs font-medium text-indigo-700 dark:text-indigo-200">
                      Admin • Task Metadata
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">
                    Task Metadata
                  </h1>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                    All task metadata records from the{' '}
                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      dev-unified-tasks
                    </span>{' '}
                    container in Cosmos DB. View task details, status, and progress metrics.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Future: export hook */}
                  <button
                    type="button"
                    className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export (coming soon)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleManualRefresh}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Filters + search */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-5"
            >
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 sm:px-5 py-4 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="search"
                        placeholder="Search by hashtag, user email, task ID, or status…"
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setPage(1);
                        }}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowFilters((prev) => !prev)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors ${
                        showFilters
                          ? 'bg-slate-900 text-slate-50 border-slate-800'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      <span>Columns & sorting</span>
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          Sorting:{' '}
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            {sortBy.replace(/_/g, ' ')} ({sortOrder === 'asc' ? 'ascending' : 'descending'})
                          </span>
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>
                          Page size:{' '}
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            {pageSize} rows
                          </span>
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>
                          View:{' '}
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            Spreadsheet-style table
                          </span>
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Error state */}
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-200">
                <p className="font-medium">Unable to load task metadata</p>
                <p className="mt-1 text-xs opacity-90">{error}</p>
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  className="mt-2 inline-flex items-center px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Table */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="mb-4"
            >
              <AdvancedDataTable
                columns={tableColumns.map((c) => ({
                  ...c,
                  sortable: true
                }))}
                data={records}
                loading={loading}
                emptyMessage="No task metadata records found for the current filters."
                density="compact"
                // Allow the table to communicate sort changes back up if we want to sync controls
                onSortChange={handleSortChangeFromTable}
              />
            </motion.div>

            {/* Pagination footer – Gmail-style using shared component */}
            <div className="rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                loading={loading}
                showPageSizeSelector={true}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TaskMetadata;

