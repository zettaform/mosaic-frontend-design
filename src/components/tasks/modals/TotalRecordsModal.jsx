import React from 'react';
import { X, Database, BarChart3, Sparkles, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import AdvancedDataTable from '../../AdvancedDataTable';

/**
 * Total Records Modal Component
 * Displays all records from dev-unified-tasks container
 * 
 * @param {Object} props
 * @param {Object} props.modals - Modals controller
 * @param {Object} props.users - Users controller
 */
export default function TotalRecordsModal({ modals, users }) {
  const {
    showTotalRecordsModal,
    closeTotalRecordsModal
  } = modals;

  const {
    totalRecords,
    totalRecordsLoading,
    totalRecordsError,
    totalRecordsSearch,
    setTotalRecordsSearch,
    totalRecordsTotalCount,
    totalRecordsCurrentPage,
    totalRecordsPageNextKeys,
    handleRefreshTotalRecords,
    handlePrevTotalRecordsPage,
    handleNextTotalRecordsPage
  } = users;

  // Compute pagination flags
  const totalRecordsHasNextPage = Boolean(totalRecordsPageNextKeys[totalRecordsCurrentPage - 1]);
  const totalRecordsHasPrevPage = totalRecordsCurrentPage > 1;

  if (!showTotalRecordsModal) return null;

  // Define columns for records table - showing all available fields
  const recordsColumns = [
    {
      id: 'task_id',
      header: 'Task ID',
      sortable: true,
      minWidth: 180,
      accessor: (row) => row.task_id || '',
      render: (value) => (
        <span className="font-mono text-xs text-slate-700 dark:text-slate-200">{value || '-'}</span>
      )
    },
    {
      id: 'hashtag',
      header: 'Hashtag',
      sortable: true,
      minWidth: 120,
      accessor: (row) => row.hashtag || '',
      render: (value) => (
        <span className="text-xs text-slate-700 dark:text-slate-200">{value ? `#${value}` : '-'}</span>
      )
    },
    {
      id: 'userid',
      header: 'User ID',
      sortable: true,
      minWidth: 140,
      accessor: (row) => row.userid || row.user_id || row.instagram_id || '',
      render: (value) => (
        <span className="font-mono text-xs text-slate-700 dark:text-slate-200">{value || '-'}</span>
      )
    },
    {
      id: 'login',
      header: 'Handle',
      sortable: true,
      minWidth: 130,
      accessor: (row) => row.login || row.username || '',
      render: (value) => (
        <span className="text-xs text-slate-700 dark:text-slate-200">{value ? `@${value}` : '-'}</span>
      )
    },
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      minWidth: 150,
      accessor: (row) => row.name || row.full_name || '',
      render: (value) => (
        <span className="text-xs text-slate-700 dark:text-slate-200 truncate block max-w-[150px]" title={value || ''}>{value || '-'}</span>
      )
    },
    {
      id: 'captions',
      header: 'Captions',
      sortable: true,
      minWidth: 250,
      accessor: (row) => row.caption_text || '',
      render: (value) => (
        <span className="text-xs text-slate-700 dark:text-slate-200 truncate block max-w-[300px]" title={value || ''}>{value || '-'}</span>
      )
    },
    {
      id: 'likes',
      header: 'Likes',
      sortable: true,
      minWidth: 100,
      align: 'right',
      accessor: (row) => row.likes_count || 0,
      render: (value) => (
        <span className="font-mono text-xs text-slate-700 dark:text-slate-200">{Number(value || 0).toLocaleString()}</span>
      )
    },
    {
      id: 'comments',
      header: 'Comments',
      sortable: true,
      minWidth: 100,
      align: 'right',
      accessor: (row) => row.comments_count || 0,
      render: (value) => (
        <span className="font-mono text-xs text-slate-700 dark:text-slate-200">{Number(value || 0).toLocaleString()}</span>
      )
    },
    {
      id: 'code',
      header: 'Code',
      sortable: true,
      minWidth: 100,
      accessor: (row) => row.code || '',
      render: (value) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{value || '-'}</span>
      )
    },
    {
      id: 'item_index',
      header: '#',
      sortable: true,
      minWidth: 60,
      align: 'right',
      accessor: (row) => row.item_index || '',
      render: (value) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">{value || '-'}</span>
      )
    },
    {
      id: 'created_at',
      header: 'Created At',
      sortable: true,
      minWidth: 160,
      accessor: (row) => row.created_at || '',
      render: (value) => {
        if (!value) return '-';
        const date = new Date(value);
        return (
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {date.toLocaleString()}
          </span>
        );
      }
    }
  ];

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-6"
      onClick={closeTotalRecordsModal}
    >
      <div
        className="relative w-full"
        style={{ width: '90vw', height: '90vh', maxWidth: '1600px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden">
          <div className="flex flex-col gap-4 px-8 py-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50/70 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-100 text-blue-600 dark:text-blue-300 text-xs font-semibold tracking-wide uppercase">
                  <Database className="w-4 h-4" />
                  <span>All Records</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 whitespace-nowrap">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span>{totalRecords.length.toLocaleString()} rows loaded</span>
                  </span>
                  {totalRecordsTotalCount !== null && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 whitespace-nowrap">
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                      <span>{totalRecordsTotalCount.toLocaleString()} total records</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 whitespace-nowrap">
                    <BarChart3 className={`w-4 h-4 ${totalRecordsLoading ? 'animate-spin text-blue-500' : 'text-slate-400'}`} />
                    <span>{totalRecordsLoading ? 'Refreshing dataset…' : 'Live view'}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 whitespace-nowrap">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>100 rows/page</span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeTotalRecordsModal}
                className="self-start inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <span className="sr-only">Close modal</span>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="px-8 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="search"
                  value={totalRecordsSearch}
                  onChange={(e) => setTotalRecordsSearch(e.target.value)}
                  placeholder="Search by task ID, hashtag, user ID, handle, or name…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>
            {totalRecordsError && !totalRecordsLoading && (
              <div className="mt-3 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <svg className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs font-medium text-red-700 dark:text-red-200 break-words">
                    {totalRecordsError}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => users.setTotalRecordsError(null)}
                  className="flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                  aria-label="Dismiss error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden px-6 py-4 bg-gradient-to-b from-white via-white/90 to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
            <AdvancedDataTable
              columns={recordsColumns}
              data={totalRecords}
              loading={totalRecordsLoading}
              emptyMessage="No records match your filters."
              density="compact"
            />
          </div>

          <div className="px-8 py-4 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {totalRecordsHasNextPage
                ? "Navigate to the next page to keep browsing all records."
                : 'All available records are in view.'}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <button
                type="button"
                onClick={handleRefreshTotalRecords}
                disabled={totalRecordsLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${totalRecordsLoading ? 'animate-spin text-blue-600' : 'text-slate-500 dark:text-slate-300'}`} />
                <span>Refresh data</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevTotalRecordsPage}
                  disabled={!totalRecordsHasPrevPage || totalRecordsLoading}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[3rem] text-center">Page {totalRecordsCurrentPage}</span>
                <button
                  type="button"
                  onClick={handleNextTotalRecordsPage}
                  disabled={!totalRecordsHasNextPage || totalRecordsLoading}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
