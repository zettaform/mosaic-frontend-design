import { useState, useCallback, useRef, useEffect } from 'react';
import { getBackendUrl } from '../../utils/getBackendUrl';
import { createTimeoutSignal } from '../../utils/timeoutSignal';

function getAuthHeaders() {
  const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const USERS_WITH_EMAILS_PAGE_SIZE = 100;

/**
 * Users Controller
 * Handles user fetching for both task-specific and tenant-wide views
 * 
 * @param {Object} user - Current user object
 * @returns {Object} Controller interface with state and functions
 */
export const useUsersController = (user) => {
  // Task Users state
  const [taskUsers, setTaskUsers] = useState([]);
  const [taskUsersLoading, setTaskUsersLoading] = useState(false);
  const [taskUsersError, setTaskUsersError] = useState(null);
  const [taskUsersSearch, setTaskUsersSearch] = useState('');
  const [taskUsersDebouncedSearch, setTaskUsersDebouncedSearch] = useState('');
  const [taskUsersPages, setTaskUsersPages] = useState([]);
  const [taskUsersPageNextKeys, setTaskUsersPageNextKeys] = useState([]);
  const [taskUsersCurrentPage, setTaskUsersCurrentPage] = useState(1);
  const [taskUsersFilterByEmail, setTaskUsersFilterByEmail] = useState(false);
  const [taskUsersTotalCount, setTaskUsersTotalCount] = useState(null);
  const [taskUsersWithEmailCount, setTaskUsersWithEmailCount] = useState(null);
  const [taskUsersTaskId, setTaskUsersTaskId] = useState(null);
  const [taskUsersTaskHashtag, setTaskUsersTaskHashtag] = useState(null);
  const [taskUsersIsTenantWide, setTaskUsersIsTenantWide] = useState(false);

  // Tenant Users state
  const [tenantUsersWithEmails, setTenantUsersWithEmails] = useState([]);
  const [tenantUsersLoading, setTenantUsersLoading] = useState(false);
  const [tenantUsersError, setTenantUsersError] = useState(null);
  const [tenantUsersSearch, setTenantUsersSearch] = useState('');
  const [tenantUsersDebouncedSearch, setTenantUsersDebouncedSearch] = useState('');
  const [tenantUsersPages, setTenantUsersPages] = useState([]);
  const [tenantUsersPageNextKeys, setTenantUsersPageNextKeys] = useState([]);
  const [tenantUsersCurrentPage, setTenantUsersCurrentPage] = useState(1);
  const [tenantUsersTotalCount, setTenantUsersTotalCount] = useState(null);

  // Total Records state
  const [totalRecords, setTotalRecords] = useState([]);
  const [totalRecordsLoading, setTotalRecordsLoading] = useState(false);
  const [totalRecordsError, setTotalRecordsError] = useState(null);
  const [totalRecordsSearch, setTotalRecordsSearch] = useState('');
  const [totalRecordsDebouncedSearch, setTotalRecordsDebouncedSearch] = useState('');
  const [totalRecordsPages, setTotalRecordsPages] = useState([]);
  const [totalRecordsPageNextKeys, setTotalRecordsPageNextKeys] = useState([]);
  const [totalRecordsCurrentPage, setTotalRecordsCurrentPage] = useState(1);
  const [totalRecordsTotalCount, setTotalRecordsTotalCount] = useState(null);

  // Refs to prevent race conditions
  const taskUsersFetchingRef = useRef(false);
  const taskUsersAbortControllerRef = useRef(null);
  const prevTaskUsersFilterRef = useRef(taskUsersFilterByEmail);

  /**
   * Sanitize error messages - removes technical details
   * @param {string} message - Error message
   * @returns {string} Sanitized error message
   */
  const sanitizeErrorMessage = useCallback((message) => {
    if (!message) {
      return 'Failed to load task users. Please try again or contact support if the issue persists.';
    }

    let messageStr = typeof message === 'string' ? message : String(message);

    // Try to parse JSON if it looks like JSON
    try {
      if (messageStr.trim().startsWith('{') || messageStr.trim().startsWith('[')) {
        const parsed = JSON.parse(messageStr);
        messageStr = parsed.message || parsed.error || parsed.details || parsed.status || messageStr;
        if (typeof messageStr !== 'string') {
          messageStr = JSON.stringify(messageStr);
        }
      }
    } catch {
      // Not JSON, continue with original string
    }

    // Remove all AWS/DynamoDB related terms
    let sanitized = messageStr
      .replace(/DynamoDB/gi, '')
      .replace(/AWS/gi, '')
      .replace(/aws/gi, '')
      .replace(/TableName/gi, '')
      .replace(/getDocClient/gi, '')
      .replace(/ResourceNotFoundException/gi, '')
      .replace(/@aws-sdk/gi, '')
      .replace(/aws-sdk/gi, '')
      .replace(/\{[\s\S]*"status"[\s\S]*\}/gi, '')
      .replace(/\{[\s\S]*"error"[\s\S]*\}/gi, '')
      .replace(/\{[\s\S]*"message"[\s\S]*\}/gi, '')
      .replace(/["{}[\]]/g, '')
      .trim();

    // Check if message contains technical details
    const technicalTerms = [
      'TableName', 'getDocClient', '@aws-sdk', 'aws-sdk', 'DynamoDB', 'AWS', 'aws',
      'ResourceNotFoundException', 'ValidationException', 'ProvisionedThroughput',
      'RequestLimitExceeded', 'ThrottlingException', 'ECONNREFUSED', 'ENOTFOUND'
    ];

    const containsTechnicalDetails = technicalTerms.some(term => 
      sanitized.toLowerCase().includes(term.toLowerCase())
    );

    if (!sanitized || sanitized.length > 200 || containsTechnicalDetails || sanitized.length < 10) {
      return 'Failed to load task users. Please try again or contact support if the issue persists.';
    }

    return sanitized;
  }, []);

  /**
   * Fetch task users (task-specific or tenant-wide)
   * @param {Object} options - Fetch options
   * @param {number} options.page - Page number
   * @param {string|null} options.startKey - Pagination key
   */
  const fetchTaskUsers = useCallback(
    async ({ page = 1, startKey = null } = {}) => {
      // For tenant-wide mode, we need user email; for task mode, we need task ID
      if (taskUsersIsTenantWide) {
        if (!user?.email || taskUsersFetchingRef.current) return;
      } else {
        if (!taskUsersTaskId || taskUsersFetchingRef.current) return;
      }
      
      // Prevent concurrent fetches
      taskUsersFetchingRef.current = true;

      const base = getBackendUrl() || '';
      const normalizedBase = base.replace(/\/+$/, '');
      const params = new URLSearchParams({
        limit: String(USERS_WITH_EMAILS_PAGE_SIZE)
      });

      if (taskUsersIsTenantWide) {
        // Tenant-wide mode: use tenant endpoint
        // Backend expects 'tenant_email' parameter for this endpoint
        if (user?.email) {
          params.append('tenant_email', user.email);
        }
      } else {
        // Task-specific mode: use task endpoint
        params.append('task_id', taskUsersTaskId);
        if (user?.email) {
          params.append('user_email', user.email);
        }
      }

      if (taskUsersDebouncedSearch) {
        params.append('search', taskUsersDebouncedSearch);
      }

      // Add email filter parameter if enabled (only for task-specific mode)
      if (!taskUsersIsTenantWide && taskUsersFilterByEmail) {
        params.append('filter_by_email', 'true');
      }

      if (startKey) {
        params.append('lastKey', startKey);
      }

      // Create abort controller for this fetch
      const abortController = new AbortController();
      taskUsersAbortControllerRef.current = abortController;

      setTaskUsersLoading(true);
      if (page === 1 && !startKey) {
        setTaskUsersError(null);
      }
      
      try {
        // Use different endpoint based on mode
        const endpoint = taskUsersIsTenantWide
          ? `${normalizedBase}/api/admin/unique-users/with-emails/list?${params.toString()}`
          : `${normalizedBase}/api/admin/unique-users/by-task?${params.toString()}`;
        
        const resp = await fetch(endpoint, {
          headers: { ...getAuthHeaders() },
          signal: abortController.signal || createTimeoutSignal(35000)
        });

        if (!resp.ok) {
          let errorMessage = taskUsersIsTenantWide ? 'Unable to load tenant users' : 'Unable to load task users';
          
          try {
            const contentType = resp.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const jsonError = await resp.json();
              errorMessage = jsonError.message || jsonError.error || jsonError.details || errorMessage;
              
              if (typeof errorMessage === 'object') {
                errorMessage = JSON.stringify(errorMessage);
              }
            } else {
              const errorText = await resp.text();
              errorMessage = errorText || errorMessage;
            }
          } catch (parseError) {
            errorMessage = taskUsersIsTenantWide 
              ? 'Failed to load tenant users. Please try again.'
              : 'Failed to load task users. Please try again.';
          }
          
          errorMessage = sanitizeErrorMessage(errorMessage);
          throw new Error(errorMessage);
        }

        const json = await resp.json();
        if (!json.success) {
          let errorMessage = json.message || json.error || (taskUsersIsTenantWide ? 'Failed to load tenant users' : 'Failed to load task users');
          errorMessage = sanitizeErrorMessage(errorMessage);
          throw new Error(errorMessage);
        }

        const nextItems = json.items || [];
        setTaskUsersPages((prev) => {
          const next = [...prev];
          next[page - 1] = nextItems;
          return next;
        });
        setTaskUsers(nextItems);
        setTaskUsersCurrentPage(page);
        const decodedLastKey = typeof json.lastKey === 'string'
          ? (() => {
              try {
                return decodeURIComponent(json.lastKey);
              } catch {
                return json.lastKey;
              }
            })()
          : null;

        setTaskUsersPageNextKeys((prev) => {
          const next = [...prev];
          next[page - 1] = decodedLastKey || null;
          return next;
        });
        
        // Update counts if provided
        if (json.totalUsersCount !== undefined) {
          setTaskUsersTotalCount(json.totalUsersCount);
        }
        if (json.usersWithEmailCount !== undefined) {
          setTaskUsersWithEmailCount(json.usersWithEmailCount);
        }
        
        setTaskUsersError(null);
      } catch (err) {
        // Don't log or set error for aborted requests
        if (err.name === 'AbortError') {
          return;
        }
        
        console.error('❌ Error fetching users:', err);
        const errorMessage = sanitizeErrorMessage(err.message || err.toString());
        setTaskUsersError(errorMessage);
        
        // Only clear users if this is the first page
        if (page === 1) {
          setTaskUsers([]);
        }
      } finally {
        setTaskUsersLoading(false);
        taskUsersFetchingRef.current = false;
        taskUsersAbortControllerRef.current = null;
      }
    },
    [taskUsersTaskId, taskUsersIsTenantWide, taskUsersDebouncedSearch, taskUsersFilterByEmail, user?.email, sanitizeErrorMessage]
  );

  /**
   * Fetch tenant users with emails
   * @param {Object} options - Fetch options
   * @param {number} options.page - Page number
   * @param {string|null} options.startKey - Pagination key
   */
  const fetchTenantUsersWithEmails = useCallback(
    async ({ page = 1, startKey = null } = {}) => {
      if (!user?.email) return;

      const base = getBackendUrl() || '';
      const normalizedBase = base.replace(/\/+$/, '');
      const params = new URLSearchParams({
        tenant_email: user.email,
        limit: String(USERS_WITH_EMAILS_PAGE_SIZE)
      });

      if (tenantUsersDebouncedSearch) {
        params.append('search', tenantUsersDebouncedSearch);
      }

      if (startKey) {
        params.append('lastKey', startKey);
      }
      
      setTenantUsersLoading(true);
      setTenantUsersError(null);

      try {
        const resp = await fetch(`${normalizedBase}/api/admin/unique-users/with-emails/list?${params.toString()}`, {
          headers: { ...getAuthHeaders() },
          signal: createTimeoutSignal(35000)
        });

        if (!resp.ok) {
          let errorMessage = 'Unable to load users with emails';
          try {
            const contentType = resp.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const jsonError = await resp.json();
              errorMessage = jsonError.message || jsonError.error || errorMessage;
              if (typeof errorMessage === 'object') {
                errorMessage = JSON.stringify(errorMessage);
              }
            } else {
              const errorText = await resp.text().catch(() => errorMessage);
              errorMessage = errorText || errorMessage;
            }
          } catch {
            errorMessage = 'Failed to load users with emails. Please try again.';
          }
          
          errorMessage = sanitizeErrorMessage(errorMessage);
          throw new Error(errorMessage);
        }

        const json = await resp.json();
        if (!json.success) {
          let errorMessage = json.message || 'Failed to load users with emails';
          errorMessage = sanitizeErrorMessage(errorMessage);
          throw new Error(errorMessage);
        }

        const nextItems = json.items || [];
        setTenantUsersPages((prev) => {
          const next = [...prev];
          next[page - 1] = nextItems;
          return next;
        });
        setTenantUsersWithEmails(nextItems);
        setTenantUsersCurrentPage(page);
        const decodedLastKey = typeof json.lastKey === 'string'
          ? (() => {
              try {
                return decodeURIComponent(json.lastKey);
              } catch {
                return json.lastKey;
              }
            })()
          : null;
        setTenantUsersPageNextKeys((prev) => {
          const next = [...prev];
          next[page - 1] = decodedLastKey || null;
          return next;
        });
        
        // Capture total count from API response
        if (json.totalUsersCount !== undefined && json.totalUsersCount !== null) {
          setTenantUsersTotalCount(json.totalUsersCount);
        }
      } catch (err) {
        console.error('❌ Error fetching tenant users with emails:', err);
        setTenantUsersError(err.message || 'Failed to load users with emails');
      } finally {
        setTenantUsersLoading(false);
      }
    },
    [tenantUsersDebouncedSearch, user?.email, sanitizeErrorMessage]
  );

  /**
   * Open task users modal
   * @param {string} taskId - Task ID
   * @param {Event} e - Event object
   * @param {boolean} isTenantWide - Whether to show tenant-wide view
   * @param {string|null} taskHashtag - Task hashtag
   */
  const openTaskUsersModal = useCallback((taskId, e, isTenantWide = false, taskHashtag = null) => {
    e?.stopPropagation?.();
    
    // Cancel any ongoing fetch
    if (taskUsersAbortControllerRef.current) {
      taskUsersAbortControllerRef.current.abort();
      taskUsersAbortControllerRef.current = null;
    }
    
    // Reset all state
    setTaskUsersSearch('');
    setTaskUsersDebouncedSearch('');
    setTaskUsersError(null);
    setTaskUsers([]);
    setTaskUsersPages([]);
    setTaskUsersPageNextKeys([]);
    setTaskUsersCurrentPage(1);
    setTaskUsersLoading(false);
    setTaskUsersFilterByEmail(false);
    setTaskUsersTotalCount(null);
    setTaskUsersWithEmailCount(null);
    setTaskUsersTaskHashtag(isTenantWide ? null : (typeof taskHashtag === 'string' ? taskHashtag.replace(/^#/, '') : null));
    taskUsersFetchingRef.current = false;
    
    // Set task ID and mode
    setTaskUsersTaskId(isTenantWide ? null : taskId);
    setTaskUsersIsTenantWide(isTenantWide);
  }, []);

  /**
   * Clear task users cache and reset pagination state
   */
  const clearTaskUsersCache = useCallback(() => {
    // Reset all cache, pagination state, and UI state for consistent loading
    setTaskUsers([]);
    setTaskUsersPages([]);
    setTaskUsersPageNextKeys([]);
    setTaskUsersCurrentPage(1);
    setTaskUsersTotalCount(null);
    setTaskUsersWithEmailCount(null);
    setTaskUsersLoading(true); // Ensure loading state is active
    taskUsersFetchingRef.current = false; // Reset fetch lock
  }, []);

  /**
   * Clear tenant users cache and reset pagination state
   */
  const clearTenantUsersCache = useCallback(() => {
    // Reset all cache, pagination state, and UI state for consistent loading
    setTenantUsersWithEmails([]);
    setTenantUsersPages([]);
    setTenantUsersPageNextKeys([]);
    setTenantUsersCurrentPage(1);
    setTenantUsersTotalCount(null);
    setTenantUsersLoading(true); // Ensure loading state is active
  }, []);

  /**
   * Close task users modal
   */
  const closeTaskUsersModal = useCallback(() => {
    // Cancel any ongoing fetch
    if (taskUsersAbortControllerRef.current) {
      taskUsersAbortControllerRef.current.abort();
      taskUsersAbortControllerRef.current = null;
    }

    // Reset ALL state including pagination (same as openTaskUsersModal)
    setTaskUsersSearch('');
    setTaskUsersDebouncedSearch('');
    setTaskUsersError(null);
    setTaskUsers([]);
    setTaskUsersPages([]);
    setTaskUsersPageNextKeys([]);
    setTaskUsersCurrentPage(1);
    setTaskUsersLoading(false);
    setTaskUsersFilterByEmail(false);
    setTaskUsersTotalCount(null);
    setTaskUsersWithEmailCount(null);
    setTaskUsersTaskId(null);
    setTaskUsersTaskHashtag(null);
    setTaskUsersIsTenantWide(false);
    taskUsersFetchingRef.current = false;
  }, []);

  /**
   * Handle refresh task users
   */
  const handleRefreshTaskUsers = useCallback(() => {
    setTaskUsersPages([]);
    setTaskUsersPageNextKeys([]);
    setTaskUsersCurrentPage(1);
    setTaskUsers([]);
    fetchTaskUsers({ page: 1, startKey: null });
  }, [fetchTaskUsers]);

  /**
   * Handle refresh tenant users
   */
  const handleRefreshTenantUsers = useCallback(() => {
    setTenantUsersPages([]);
    setTenantUsersPageNextKeys([]);
    setTenantUsersCurrentPage(1);
    setTenantUsersWithEmails([]);
    fetchTenantUsersWithEmails({ page: 1, startKey: null });
  }, [fetchTenantUsersWithEmails]);

  /**
   * Handle previous page for task users
   */
  const handlePrevTaskUsersPage = useCallback(() => {
    if (taskUsersCurrentPage <= 1) return;
    const prevPage = taskUsersCurrentPage - 1;
    const cached = taskUsersPages[prevPage - 1];
    if (cached) {
      setTaskUsers(cached);
      setTaskUsersCurrentPage(prevPage);
    }
  }, [taskUsersCurrentPage, taskUsersPages]);

  /**
   * Handle next page for task users
   */
  const handleNextTaskUsersPage = useCallback(() => {
    const currentIndex = taskUsersCurrentPage - 1;
    const nextPage = taskUsersCurrentPage + 1;
    const cached = taskUsersPages[nextPage - 1];
    if (cached) {
      setTaskUsers(cached);
      setTaskUsersCurrentPage(nextPage);
      return;
    }

    const cursor = taskUsersPageNextKeys[currentIndex];
    if (!cursor) return;
    fetchTaskUsers({ page: nextPage, startKey: cursor });
  }, [taskUsersCurrentPage, taskUsersPages, taskUsersPageNextKeys, fetchTaskUsers]);

  /**
   * Handle previous page for tenant users
   */
  const handlePrevTenantUsersPage = useCallback(() => {
    if (tenantUsersCurrentPage <= 1) return;
    const prevPage = tenantUsersCurrentPage - 1;
    const cached = tenantUsersPages[prevPage - 1];
    if (cached) {
      setTenantUsersWithEmails(cached);
      setTenantUsersCurrentPage(prevPage);
    }
  }, [tenantUsersCurrentPage, tenantUsersPages]);

  /**
   * Handle next page for tenant users
   */
  const handleNextTenantUsersPage = useCallback(() => {
    const currentIndex = tenantUsersCurrentPage - 1;
    const nextPage = tenantUsersCurrentPage + 1;
    const cached = tenantUsersPages[nextPage - 1];
    if (cached) {
      setTenantUsersWithEmails(cached);
      setTenantUsersCurrentPage(nextPage);
      return;
    }

    const cursor = tenantUsersPageNextKeys[currentIndex];
    if (!cursor) return;
    fetchTenantUsersWithEmails({ page: nextPage, startKey: cursor });
  }, [tenantUsersCurrentPage, tenantUsersPages, tenantUsersPageNextKeys, fetchTenantUsersWithEmails]);

  // Debounce search for task users
  useEffect(() => {
    const timeout = setTimeout(() => {
      setTaskUsersDebouncedSearch(taskUsersSearch.trim());
    }, 350);
    return () => clearTimeout(timeout);
  }, [taskUsersSearch]);

  // Debounce search for tenant users
  useEffect(() => {
    const timeout = setTimeout(() => {
      setTenantUsersDebouncedSearch(tenantUsersSearch.trim());
    }, 350);
    return () => clearTimeout(timeout);
  }, [tenantUsersSearch]);

  // Debounce search for total records
  useEffect(() => {
    const timeout = setTimeout(() => {
      setTotalRecordsDebouncedSearch(totalRecordsSearch.trim());
    }, 350);
    return () => clearTimeout(timeout);
  }, [totalRecordsSearch]);

  /**
   * Fetch total records from dev-unified-tasks container
   * @param {Object} options - Fetch options
   * @param {number} options.page - Page number
   * @param {string|null} options.startKey - Pagination key (offset)
   */
  const fetchTotalRecords = useCallback(
    async ({ page = 1, startKey = null } = {}) => {
      if (!user?.email) return;

      const base = getBackendUrl() || '';
      const normalizedBase = base.replace(/\/+$/, '');
      const params = new URLSearchParams({
        limit: String(USERS_WITH_EMAILS_PAGE_SIZE)
      });

      // Add user_email for tenant filtering
      if (user?.email) {
        params.append('user_email', user.email);
      }

      if (totalRecordsDebouncedSearch) {
        params.append('search', totalRecordsDebouncedSearch);
      }

      if (startKey) {
        params.append('lastKey', startKey);
      }
      
      setTotalRecordsLoading(true);
      setTotalRecordsError(null);

      try {
        const resp = await fetch(`${normalizedBase}/api/admin/tasks/records/list?${params.toString()}`, {
          headers: { ...getAuthHeaders() },
          signal: createTimeoutSignal(35000)
        });

        if (!resp.ok) {
          let errorMessage = 'Unable to load records';
          try {
            const contentType = resp.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const jsonError = await resp.json();
              errorMessage = jsonError.message || jsonError.error || errorMessage;
              if (typeof errorMessage === 'object') {
                errorMessage = JSON.stringify(errorMessage);
              }
            } else {
              const errorText = await resp.text().catch(() => errorMessage);
              errorMessage = errorText || errorMessage;
            }
          } catch {
            errorMessage = 'Failed to load records. Please try again.';
          }
          
          errorMessage = sanitizeErrorMessage(errorMessage);
          throw new Error(errorMessage);
        }

        const json = await resp.json();
        if (!json.success) {
          let errorMessage = json.message || 'Failed to load records';
          errorMessage = sanitizeErrorMessage(errorMessage);
          throw new Error(errorMessage);
        }

        const nextItems = json.items || [];
        setTotalRecordsPages((prev) => {
          const next = [...prev];
          next[page - 1] = nextItems;
          return next;
        });
        setTotalRecords(nextItems);
        setTotalRecordsCurrentPage(page);
        const decodedLastKey = typeof json.lastKey === 'string'
          ? (() => {
              try {
                return decodeURIComponent(json.lastKey);
              } catch {
                return json.lastKey;
              }
            })()
          : null;
        setTotalRecordsPageNextKeys((prev) => {
          const next = [...prev];
          next[page - 1] = decodedLastKey || null;
          return next;
        });
        
        // Capture total count from API response
        if (json.totalRecordsCount !== undefined && json.totalRecordsCount !== null) {
          setTotalRecordsTotalCount(json.totalRecordsCount);
        }
      } catch (err) {
        console.error('❌ Error fetching total records:', err);
        setTotalRecordsError(err.message || 'Failed to load records');
      } finally {
        setTotalRecordsLoading(false);
      }
    },
    [totalRecordsDebouncedSearch, user?.email, sanitizeErrorMessage]
  );

  /**
   * Clear total records cache and reset pagination state
   */
  const clearTotalRecordsCache = useCallback(() => {
    setTotalRecords([]);
    setTotalRecordsPages([]);
    setTotalRecordsPageNextKeys([]);
    setTotalRecordsCurrentPage(1);
    setTotalRecordsTotalCount(null);
    setTotalRecordsLoading(true);
  }, []);

  /**
   * Handle refresh for total records
   */
  const handleRefreshTotalRecords = useCallback(() => {
    clearTotalRecordsCache();
    fetchTotalRecords({ page: 1, startKey: null });
  }, [clearTotalRecordsCache, fetchTotalRecords]);

  /**
   * Handle previous page for total records
   */
  const handlePrevTotalRecordsPage = useCallback(() => {
    if (totalRecordsCurrentPage <= 1) return;
    const prevPage = totalRecordsCurrentPage - 1;
    const cached = totalRecordsPages[prevPage - 1];
    if (cached) {
      setTotalRecords(cached);
      setTotalRecordsCurrentPage(prevPage);
    }
  }, [totalRecordsCurrentPage, totalRecordsPages]);

  /**
   * Handle next page for total records
   */
  const handleNextTotalRecordsPage = useCallback(() => {
    const currentIndex = totalRecordsCurrentPage - 1;
    const nextPage = totalRecordsCurrentPage + 1;
    const cached = totalRecordsPages[nextPage - 1];
    if (cached) {
      setTotalRecords(cached);
      setTotalRecordsCurrentPage(nextPage);
      return;
    }

    const cursor = totalRecordsPageNextKeys[currentIndex];
    if (!cursor) return;
    fetchTotalRecords({ page: nextPage, startKey: cursor });
  }, [totalRecordsCurrentPage, totalRecordsPages, totalRecordsPageNextKeys, fetchTotalRecords]);

  // Reset and refetch task users when the email filter toggles
  useEffect(() => {
    if (prevTaskUsersFilterRef.current === taskUsersFilterByEmail) {
      return;
    }
    prevTaskUsersFilterRef.current = taskUsersFilterByEmail;

    // Cancel any in-flight request so outdated cursors don't race in
    if (taskUsersAbortControllerRef.current) {
      taskUsersAbortControllerRef.current.abort();
      taskUsersAbortControllerRef.current = null;
    }
    taskUsersFetchingRef.current = false;

    setTaskUsersPages([]);
    setTaskUsersPageNextKeys([]);
    setTaskUsersCurrentPage(1);
    setTaskUsers([]);

    if (!taskUsersTaskId || taskUsersIsTenantWide) {
      return;
    }

    fetchTaskUsers({ page: 1, startKey: null });
  }, [taskUsersFilterByEmail, taskUsersIsTenantWide, taskUsersTaskId, fetchTaskUsers]);

  // Return controller interface
  return {
    // Task Users state
    taskUsers,
    taskUsersLoading,
    taskUsersError,
    taskUsersSearch,
    setTaskUsersSearch,
    taskUsersDebouncedSearch,
    taskUsersPages,
    taskUsersPageNextKeys,
    taskUsersCurrentPage,
    taskUsersFilterByEmail,
    setTaskUsersFilterByEmail,
    taskUsersTotalCount,
    taskUsersWithEmailCount,
    taskUsersTaskId,
    taskUsersTaskHashtag,
    taskUsersIsTenantWide,
    
    // Tenant Users state
    tenantUsersWithEmails,
    tenantUsersLoading,
    tenantUsersError,
    tenantUsersSearch,
    setTenantUsersSearch,
    tenantUsersDebouncedSearch,
    tenantUsersPages,
    tenantUsersPageNextKeys,
    tenantUsersCurrentPage,
    tenantUsersTotalCount,
    
    // Total Records state
    totalRecords,
    totalRecordsLoading,
    totalRecordsError,
    setTotalRecordsError,
    totalRecordsSearch,
    setTotalRecordsSearch,
    totalRecordsDebouncedSearch,
    totalRecordsPages,
    totalRecordsPageNextKeys,
    totalRecordsCurrentPage,
    totalRecordsTotalCount,
    
    // Actions
    fetchTaskUsers,
    fetchTenantUsersWithEmails,
    fetchTotalRecords,
    openTaskUsersModal,
    closeTaskUsersModal,
    clearTaskUsersCache,
    clearTenantUsersCache,
    clearTotalRecordsCache,
    handleRefreshTaskUsers,
    handleRefreshTenantUsers,
    handleRefreshTotalRecords,
    handlePrevTaskUsersPage,
    handleNextTaskUsersPage,
    handlePrevTenantUsersPage,
    handleNextTenantUsersPage,
    handlePrevTotalRecordsPage,
    handleNextTotalRecordsPage,

    // Setters
    setTaskUsersTaskId,
    setTaskUsersIsTenantWide
  };
};

