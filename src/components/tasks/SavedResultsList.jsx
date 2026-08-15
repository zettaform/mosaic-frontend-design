import React, { useEffect } from 'react';
import Pagination from '../Pagination';

/**
 * Saved Results List Component
 * Displays the list of saved tasks with filtering, pagination, and actions
 * 
 * @param {Object} props
 * @param {Object} props.savedResults - Saved results controller
 * @param {Object} props.modals - Modals controller
 * @param {Object} props.users - Users controller
 * @param {Object} props.animations - Animation controller
 * @param {Object} props.polling - Polling controller
 */
export default function SavedResultsList({ savedResults, modals, users, animations, polling }) {
  const {
    savedResults: tasks,
    loadingResults,
    isSilentRefreshing,
    error,
    retryStatus,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    hasNextPage,
    hasPrevPage,
    sortBy,
    setSortBy,
    refreshCurrentPage,
    refreshCurrentPageSilently,
    handlePageChange,
    handlePageSizeChange,
    getFilteredAndSortedTasks,
    savedResultsSectionRef,
    viewingTasks,
    terminatingTasks,
    liveUniqueUsersByTask
  } = savedResults;

  const { savedResultsHighlight } = animations;
  const { ensureRunningTasksVisible } = polling;

  // Auto-refresh saved results every 5 seconds (silent refresh to avoid page flashing)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if not currently loading (either regular or silent)
      if (!loadingResults && !isSilentRefreshing) {
        refreshCurrentPageSilently();
      }
    }, 5000); // 5 seconds

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [loadingResults, isSilentRefreshing, refreshCurrentPageSilently]);

  // Filter and sort tasks
  // Note: The backend should return only pageSize tasks for the current page
  // If tasks.length > pageSize, it means the backend is returning more than requested
  const filteredTasks = getFilteredAndSortedTasks(tasks);

  // Debug logging
  console.log('📊 SavedResultsList: Render state:', {
    tasksCount: tasks.length,
    filteredTasksCount: filteredTasks.length,
    totalPages,
    hasNextPage,
    currentPage,
    pageSize,
    totalItems,
    shouldShowPagination: (totalPages > 1) || hasNextPage || tasks.length >= pageSize,
    warning: tasks.length > pageSize ? `⚠️ Backend returned ${tasks.length} tasks but pageSize is ${pageSize}. Expected exactly ${pageSize} tasks for page ${currentPage}.` : null
  });

  return (
    <div className="space-y-6">
      {/* Saved Results List */}
      <div 
        ref={savedResultsSectionRef}
        className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 ${
          savedResultsHighlight ? 'spotlight-glow breathing-illumination' : ''
        }`}
        style={{
          willChange: savedResultsHighlight ? 'box-shadow, transform' : 'auto',
          transition: savedResultsHighlight ? 'box-shadow 0.3s ease-out' : 'none'
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Saved Tasks</h2>
            {totalItems > 0 && (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                ({filteredTasks.length} of {totalItems} tasks)
              </span>
            )}
            {isSilentRefreshing && (
              <span className="flex items-center text-xs text-emerald-600 dark:text-emerald-300 gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Syncing
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 w-full sm:w-auto">
            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">Filter:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-44"
              >
                <option value="all">All Tasks</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button
              onClick={refreshCurrentPage}
              disabled={loadingResults}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2 justify-center w-full sm:w-auto"
            >
              {loadingResults ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Retry Status Display */}
        {retryStatus && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              <div className="flex-1">
                <div className="font-semibold text-blue-800 dark:text-blue-200 mb-1">Reconnecting...</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">{retryStatus.message}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-semibold text-red-800 dark:text-red-200 mb-1">Request Error</div>
                <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
              <button
                onClick={() => {
                  savedResults.setError('');
                  savedResults.setRetryStatus(null);
                  refreshCurrentPage();
                }}
                className="ml-4 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry
              </button>
            </div>
          </div>
        )}
        
        {loadingResults ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            <span className="ml-2 text-slate-600 dark:text-slate-400">Loading results...</span>
          </div>
        ) : error && tasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-red-600 dark:text-red-400 mb-2">Failed to load saved results</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              The system attempted automatic retries but was unable to connect. This may happen after a long period of inactivity.
            </div>
            <button
              onClick={() => {
                savedResults.setError('');
                savedResults.setRetryStatus(null);
                refreshCurrentPage();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Retry Loading
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            No saved results found. Run a hashtag collection to see results here.
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            No {sortBy === 'all' ? '' : sortBy} tasks found. Try changing the filter or run a new hashtag collection.
          </div>
        ) : (
          <div className="space-y-3 stable-layout">
            {filteredTasks.map((task, index) => (
              <div
                key={task.task_id}
                className={`border rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer smooth-transition no-flicker ${
                  task.status === 'running' 
                    ? 'border-blue-300 dark:border-blue-600 bg-blue-50/30 dark:bg-blue-900/20' 
                    : task.status === 'completed'
                    ? 'border-green-300 dark:border-green-600 bg-green-50/20 dark:bg-green-900/10 task-completed'
                    : (task.status === 'cancelled' || task.status === 'failed')
                    ? 'border-red-300 dark:border-red-600 bg-red-50/20 dark:bg-red-900/10'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
                onClick={() => modals.loadTaskForModal(task.task_id)}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      #{task.hashtag} - {task.total_items ?? task.summary?.total_items ?? 0} items
                      {task.status === 'running' && (
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
                          <span className="text-xs">Processing...</span>
                        </div>
                      )}
                      {task.status === 'completed' && (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs">Completed</span>
                        </div>
                      )}
                      {(task.status === 'cancelled' || task.status === 'failed') && (
                        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs">Cancelled</span>
                        </div>
                      )}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(task.created_at).toLocaleString()} • Unique users: {task.summary?.unique_users ?? liveUniqueUsersByTask?.[task.task_id] ?? 0}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full md:w-auto md:flex-nowrap">
                    {task.status === 'running' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          savedResults.terminateTask(task.task_id, e);
                        }}
                        disabled={terminatingTasks?.has(task.task_id)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded text-sm transition-colors duration-200 flex items-center gap-1 justify-center w-full sm:w-auto"
                      >
                        {terminatingTasks?.has(task.task_id) ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                            Terminating...
                          </>
                        ) : (
                          'Terminate'
                        )}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        modals.openTaskUsersModal(task.task_id, e, false, task.hashtag);
                      }}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition-colors duration-200 flex items-center space-x-1 shadow-sm hover:shadow-md justify-center w-full sm:w-auto"
                      title={`View users for task ${task.task_id}`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span>View Users</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        modals.openTaskViewModal(task.task_id);
                      }}
                      disabled={viewingTasks?.has(task.task_id)}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded text-sm font-medium transition-colors duration-200 flex items-center gap-1 justify-center w-full sm:w-auto"
                      title={`View task records for task ${task.task_id}`}
                    >
                      {viewingTasks?.has(task.task_id) ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                          <span>Loading...</span>
                        </>
                      ) : (
                        'View'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination - Show when there are items and we need pagination (offset-based pagination) */}
      {tasks.length > 0 && totalItems > 0 && (totalItems > pageSize || totalPages > 1 || hasNextPage) && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            loading={loadingResults}
            showPageSizeSelector={true}
            useContinuationTokens={false}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
          />
        </div>
      )}
    </div>
  );
}

