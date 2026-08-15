import React, { useState, useEffect } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';

function UnifiedPhaseData() {
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('all');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [phaseData, setPhaseData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statistics, setStatistics] = useState(null);
  const [exporting, setExporting] = useState(false);

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

  // Load phase data
  const loadPhaseData = async () => {
    if (!sessionId.trim()) {
      setError('Please enter a session ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const base = (import.meta.env.VITE_API_URL || '').trim();
      let url = `${base}/api/admin/phases/${sessionId}/data`;
      
      const params = new URLSearchParams();
      if (selectedPhase !== 'all') params.append('phase', selectedPhase);
      if (selectedUserId.trim()) params.append('userId', selectedUserId);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setPhaseData(result.data || []);
        setError('');
      } else {
        throw new Error(result.message || 'Failed to load phase data');
      }
    } catch (error) {
      console.error('Error loading phase data:', error);
      setError(`Failed to load phase data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    if (!sessionId.trim()) return;

    try {
      const base = (import.meta.env.VITE_API_URL || '').trim();
      const url = `${base}/api/admin/phases/${sessionId}/statistics`;
      
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStatistics(result.statistics);
        }
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  // Export data as CSV
  const exportData = async () => {
    if (!sessionId.trim()) {
      setError('Please enter a session ID');
      return;
    }

    setExporting(true);
    setError('');

    try {
      const base = (import.meta.env.VITE_API_URL || '').trim();
      let url = `${base}/api/admin/phases/${sessionId}/export`;
      
      const params = new URLSearchParams();
      if (selectedPhase !== 'all') params.append('phase', selectedPhase);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const csv = await response.text();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url2 = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url2;
      a.download = `phase-data-${sessionId}-${selectedPhase}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url2);
    } catch (error) {
      console.error('Error exporting data:', error);
      setError(`Failed to export data: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  // Load data when session ID changes
  useEffect(() => {
    if (sessionId.trim()) {
      loadPhaseData();
      loadStatistics();
    }
  }, [sessionId, selectedPhase, selectedUserId]);

  // Get phase display name
  const getPhaseDisplayName = (phaseNumber) => {
    switch (phaseNumber) {
      case 2: return 'Phase 2 (User Data)';
      case 3: return 'Phase 3 (Posts)';
      case 4: return 'Phase 4 (Messages)';
      default: return `Phase ${phaseNumber}`;
    }
  };

  // Get phase color
  const getPhaseColor = (phaseNumber) => {
    switch (phaseNumber) {
      case 2: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 3: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 4: return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Render phase data based on phase number
  const renderPhaseData = (item) => {
    const { phase_number, data } = item;

    switch (phase_number) {
      case 2:
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Login:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{data.login || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Email:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{data.email || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Followers:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{data.fol_cnt || 0}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Subscribers:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{data.sub_cnt || 0}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Posts:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{data.post_cnt || 0}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Verified:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{data.verify || 'No'}</span>
              </div>
            </div>
            {data.biography && (
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Biography:</span>
                <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{data.biography}</p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Platform:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{data.platform || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Type:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{data.post_type || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Status:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{data.status || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Hashtags:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">
                  {Array.isArray(data.hashtags) ? data.hashtags.join(', ') : 'N/A'}
                </span>
              </div>
            </div>
            {data.post_content && (
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Content:</span>
                <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{data.post_content}</p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Type:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{data.message_type || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">AI Model:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{data.ai_model || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Template:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{data.template_used || 'N/A'}</span>
              </div>
            </div>
            {data.message_content && (
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Message:</span>
                <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{data.message_content}</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Unknown phase data format
          </div>
        );
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
                Unified Phase Data Management
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                View and manage all phase data (Phase 2, 3, 4) in a unified interface
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

            {/* Search and Filter Controls */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Session ID
                  </label>
                  <input
                    type="text"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    placeholder="Enter session ID"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Phase
                  </label>
                  <select
                    value={selectedPhase}
                    onChange={(e) => setSelectedPhase(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="all">All Phases</option>
                    <option value="2">Phase 2 (User Data)</option>
                    <option value="3">Phase 3 (Posts)</option>
                    <option value="4">Phase 4 (Messages)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    User ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    placeholder="Filter by user ID"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={loadPhaseData}
                    disabled={loading || !sessionId.trim()}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
                  >
                    {loading ? 'Loading...' : 'Load Data'}
                  </button>
                </div>
              </div>
            </div>

            {/* Statistics */}
            {statistics && (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  Session Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {statistics.phase2?.count || 0}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Phase 2 Records</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {statistics.phase3?.count || 0}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Phase 3 Records</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {statistics.phase4?.count || 0}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Phase 4 Records</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                      {statistics.total_records || 0}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Total Records</div>
                  </div>
                </div>
              </div>
            )}

            {/* Export Controls */}
            {phaseData.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Found {phaseData.length} records
                  </div>
                  <button
                    onClick={exportData}
                    disabled={exporting}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium"
                  >
                    {exporting ? 'Exporting...' : 'Export CSV'}
                  </button>
                </div>
              </div>
            )}

            {/* Phase Data Display */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="ml-3 text-slate-600 dark:text-slate-400">Loading phase data...</span>
                </div>
              ) : phaseData.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  {sessionId ? 'No phase data found for this session' : 'Enter a session ID to load phase data'}
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {phaseData.map((item, index) => (
                    <div key={index} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPhaseColor(item.phase_number)}`}>
                              {getPhaseDisplayName(item.phase_number)}
                            </span>
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              User: {item.user_id}
                            </span>
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              Status: {item.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Created: {new Date(item.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        {renderPhaseData(item)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default UnifiedPhaseData;
