import { useState, useEffect, useCallback, useRef } from 'react';
import { createTimeoutSignal } from '../../../utils/timeoutSignal';

const getApiBaseUrl = () => (import.meta.env.VITE_API_URL || '').trim();
const getSessionToken = () => (localStorage.getItem('sessionToken') || localStorage.getItem('token') || '').trim();

export function useSavedTasks(user) {
  const [savedResults, setSavedResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [recordsNextKey, setRecordsNextKey] = useState(null);
  const [recordsKeyStack, setRecordsKeyStack] = useState([null]);
  const [recordsPageIndex, setRecordsPageIndex] = useState(0);
  const [recordsPageSize, setRecordsPageSize] = useState(50);
  const [sortBy, setSortBy] = useState('all');
  const lastSavedRefreshRef = useRef(0);
  const silentRefreshInProgressRef = useRef(false);

  const getUnixTimestamp = (dateString) => {
    if (!dateString) return 0;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 0 : Math.floor(date.getTime() / 1000);
  };

  const ensureUnixTimestamp = (task) => {
    if (!task) return task;
    
    const unixTimestamp = task._unixTimestamp || getUnixTimestamp(task.created_at);
    return {
      ...task,
      _unixTimestamp: unixTimestamp,
      created_at: task.created_at || new Date(unixTimestamp * 1000).toISOString()
    };
  };

  const fetchSavedResults = useCallback(async (options = {}) => {
    const { silent = false, startKey = null } = options;

    if (!user?.email) {
      console.log('⚠️ useSavedTasks: No user email, skipping fetch');
      return;
    }

    console.log(`🔄 useSavedTasks: Fetching saved results (${silent ? 'silent' : 'interactive'}) for ${user.email}`);

    if (silent) {
      if (silentRefreshInProgressRef.current) return;
      silentRefreshInProgressRef.current = true;
    } else {
      setLoadingResults(true);
    }

    const base = getApiBaseUrl();
    const params = new URLSearchParams({
      user_email: user.email,
      pageSize: String(recordsPageSize),
      page: String(recordsPageIndex + 1)
    });

    if (startKey) params.append('lastKey', startKey);

    try {
      const resp = await fetch(`${base}/api/admin/tasks?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(getSessionToken() ? { Authorization: `Bearer ${getSessionToken()}` } : {})
        },
        signal: createTimeoutSignal(35000)
      });

      if (!resp.ok) throw new Error('Failed to fetch saved tasks');

      const json = await resp.json();
      console.log('📊 useSavedTasks: API Response:', json);

      if (json.success) {
        const tasksWithTimestamps = (json.tasks || []).map(ensureUnixTimestamp);
        console.log(`✅ useSavedTasks: Loaded ${tasksWithTimestamps.length} tasks`);
        setSavedResults(tasksWithTimestamps);
        setRecordsNextKey(json.pagination?.lastKey || null);
        lastSavedRefreshRef.current = Date.now();
      } else {
        console.error('❌ useSavedTasks: API returned success=false:', json);
      }
    } catch (err) {
      console.error('❌ useSavedTasks: Error fetching saved results:', err);
    } finally {
      if (silent) {
        silentRefreshInProgressRef.current = false;
      } else {
        setLoadingResults(false);
      }
    }
  }, [user?.email, recordsPageSize]);

  const handleNextPage = () => {
    if (!recordsNextKey || loadingResults) return;
    setRecordsKeyStack(prev => [...prev, recordsNextKey]);
    setRecordsPageIndex(prev => prev + 1);
    fetchSavedResults({ startKey: recordsNextKey });
  };

  const handlePrevPage = () => {
    if (recordsPageIndex <= 0 || loadingResults) return;
    const newIndex = recordsPageIndex - 1;
    const prevKey = recordsKeyStack[newIndex];
    setRecordsPageIndex(newIndex);
    setRecordsKeyStack(prev => prev.slice(0, newIndex + 1));
    fetchSavedResults({ startKey: prevKey });
  };

  // Initial load
  useEffect(() => {
    fetchSavedResults();
  }, [user?.email]);

  // Silent refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSavedResults({ silent: true });
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchSavedResults]);

  return {
    savedResults,
    loadingResults,
    sortBy,
    setSortBy,
    recordsPageIndex,
    recordsNextKey,
    handleNextPage,
    handlePrevPage,
    fetchSavedResults
  };
}

