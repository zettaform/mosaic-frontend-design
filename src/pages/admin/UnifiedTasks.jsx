import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';

function UnifiedTasks() {
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hashtag, setHashtag] = useState('summer');
  const [targetCount, setTargetCount] = useState(100);
  const [paginationToken, setPaginationToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [extractedItems, setExtractedItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [lastRequestUrl, setLastRequestUrl] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ current: 0, target: 0, phase: '' });
  
  // New state for saved results
  const [savedResults, setSavedResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'saved'
  const [animatedRows, setAnimatedRows] = useState([]);
  const [bgTaskId, setBgTaskId] = useState(null);
  const [bgStatus, setBgStatus] = useState(null);
  const [bgPolling, setBgPolling] = useState(false);
  const recordsRef = useRef(null);
  const [recordsNextKey, setRecordsNextKey] = useState(null);
  const [recordsKeyStack, setRecordsKeyStack] = useState([null]);
  const [recordsPageIndex, setRecordsPageIndex] = useState(0);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsPageSize, setRecordsPageSize] = useState(50);
  const [liveUniqueUsersByTask, setLiveUniqueUsersByTask] = useState({});
  const lastSavedRefreshRef = useRef(0);

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

  // Load saved hashtag results on component mount
  useEffect(() => {
    loadSavedResults();
  }, []);

  const loadSavedResults = async () => {
    setLoadingResults(true);
    setError(''); // Clear previous errors
    
    try {
      const base = (import.meta.env.VITE_API_URL || '').trim();
      let lastKey = null;
      let all = [];
      let page = 0;
      do {
        const url = `${base}/api/admin/unified-tasks?limit=200${lastKey ? `&lastKey=${encodeURIComponent(lastKey)}` : ''}`;
        console.log(`🔄 UNIFIED API: Loading saved tasks page ${++page}`);
        const resp = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' }, timeout: 15000 });
        if (!resp.ok) {
          const errorText = await resp.text();
          throw new Error(`Server error: ${resp.status} ${resp.statusText}${errorText ? ` - ${errorText}` : ''}`);
        }
        const json = await resp.json();
        if (!json || typeof json !== 'object' || !Array.isArray(json.tasks)) break;
        all = all.concat(json.tasks || []);
        lastKey = json.lastKey || null;
      } while (lastKey);

      const tasks = all.filter(task => {
        // Validate each task has required fields
        if (!task.task_id || !task.created_at) {
          console.warn('⚠️ UNIFIED WARNING: Invalid task data detected:', task);
          return false;
        }
        return true;
      }).sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
      
      setSavedResults(tasks);
      console.log(`✅ UNIFIED SUCCESS: Loaded ${tasks.length} valid tasks`);

      // For running tasks, trigger background unique count refresh
      refreshLiveUniqueCounts(tasks.filter(t => (t.status === 'running' || t.status === 'queued') && t.task_id));
      
    } catch (error) {
      console.error('❌ UNIFIED ERROR: Failed to load saved results:', error);
      setError(`Failed to load saved results: ${error.message}`);
    } finally {
      setLoadingResults(false);
    }
  };

  const refreshLiveUniqueCounts = async (runningTasks) => {
    if (!runningTasks || runningTasks.length === 0) return;
    
    const base = (import.meta.env.VITE_API_URL || '').trim();
    const counts = {};
    
    for (const task of runningTasks) {
      try {
        const url = `${base}/api/admin/unified-tasks/${task.task_id}/userids-unique?countOnly=true`;
        const resp = await fetch(url);
        if (resp.ok) {
          const json = await resp.json();
          counts[task.task_id] = json.count || 0;
        }
      } catch (e) {
        console.warn(`Failed to get unique count for task ${task.task_id}:`, e);
      }
    }
    
    setLiveUniqueUsersByTask(prev => ({ ...prev, ...counts }));
  };

  const loadTaskById = async (taskId) => {
    setRecordsLoading(true);
    setError('');
    
    try {
      const base = (import.meta.env.VITE_API_URL || '').trim();
      const url = `${base}/api/admin/unified-tasks/${taskId}`;
      const resp = await fetch(url);
      
      if (!resp.ok) {
        throw new Error(`Failed to load task: ${resp.status} ${resp.statusText}`);
      }
      
      const json = await resp.json();
      if (json.success && json.task) {
        setSummary(json.task.summary);
        setSelectedResult({ filename: `task:${taskId}` });
        
        // Load records for this task
        await loadTaskRecords(taskId);
      } else {
        throw new Error(json.message || 'Failed to load task');
      }
    } catch (error) {
      console.error('Error loading task:', error);
      setError(`Failed to load task: ${error.message}`);
    } finally {
      setRecordsLoading(false);
    }
  };

  const loadTaskRecords = async (taskId, lastKey = null) => {
    try {
      const base = (import.meta.env.VITE_API_URL || '').trim();
      const url = `${base}/api/admin/unified-tasks/${taskId}/records?limit=${recordsPageSize}${lastKey ? `&lastKey=${encodeURIComponent(lastKey)}` : ''}`;
      const resp = await fetch(url);
      
      if (!resp.ok) {
        throw new Error(`Failed to load records: ${resp.status} ${resp.statusText}`);
      }
      
      const json = await resp.json();
      if (json.success) {
        if (lastKey) {
          // Append to existing records
          setExtractedItems(prev => [...prev, ...(json.records || [])]);
        } else {
          // Replace records
          setExtractedItems(json.records || []);
        }
        setRecordsNextKey(json.lastKey);
        setRecordsPageIndex(prev => prev + 1);
        setRecordsKeyStack(prev => [...prev, json.lastKey]);
      } else {
        throw new Error(json.message || 'Failed to load records');
      }
    } catch (error) {
      console.error('Error loading task records:', error);
      setError(`Failed to load records: ${error.message}`);
    }
  };

  const viewTask = (taskId, e) => {
    e.stopPropagation();
    loadTaskById(taskId);
    setActiveTab('saved');
  };

  const startBackgroundTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setBgTaskId(null);
    setBgStatus(null);
    setBgPolling(false);
    
    // Get user email for tenant tracking
    const userEmail = user?.email || null;
    console.log('🔍 DEBUG: Creating task with user_email:', userEmail);
    
    if (!userEmail) {
      console.warn('⚠️  WARNING: No user email found! Task will be created without user_email field.');
    }
    
    try {
      const base = (import.meta.env.VITE_API_URL || '').trim();
      const url = `${base}/api/admin/unified-tasks/background`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hashtag: hashtag.trim(),
          target_count: parseInt(targetCount),
          pagination_token: paginationToken.trim() || null,
          user_email: userEmail
        })
      });
      
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Server error: ${resp.status} ${resp.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }
      
      const json = await resp.json();
      if (json.success && json.task_id) {
        setBgTaskId(json.task_id);
        setBgStatus('running');
        setBgPolling(true);
        setProgress({ current: 0, target: targetCount, phase: 'Starting...' });
        
        // Start polling for status updates
        pollTaskStatus(json.task_id);
      } else {
        throw new Error(json.message || 'Failed to start background task');
      }
    } catch (error) {
      console.error('Error starting background task:', error);
      setError(`Failed to start task: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const pollTaskStatus = async (taskId) => {
    if (!bgPolling) return;
    
    try {
      const base = (import.meta.env.VITE_API_URL || '').trim();
      const url = `${base}/api/admin/tasks/${taskId}/status`;
      const resp = await fetch(url, {
        headers:
          localStorage.getItem('sessionToken') || localStorage.getItem('token')
            ? { Authorization: `Bearer ${localStorage.getItem('sessionToken') || localStorage.getItem('token')}` }
            : {}
      });
      
      if (resp.ok) {
        const json = await resp.json();
        if (json.success) {
          // Handle both memory tasks (local) and database tasks (Lambda)
          const db = json?.task || {};
          const mem = json?.memory || {};
          const currentStatus = json.status ?? db.status ?? mem.status ?? 'running';
          const currentItems = json.current ?? db.total_items ?? mem.current ?? 0;
          const currentTarget = json.target ?? db.target_count ?? mem.target_count ?? targetCount;
          const currentCalls = json.total_calls ?? db.total_calls ?? mem.total_calls ?? 0;
          const uniqueUsers = json.unique_users ?? db.summary?.unique_users ?? mem.unique_users ?? 0;
          const message = json.message || (currentStatus === 'running' ? `Processing... ${currentItems}/${currentTarget} items` : currentStatus);
          
          setBgStatus(currentStatus);
          setProgress({
            current: currentItems,
            target: currentTarget,
            phase: message
          });
          
          // Update live unique count
          if (uniqueUsers !== undefined) {
            setLiveUniqueUsersByTask(prev => ({ ...prev, [taskId]: uniqueUsers }));
          }
          
          // Update the task in saved results for immediate UI update
          setSavedResults(prev => prev.map(task => 
            task.task_id === taskId 
              ? { 
                  ...task, 
                  status: currentStatus, 
                  total_items: currentItems, 
                  total_calls: currentCalls,
                  summary: { ...task.summary, unique_users: uniqueUsers }
                }
              : task
          ));
          
          if (currentStatus === 'completed' || currentStatus === 'error' || currentStatus === 'cancelled' || currentStatus === 'failed') {
            setBgPolling(false);
            setBgStatus(currentStatus);
            // Refresh saved results to show the completed task
            loadSavedResults();
          } else {
            // Continue polling every 5 seconds
            setTimeout(() => pollTaskStatus(taskId), 5000);
          }
        }
      } else {
        console.warn(`⚠️ Polling error: HTTP ${resp.status} for task ${taskId}`);
        // Continue polling even on error (but with longer delay)
        setTimeout(() => pollTaskStatus(taskId), 5000);
      }
    } catch (error) {
      console.error('Error polling task status:', error);
      // Continue polling even on error (but with longer delay)
      setTimeout(() => pollTaskStatus(taskId), 5000);
    }
  };

  const terminateTask = async (taskId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to terminate this task?')) return;
    
    try {
      const base = (import.meta.env.VITE_API_URL || '').trim();
      const url = `${base}/api/admin/unified-tasks/${taskId}/terminate`;
      const resp = await fetch(url, { method: 'POST' });
      
      if (resp.ok) {
        setBgPolling(false);
        setBgStatus('cancelling');
        // Refresh saved results
        loadSavedResults();
      } else {
        throw new Error('Failed to terminate task');
      }
    } catch (error) {
      console.error('Error terminating task:', error);
      setError(`Failed to terminate task: ${error.message}`);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">
                Unified Tasks Management
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Manage hashtag collection tasks with unified table storage
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Error
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('new')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'new'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                    }`}
                  >
                    New Task
                  </button>
                  <button
                    onClick={() => setActiveTab('saved')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'saved'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                    }`}
                  >
                    Saved Results ({savedResults.length})
                  </button>
                </nav>
              </div>
            </div>

            {/* New Task Tab */}
            {activeTab === 'new' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                    Start New Hashtag Collection
                  </h2>
                  
                  <form onSubmit={startBackgroundTask} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Hashtag
                        </label>
                        <input
                          type="text"
                          value={hashtag}
                          onChange={(e) => setHashtag(e.target.value)}
                          placeholder="Enter hashtag (without #)"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Target Count
                        </label>
                        <input
                          type="number"
                          value={targetCount}
                          onChange={(e) => setTargetCount(parseInt(e.target.value) || 100)}
                          placeholder="100"
                          min="1"
                          max="10000"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Pagination Token (Optional)
                        </label>
                        <input
                          type="text"
                          value={paginationToken}
                          onChange={(e) => setPaginationToken(e.target.value)}
                          placeholder="Leave empty to start from beginning"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
                      >
                        {loading ? 'Starting...' : 'Start Background Task'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Background Task Status */}
                {bgTaskId && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                      Background Task Status
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Task ID: {bgTaskId}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          bgStatus === 'running' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          bgStatus === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          bgStatus === 'cancelled' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {bgStatus}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                          <span>Progress: {progress.current} / {progress.target}</span>
                          <span>{Math.round((progress.current / progress.target) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((progress.current / progress.target) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {progress.phase}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Saved Results Tab */}
            {activeTab === 'saved' && (
              <div className="space-y-6">
                {/* Saved Results List */}
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Saved Tasks</h2>
                    <button
                      onClick={loadSavedResults}
                      disabled={loadingResults}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium"
                    >
                      {loadingResults ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                  
                  {loadingResults ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                      <span className="ml-2 text-slate-600 dark:text-slate-400">Loading results...</span>
                    </div>
                  ) : savedResults.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      No saved results found. Run a hashtag collection to see results here.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {savedResults.map((task, index) => (
                        <div
                          key={index}
                          className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                          onClick={() => loadTaskById(task.task_id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-slate-800 dark:text-slate-100">
                                #{task.hashtag} - {task.total_items} items
                              </h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {new Date(task.created_at).toLocaleString()} • {task.total_calls} API calls • Unique users: {liveUniqueUsersByTask[task.task_id] ?? task.summary?.unique_users ?? 0} • Status: {task.status || 'completed'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {task.status === 'running' && (
                                <button
                                  onClick={(e) => terminateTask(task.task_id, e)}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                                >Terminate</button>
                              )}
                              <button
                                onClick={(e) => viewTask(task.task_id, e)}
                                className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-sm"
                              >View</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Task Records Display */}
                {selectedResult && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        Task Records: {selectedResult.filename}
                      </h3>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {extractedItems.length} records
                      </div>
                    </div>
                    
                    {recordsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                        <span className="ml-2 text-slate-600 dark:text-slate-400">Loading records...</span>
                      </div>
                    ) : extractedItems.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        No records found for this task.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                          <thead className="bg-slate-50 dark:bg-slate-700">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                User
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                Caption
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                Likes
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                Comments
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                Verified
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {extractedItems.map((item, index) => (
                              <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                      <img
                                        className="h-10 w-10 rounded-full"
                                        src={item.profile_pic_url || '/default-avatar.png'}
                                        alt={item.username}
                                        onError={(e) => {
                                          e.target.src = '/default-avatar.png';
                                        }}
                                      />
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        {item.username}
                                      </div>
                                      <div className="text-sm text-slate-500 dark:text-slate-400">
                                        {item.full_name}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-slate-900 dark:text-slate-100 max-w-xs truncate">
                                    {item.caption_text || 'No caption'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                                  {item.likes_count || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                                  {item.comments_count || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    item.is_verified
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                  }`}>
                                    {item.is_verified ? 'Yes' : 'No'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default UnifiedTasks;
