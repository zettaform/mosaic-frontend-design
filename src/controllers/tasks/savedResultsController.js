import { useState, useCallback, useRef } from 'react';
import { getBackendUrl } from '../../utils/getBackendUrl';
import { createTimeoutSignal } from '../../utils/timeoutSignal';

/** Cosmos / admin tasks can be slow; override with VITE_TASKS_FETCH_TIMEOUT_MS (milliseconds). */
const TASKS_FETCH_TIMEOUT_MS = (() => {
  const raw = typeof import.meta !== 'undefined' && import.meta.env?.VITE_TASKS_FETCH_TIMEOUT_MS;
  const n = raw != null && raw !== '' ? parseInt(String(raw), 10) : NaN;
  return Number.isFinite(n) && n >= 5000 ? n : 90000;
})();

function isFetchTimeoutError(err) {
  if (!err) return false;
  const name = err.name || '';
  const msg = String(err.message || '');
  return (
    name === 'AbortError' ||
    name === 'TimeoutError' ||
    msg.includes('signal timed out') ||
    msg.includes('The operation was aborted') ||
    msg.includes('aborted')
  );
}

function getAuthHeaders() {
  const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Saved Results Controller
 * Handles saved results loading, filtering, pagination, and task management
 * 
 * @param {Object} user - User object with email property for tenant filtering
 * @returns {Object} Controller interface with state and functions
 */
export const useSavedResultsController = (user) => {
  // Saved results state
  const [savedResults, setSavedResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [isSilentRefreshing, setIsSilentRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [retryStatus, setRetryStatus] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [savedResultsPagesCache, setSavedResultsPagesCache] = useState([]); // Cache per page
  const [savedResultsPageNextKeys, setSavedResultsPageNextKeys] = useState([]); // Continuation tokens per page

  // Filtering and sorting
  const [sortBy, setSortBy] = useState('all'); // 'all', 'processing', 'completed', 'cancelled'

  // Refs
  const savedResultsSectionRef = useRef(null);
  const lastSavedRefreshRef = useRef(0);
  const recordsRef = useRef(null);
  const recordsLoadingRef = useRef(false);
  const [recordsNextKey, setRecordsNextKey] = useState(null);
  const [recordsKeyStack, setRecordsKeyStack] = useState([null]);
  const [recordsPageIndex, setRecordsPageIndex] = useState(0);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const MAX_RECORDS_PER_PAGE = 100;
  const DEFAULT_RECORDS_PER_PAGE = 100;
  const [recordsPageSize, setRecordsPageSize] = useState(DEFAULT_RECORDS_PER_PAGE);
  const safeRecordsPageSize = Math.min(recordsPageSize, MAX_RECORDS_PER_PAGE);

  // Task viewing state
  const [viewingTasks, setViewingTasks] = useState(new Set());
  const [terminatingTasks, setTerminatingTasks] = useState(new Set());

  /**
   * Utility: Get UNIX timestamp for consistent ordering
   * @param {string} dateString - ISO date string
   * @returns {number} UNIX timestamp
   */
  const getUnixTimestamp = (dateString) => {
    if (!dateString) return 0;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 0 : Math.floor(date.getTime() / 1000);
  };

  /**
   * Utility: Ensure task has UNIX timestamp
   * @param {Object} task - Task object
   * @returns {Object} Task with UNIX timestamp
   */
  const ensureUnixTimestamp = (task) => {
    if (!task) return task;
    
    const unixTimestamp = task._unixTimestamp || getUnixTimestamp(task.created_at);
    return {
      ...task,
      _unixTimestamp: unixTimestamp,
      created_at: task.created_at || new Date(unixTimestamp * 1000).toISOString()
    };
  };

  /**
   * Load total count of tasks
   */
  const loadTotalCount = useCallback(async () => {
    try {
      const base = getBackendUrl() || '';
      const normalizedBase = base.replace(/\/+$/, '');
      const userEmail = user?.email || null;
      const url = userEmail 
        ? `${normalizedBase}/api/admin/tasks/count?user_email=${encodeURIComponent(userEmail)}`
        : `${normalizedBase}/api/admin/tasks/count`;
      
      const response = await fetch(url, {
        headers: { ...getAuthHeaders() }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const count = data.totalCount || data.count || 0;
          setTotalItems(count);
          console.log('📊 SavedResults: Total count loaded:', { count, userEmail, calculatedPages: Math.ceil(count / pageSize) });
        }
      }
    } catch (err) {
      console.error('Error loading total count:', err);
    }
  }, [pageSize, user?.email]);

  /**
   * Load saved results with pagination
   * @param {Object} options - Loading options
   * @param {number} options.page - Page number
   * @param {number} options.size - Page size
   * @param {string|null} options.lastKey - Pagination key
   * @param {boolean} options.preserveOptimistic - Whether to preserve optimistic updates
   * @param {boolean} options.silent - Whether to use silent refresh (no loading state, no error display)
   */
  const loadSavedResults = useCallback(async ({
    page = 1,
    size = 10,
    lastKey = null,
    preserveOptimistic = false,
    silent = false
  } = {}) => {
    if (recordsLoadingRef.current && !silent) {
      console.log('⏸️ Load already in progress, skipping');
      return;
    }

    recordsLoadingRef.current = true;
    if (silent) {
      setIsSilentRefreshing(true);
    } else {
      setLoadingResults(true);
      setError('');
    }

    try {
      const base = getBackendUrl() || '';
      const normalizedBase = base.replace(/\/+$/, '');
      const userEmail = user?.email || null;
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(size)
      });

      if (userEmail) {
        params.append('user_email', userEmail);
      }

      if (lastKey) {
        params.append('lastKey', lastKey);
        console.log(`🌐 API Call: Loading page ${page} with lastKey:`, typeof lastKey === 'string' ? (lastKey.substring(0, 20) + '...') : lastKey);
      } else {
        console.log(`🌐 API Call: Loading page ${page} without lastKey (first page)`);
      }

      const url = `${normalizedBase}/api/admin/tasks?${params.toString()}`;
      console.log(`🌐 API Call URL:`, url.replace(/lastKey=[^&]+/, 'lastKey=***'));
      
      const response = await fetch(url, {
        headers: { ...getAuthHeaders() },
        signal: createTimeoutSignal(TASKS_FETCH_TIMEOUT_MS)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load tasks: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Debug: Log the full response structure to understand what we're getting
      console.log('📦 Full API Response:', {
        success: data.success,
        hasTasks: !!data.tasks,
        tasksCount: data.tasks?.length || 0,
        hasLastKey: !!data.lastKey,
        hasPagination: !!data.pagination,
        paginationKeys: data.pagination ? Object.keys(data.pagination) : [],
        allResponseKeys: Object.keys(data),
        lastKeyValue: data.lastKey ? (typeof data.lastKey === 'string' ? data.lastKey.substring(0, 30) + '...' : data.lastKey) : null,
        paginationLastKey: data.pagination?.lastKey ? (typeof data.pagination.lastKey === 'string' ? data.pagination.lastKey.substring(0, 30) + '...' : data.pagination.lastKey) : null
      });

      // Debug logging
      console.log('📊 SavedResults: API Response:', {
        success: data.success,
        tasksCount: data.tasks?.length || 0,
        pagination: data.pagination,
        lastKey: data.lastKey,
        totalCount: data.totalCount,
        count: data.count
      });

      if (data.success && data.tasks) {
        // Normalize tasks with UNIX timestamps
        const normalizedTasks = data.tasks.map(ensureUnixTimestamp);
        const responseLastKeyRaw = data.lastKey || data.pagination?.lastKey || null;
        console.log('📊 loadSavedResults: Backend response:', {
          requestedPage: page,
          requestedSize: size,
          returnedTasksCount: normalizedTasks.length,
          expectedCount: size,
          matches: normalizedTasks.length === size ? '✅' : '⚠️ MISMATCH',
          lastKeyUsed: lastKey ? (typeof lastKey === 'string' ? lastKey.substring(0, 30) + '...' : 'present') : 'null',
          responseLastKey: responseLastKeyRaw ? (typeof responseLastKeyRaw === 'string' ? responseLastKeyRaw.substring(0, 30) + '...' : 'present') : 'null',
          responseStructure: {
            hasLastKey: !!data.lastKey,
            hasPaginationLastKey: !!data.pagination?.lastKey,
            hasPagination: !!data.pagination,
            fullResponseKeys: Object.keys(data)
          }
        });

        const sortedTasksForPage = [...normalizedTasks].sort((a, b) => 
          (b._unixTimestamp || 0) - (a._unixTimestamp || 0)
        );

        if (preserveOptimistic) {
          // Merge with existing results, preserving optimistic updates
          setSavedResults(prevResults => {
            const merged = new Map();
            
            // Add existing results
            prevResults.forEach(task => {
              if (task && task.task_id) {
                merged.set(task.task_id, task);
              }
            });
            
            // Update with server data
            sortedTasksForPage.forEach(task => {
              if (task && task.task_id) {
                const existing = merged.get(task.task_id);
                if (existing) {
                  // Preserve optimistic stats if they're newer
                  merged.set(task.task_id, {
                    ...task,
                    ...(existing.total_items > task.total_items ? {
                      total_items: existing.total_items,
                      summary: {
                        ...task.summary,
                        ...(existing.summary?.total_items > task.summary?.total_items ? {
                          total_items: existing.summary.total_items
                        } : {})
                      }
                    } : {})
                  });
                } else {
                  merged.set(task.task_id, task);
                }
              }
            });
            
            return Array.from(merged.values()).sort((a, b) => 
              (b._unixTimestamp || 0) - (a._unixTimestamp || 0)
            );
          });
        } else {
          // Replace with new results (for page changes, this should only contain current page's tasks)
          console.log('📊 loadSavedResults: Replacing savedResults array:', {
            page,
            oldCount: 'N/A (replacing)',
            newCount: sortedTasksForPage.length,
            taskIds: sortedTasksForPage.slice(0, 5).map(t => t.task_id)
          });
          setSavedResults(sortedTasksForPage);
        }

        // Cache per-page results and continuation tokens for consistent pagination
        const responseLastKey = data.lastKey || data.pagination?.lastKey || null;

        setSavedResultsPagesCache(prev => {
          const next = [...prev];
          next[page - 1] = sortedTasksForPage;
          return next.slice(0, page);
        });

        setSavedResultsPageNextKeys(prev => {
          const next = [...prev];
          next[page - 1] = responseLastKey || null;
          return next.slice(0, page);
        });
        
        // Update total items from backend response
        if (data.totalCount) {
          setTotalItems(data.totalCount);
        } else if (data.pagination?.totalPages) {
          // Calculate from totalPages if available
          const calculatedTotal = data.pagination.totalPages * size;
          setTotalItems(prev => prev > 0 ? prev : calculatedTotal);
        }
        
        // Debug logging
        console.log('📊 SavedResults: Pagination state updated:', {
          page,
          size,
          lastKey: lastKey ? 'present' : 'null',
          totalItems,
          normalizedTasksLength: normalizedTasks.length
        });
        
        // Fetch total count after loading page (like GmailConversations)
        // This ensures totalItems is always up-to-date for accurate pagination
        await loadTotalCount();
      } else {
        throw new Error(data.message || 'Failed to load tasks');
      }
    } catch (err) {
      if (isFetchTimeoutError(err)) {
        const msg =
          'Request timed out. The server may be slow or unreachable. Try again in a moment.';
        if (!silent) {
          setError(msg);
          setRetryStatus(null);
        }
        if (import.meta.env?.DEV) {
          console.warn('Saved results fetch timed out after', TASKS_FETCH_TIMEOUT_MS, 'ms');
        }
      } else {
        console.error('❌ Error loading saved results:', err);
        if (!silent) {
          setError(err.message || 'Failed to load saved results');
          setRetryStatus({
            attempt: 1,
            maxRetries: 3,
            message: 'Retrying connection...'
          });
        }
      }
    } finally {
      if (silent) {
        setIsSilentRefreshing(false);
      } else {
        setLoadingResults(false);
      }
      recordsLoadingRef.current = false;
    }
  }, [user?.email, loadTotalCount]);

  /**
   * Refresh current page - uses offset-based pagination
   */
  const refreshCurrentPage = useCallback(() => {
    // Calculate offset for current page (offset-based pagination like unique users)
    const offset = (currentPage - 1) * pageSize;
    const currentOffset = currentPage > 1 ? String(offset) : null;
    
    console.log('🔄 refreshCurrentPage:', {
      currentPage,
      offset,
      currentOffset
    });
    
    loadSavedResults({ 
      page: currentPage, 
      size: pageSize, 
      lastKey: currentOffset,
      preserveOptimistic: false,
      silent: false
    });
  }, [currentPage, pageSize, loadSavedResults]);

  /**
   * Silently refresh current page - updates data without showing loading state
   * Uses preserveOptimistic to smoothly merge updates
   */
  const refreshCurrentPageSilently = useCallback(() => {
    // Skip if already loading (non-silent) or silently refreshing
    if (loadingResults || isSilentRefreshing) {
      return;
    }

    // Calculate offset for current page (offset-based pagination like unique users)
    const offset = (currentPage - 1) * pageSize;
    const currentOffset = currentPage > 1 ? String(offset) : null;
    
    console.log('🔄 refreshCurrentPageSilently:', {
      currentPage,
      offset,
      currentOffset
    });
    
    loadSavedResults({ 
      page: currentPage, 
      size: pageSize, 
      lastKey: currentOffset,
      preserveOptimistic: true,
      silent: true
    });
  }, [currentPage, pageSize, loadSavedResults, loadingResults, isSilentRefreshing]);

  /**
   * Get filtered and sorted tasks
   * @param {Array} tasks - Tasks array
   * @returns {Array} Filtered and sorted tasks
   */
  const getFilteredAndSortedTasks = useCallback((tasks) => {
    if (!Array.isArray(tasks)) return [];

    let filtered = tasks;

    // Apply filter
    if (sortBy === 'processing') {
      filtered = filtered.filter(task => 
        task.status === 'running' || task.status === 'processing'
      );
    } else if (sortBy === 'completed') {
      filtered = filtered.filter(task => task.status === 'completed');
    } else if (sortBy === 'cancelled') {
      filtered = filtered.filter(task => 
        task.status === 'cancelled' || task.status === 'failed'
      );
    }

    // Sort by UNIX timestamp (newest first)
    return filtered.sort((a, b) => 
      (b._unixTimestamp || 0) - (a._unixTimestamp || 0)
    );
  }, [sortBy]);

  /**
   * Load task by ID
   * @param {string} taskId - Task ID
   */
  const loadTaskById = useCallback(async (taskId) => {
    if (!taskId) return;

    try {
      const base = getBackendUrl() || '';
      const normalizedBase = base.replace(/\/+$/, '');
      const response = await fetch(`${normalizedBase}/api/admin/tasks/${taskId}`, {
        headers: { ...getAuthHeaders() }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.task) {
          const normalizedTask = ensureUnixTimestamp(data.task);
          
          // Update or add to saved results
          setSavedResults(prevResults => {
            const existing = prevResults.find(t => t.task_id === taskId);
            if (existing) {
              return prevResults.map(t => 
                t.task_id === taskId ? normalizedTask : t
              );
            } else {
              return [normalizedTask, ...prevResults].sort((a, b) => 
                (b._unixTimestamp || 0) - (a._unixTimestamp || 0)
              );
            }
          });
        }
      }
    } catch (err) {
      console.error('Error loading task by ID:', err);
      setError(err.message || 'Failed to load task');
    }
  }, []);

  /**
   * Upsert saved task (add or update)
   * @param {Object} task - Task object
   */
  const upsertSavedTask = useCallback((task) => {
    if (!task || !task.task_id) return;

    const normalizedTask = ensureUnixTimestamp(task);
    
    setSavedResults(prevResults => {
      const existing = prevResults.find(t => t.task_id === task.task_id);
      
      if (existing) {
        // Update existing - preserve maximum stats
        return prevResults.map(t => {
          if (t.task_id === task.task_id) {
            return {
              ...normalizedTask,
              // Preserve maximum stats
              total_items: Math.max(
                normalizedTask.total_items || 0,
                t.total_items || 0
              ),
              summary: {
                ...normalizedTask.summary,
                total_items: Math.max(
                  normalizedTask.summary?.total_items || 0,
                  t.summary?.total_items || 0
                ),
                unique_users: Math.max(
                  normalizedTask.summary?.unique_users || 0,
                  t.summary?.unique_users || 0
                )
              }
            };
          }
          return t;
        });
      } else {
        // Add new task at the beginning
        return [normalizedTask, ...prevResults].sort((a, b) => 
          (b._unixTimestamp || 0) - (a._unixTimestamp || 0)
        );
      }
    });
  }, []);

  /**
   * Handle page change - uses offset-based pagination (like unique users modal)
   * @param {number} newPage - New page number
   */
  const handlePageChange = useCallback((newPage) => {
    const calculatedTotalPages = Math.ceil(totalItems / pageSize);
    
    if (newPage < 1 || newPage === currentPage) {
      console.log('🚫 handlePageChange: Skipping invalid page change', {
        newPage,
        currentPage
      });
      return;
    }

    // Check if we have cached data for this page
    const cachedPage = savedResultsPagesCache[newPage - 1];
    if (cachedPage) {
      console.log('♻️ handlePageChange: Using cached page data', {
        newPage,
        cachedCount: cachedPage.length
      });
      setCurrentPage(newPage);
      setSavedResults(cachedPage);
      return;
    }
    
    // Calculate offset for the new page (offset-based pagination like unique users)
    // For page 1: offset = 0 (no lastKey)
    // For page 2: offset = pageSize (e.g., "10")
    // For page 3: offset = pageSize * 2 (e.g., "20")
    const offset = (newPage - 1) * pageSize;
    const lastKeyForPage = newPage > 1 ? String(offset) : null;
    
    console.log(`📄 handlePageChange: Loading page ${newPage}`, {
      offset,
      lastKeyForPage,
      pageSize,
      totalItems,
      calculatedTotalPages
    });
    
    setCurrentPage(newPage);
    loadSavedResults({ 
      page: newPage, 
      size: pageSize, 
      lastKey: lastKeyForPage,
      preserveOptimistic: false 
    });
  }, [currentPage, pageSize, totalItems, savedResultsPagesCache, loadSavedResults]);

  /**
   * Handle page size change
   * @param {number} newPageSize - New page size
   */
  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    setSavedResultsPagesCache([]);
    setSavedResultsPageNextKeys([]);
    loadSavedResults({ page: 1, size: newPageSize, lastKey: null });
  }, [loadSavedResults]);

  // Calculate totalPages from totalItems (offset-based pagination like unique users)
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // hasNextPage: true if there are more pages based on total count
  // With offset-based pagination, we can always calculate this from count
  const hasNextPage = totalItems > 0 && currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Return controller interface
  return {
    // State
    savedResults,
    loadingResults,
    isSilentRefreshing,
    setIsSilentRefreshing,
    error,
    setError,
    retryStatus,
    setRetryStatus,
    
    // Pagination state
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage,
    
    // Filtering
    sortBy,
    setSortBy,
    
    // Refs
    savedResultsSectionRef,
    recordsRef,
    recordsNextKey,
    recordsKeyStack,
    recordsPageIndex,
    recordsLoading,
    recordsPageSize: safeRecordsPageSize,
    
    // Task viewing
    viewingTasks,
    setViewingTasks,
    terminatingTasks,
    setTerminatingTasks,
    
    // Actions
    loadSavedResults,
    loadTotalCount,
    refreshCurrentPage,
    refreshCurrentPageSilently,
    getFilteredAndSortedTasks,
    loadTaskById,
    upsertSavedTask,
    handlePageChange,
    handlePageSizeChange
  };
};

