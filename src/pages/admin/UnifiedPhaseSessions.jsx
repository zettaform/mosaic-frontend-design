import React, { useState, useEffect } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import SessionNameModal from './SessionNameModal';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';

function UnifiedPhaseSessions() {
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedPhase, setSelectedPhase] = useState('all');
  const [sessionData, setSessionData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState('');

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

  // Load all sessions
  const loadSessions = async () => {
    setLoading(true);
    setError('');

    try {
      const base = (import.meta.env.VITE_API_URL || '').trim();
      const url = `${base}/api/admin/phases/sessions`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setSessions(result.sessions || []);
        setError('');
      } else {
        throw new Error(result.message || 'Failed to load sessions');
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setError(`Failed to load sessions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load session data
  const loadSessionData = async (sessionId, phase = 'all') => {
    setLoading(true);
    setError('');

    try {
      const base = (import.meta.env.VITE_API_URL || '').trim();
      const url = `${base}/api/admin/phases/sessions/${sessionId}/data?phase=${phase}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setSessionData(result.data || []);
        setError('');
      } else {
        throw new Error(result.message || 'Failed to load session data');
      }
    } catch (error) {
      console.error('Error loading session data:', error);
      setError(`Failed to load session data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle session selection
  const handleSessionSelect = (sessionId) => {
    setPendingSessionId(sessionId);
    setShowModal(true);
  };

  // Handle modal confirmation
  const handleModalConfirm = async (sessionName) => {
    setShowModal(false);
    
    try {
      const base = (import.meta.env.VITE_API_URL || '').trim();
      const url = `${base}/api/admin/phases/sessions/create`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: pendingSessionId,
          sessionName: sessionName
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setSelectedSession(result.session);
        await loadSessionData(pendingSessionId, selectedPhase);
        await loadSessions(); // Refresh sessions list
      } else {
        throw new Error(result.message || 'Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      setError(`Failed to create session: ${error.message}`);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowModal(false);
    setPendingSessionId('');
  };

  // Load sessions on component mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Load session data when session or phase changes
  useEffect(() => {
    if (selectedSession) {
      loadSessionData(selectedSession.session_id, selectedPhase);
    }
  }, [selectedSession, selectedPhase]);

  // Get phase display name
  const getPhaseDisplayName = (phase) => {
    switch (phase) {
      case 2: return 'Phase 2 (User Data)';
      case 3: return 'Phase 3 (Posts)';
      default: return `Phase ${phase}`;
    }
  };

  // Get phase color
  const getPhaseColor = (phase) => {
    switch (phase) {
      case 2: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 3: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Render phase data based on phase number
  const renderPhaseData = (item) => {
    const { phase, phase_name } = item;

    switch (phase) {
      case 2:
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Login:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{item.login || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Email:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{item.email || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Followers:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{item.fol_cnt || 0}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Subscribers:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{item.sub_cnt || 0}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Posts:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{item.post_cnt || 0}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Verified:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{item.verify || 'No'}</span>
              </div>
            </div>
            {item.biography && (
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Biography:</span>
                <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{item.biography}</p>
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
                <span className="ml-2 text-slate-900 dark:text-slate-100">{item.platform || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Type:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{item.post_type || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Status:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{item.status || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Hashtags:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">
                  {Array.isArray(item.hashtags) ? item.hashtags.join(', ') : 'N/A'}
                </span>
              </div>
            </div>
            {item.post_content && (
              <div>
                <span className="font-medium text-slate-600 dark:text-slate-400">Content:</span>
                <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{item.post_content}</p>
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
                Unified Phase Sessions
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Manage Phase 2 and Phase 3 data in unified sessions with custom names
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sessions List */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      Sessions
                    </h2>
                    <button
                      onClick={loadSessions}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium"
                    >
                      {loading ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                      <span className="ml-2 text-slate-600 dark:text-slate-400">Loading sessions...</span>
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      No sessions found. Create a session to get started.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((session, index) => (
                        <div
                          key={index}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedSession?.session_id === session.session_id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                          }`}
                          onClick={() => setSelectedSession(session)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-slate-800 dark:text-slate-100">
                                {session.session_name}
                              </h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                ID: {session.session_id}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                Created: {new Date(session.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                Phase {session.current_phase || 1}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {session.total_users || 0} users
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Session Data */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      Session Data
                    </h2>
                    {selectedSession && (
                      <div className="flex items-center space-x-2">
                        <select
                          value={selectedPhase}
                          onChange={(e) => setSelectedPhase(e.target.value)}
                          className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm dark:bg-slate-700 dark:text-slate-100"
                        >
                          <option value="all">All Phases</option>
                          <option value="2">Phase 2</option>
                          <option value="3">Phase 3</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {!selectedSession ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      Select a session to view data
                    </div>
                  ) : loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                      <span className="ml-2 text-slate-600 dark:text-slate-400">Loading data...</span>
                    </div>
                  ) : sessionData.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      No data found for this phase
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sessionData.map((item, index) => (
                        <div key={index} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPhaseColor(item.phase)}`}>
                              {item.phase_name || getPhaseDisplayName(item.phase)}
                            </span>
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              User: {item.id || item.username || item.user_id}
                            </span>
                          </div>
                          
                          <div className="mt-3">
                            {renderPhaseData(item)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Session Name Modal */}
            <SessionNameModal
              isOpen={showModal}
              onClose={handleModalClose}
              onConfirm={handleModalConfirm}
              sessionId={pendingSessionId}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default UnifiedPhaseSessions;
