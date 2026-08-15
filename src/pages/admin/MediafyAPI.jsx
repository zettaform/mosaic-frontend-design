import React, { useState, useEffect } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';

function MediafyAPI() {
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState({});
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [testData, setTestData] = useState({
    userId: '1122059043',
    userIds: ['1122059043', '1234567890'],
    hashtag: 'summer',
    targetCount: 100,
    sessionId: '',
    rate: 2
  });

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

  const getApiBase = () => (import.meta.env.VITE_API_URL || '').trim();

  const getAdminKey = () => {
    try {
      return (localStorage.getItem('admin_key') || window.ADMIN_KEY || '').trim();
    } catch {
      return String(window.ADMIN_KEY || '').trim();
    }
  };

  const testEndpoint = async (endpoint, data) => {
    const endpointKey = endpoint.path; // Use path as key for consistency
    setLoading(prev => ({ ...prev, [endpointKey]: true }));
    try {
      const base = getApiBase();
      let url = `${base}${endpoint.path}`;
      let options = {
        method: endpoint.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('sessionToken') || localStorage.getItem('token')
            ? { Authorization: `Bearer ${localStorage.getItem('sessionToken') || localStorage.getItem('token')}` }
            : {})
        }
      };

      // Handle different endpoint types
      if (endpoint.path.includes('/user/:userId')) {
        if (!data.userId) {
          throw new Error('User ID is required');
        }
        url = `${base}/api/mediafy/user/${data.userId}`;
      } else if (endpoint.path.includes('/hashtag') && !endpoint.path.includes('/hashtag-batch')) {
        if (!data.hashtag) {
          throw new Error('Hashtag is required');
        }
        url = `${base}/api/mediafy/hashtag?hashtag=${encodeURIComponent(data.hashtag)}`;
        if (data.pagination_token) {
          url += `&pagination_token=${encodeURIComponent(data.pagination_token)}`;
        }
      } else if (endpoint.path.includes('/users/batch')) {
        if (!data.userIds || data.userIds.length === 0) {
          throw new Error('User IDs array is required');
        }
        options.method = 'POST';
        options.body = JSON.stringify({ userIds: data.userIds });
      } else if (endpoint.path.includes('/hashtag-batch')) {
        if (!data.hashtag) {
          throw new Error('Hashtag is required');
        }
        options.method = 'POST';
        options.body = JSON.stringify({ 
          hashtag: data.hashtag, 
          target_count: data.targetCount || 100,
          pagination_token: data.pagination_token || null
        });
      } else if (endpoint.path.includes('/process-users')) {
        if (!data.userIds || data.userIds.length === 0) {
          throw new Error('User IDs array is required');
        }
        options.method = 'POST';
        options.body = JSON.stringify({ 
          userids: data.userIds, 
          rate: data.rate || 2
        });
      } else if (endpoint.path.includes('/fetch-posts')) {
        if (!data.userIds || data.userIds.length === 0) {
          throw new Error('User IDs array is required');
        }
        options.method = 'POST';
        options.body = JSON.stringify({ 
          users: data.userIds.map(id => ({ userId: id, username: `user_${id}` })),
          sessionId: data.sessionId || `test_${Date.now()}`,
          rate: data.rate || 2
        });
      } else if (endpoint.path.includes('/processing-status/')) {
        if (!data.processingId) {
          throw new Error('Processing ID is required');
        }
        url = `${base}/api/mediafy/processing-status/${data.processingId}`;
      } else if (endpoint.path.includes('/posts-status/')) {
        if (!data.processingId) {
          throw new Error('Processing ID is required');
        }
        url = `${base}/api/mediafy/posts-status/${data.processingId}`;
      }

      const response = await fetch(url, options);
      
      // Handle non-JSON responses
      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        result = { text: await response.text() };
      }
      
      setTestResults(prev => ({
        ...prev,
        [endpointKey]: {
          success: response.ok,
          status: response.status,
          data: result,
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [endpointKey]: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [endpointKey]: false }));
    }
  };

  const endpoints = [
    {
      id: 'user-single',
      name: 'Get Single User Info',
      method: 'GET',
      path: '/api/mediafy/user/:userId',
      description: 'Fetch detailed user information by user ID',
      parameters: ['userId'],
      example: { userId: '1122059043' }
    },
    {
      id: 'users-batch',
      name: 'Get Multiple Users (Batch)',
      method: 'POST',
      path: '/api/mediafy/users/batch',
      description: 'Fetch user information for multiple user IDs (max 10)',
      parameters: ['userIds'],
      example: { userIds: ['1122059043', '1234567890'] }
    },
    {
      id: 'hashtag-single',
      name: 'Get Hashtag Posts',
      method: 'GET',
      path: '/api/mediafy/hashtag',
      description: 'Fetch posts for a specific hashtag',
      parameters: ['hashtag', 'pagination_token'],
      example: { hashtag: 'summer' }
    },
    {
      id: 'hashtag-batch',
      name: 'Get Hashtag Posts (Batch)',
      method: 'POST',
      path: '/api/mediafy/hashtag-batch',
      description: 'Fetch multiple pages of hashtag posts',
      parameters: ['hashtag', 'target_count', 'pagination_token'],
      example: { hashtag: 'summer', targetCount: 100 }
    },
    {
      id: 'process-users',
      name: 'Process Users (Background)',
      method: 'POST',
      path: '/api/mediafy/process-users',
      description: 'Process multiple users in background with rate limiting',
      parameters: ['userids', 'rate'],
      example: { userIds: ['1122059043', '1234567890'], rate: 2 }
    },
    {
      id: 'fetch-posts',
      name: 'Fetch User Posts',
      method: 'POST',
      path: '/api/mediafy/fetch-posts',
      description: 'Fetch recent posts for multiple users',
      parameters: ['users', 'sessionId', 'rate'],
      example: { userIds: ['1122059043'], sessionId: 'test_session', rate: 2 }
    },
    {
      id: 'processing-status',
      name: 'Get Processing Status',
      method: 'GET',
      path: '/api/mediafy/processing-status/:processingId',
      description: 'Check status of background processing',
      parameters: ['processingId'],
      example: { processingId: 'processing_1234567890_abc123' }
    },
    {
      id: 'posts-status',
      name: 'Get Posts Processing Status',
      method: 'GET',
      path: '/api/mediafy/posts-status/:processingId',
      description: 'Check status of posts fetching process',
      parameters: ['processingId'],
      example: { processingId: 'posts_1234567890_abc123' }
    }
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Mediafy API Endpoints</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Test and interact with all available Mediafy API endpoints
              </p>
            </div>

            {/* Test Data Input */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-8">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">Test Data</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    User ID
                  </label>
                  <input
                    type="text"
                    value={testData.userId}
                    onChange={(e) => setTestData(prev => ({ ...prev, userId: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="1122059043"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    User IDs (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={testData.userIds.join(',')}
                    onChange={(e) => setTestData(prev => ({ 
                      ...prev, 
                      userIds: e.target.value.split(',').map(id => id.trim()).filter(Boolean)
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="1122059043,1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Hashtag
                  </label>
                <input
                  type="text"
                    value={testData.hashtag}
                    onChange={(e) => setTestData(prev => ({ ...prev, hashtag: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="summer"
                  />
              </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Target Count
                  </label>
                  <input
                    type="number"
                    value={testData.targetCount}
                    onChange={(e) => setTestData(prev => ({ ...prev, targetCount: parseInt(e.target.value) || 100 }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Session ID
                  </label>
                  <input
                    type="text"
                    value={testData.sessionId}
                    onChange={(e) => setTestData(prev => ({ ...prev, sessionId: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="test_session_123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Rate (req/sec)
                  </label>
                  <input
                    type="number"
                    value={testData.rate}
                    onChange={(e) => setTestData(prev => ({ ...prev, rate: parseInt(e.target.value) || 2 }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="2"
                  />
            </div>
              </div>
            </div>

            {/* Endpoints List */}
            <div className="space-y-6">
              {endpoints.map((endpoint) => (
                <div key={endpoint.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                          {endpoint.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {endpoint.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          endpoint.method === 'GET' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {endpoint.method}
                        </span>
                    <button
                          onClick={() => testEndpoint(endpoint, testData)}
                          disabled={loading[endpoint.path]}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium"
                        >
                          {loading[endpoint.path] ? 'Testing...' : 'Test Endpoint'}
                    </button>
                  </div>
                </div>
                    <div className="mt-2">
                      <code className="text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                        {endpoint.path}
                      </code>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Parameters:</h4>
                      <div className="flex flex-wrap gap-2">
                        {endpoint.parameters.map((param) => (
                          <span key={param} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded">
                            {param}
                              </span>
                      ))}
                  </div>
                </div>
                    
                    {testResults[endpoint.path] && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Test Result:</h4>
                        <div className={`p-4 rounded-lg ${
                          testResults[endpoint.path].success 
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium ${
                              testResults[endpoint.path].success 
                                ? 'text-green-800 dark:text-green-200'
                                : 'text-red-800 dark:text-red-200'
                            }`}>
                              {testResults[endpoint.path].success ? '✓ Success' : '✗ Error'}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(testResults[endpoint.path].timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          {testResults[endpoint.path].status && (
                            <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                              HTTP Status: {testResults[endpoint.path].status}
                          </div>
                          )}
                          {testResults[endpoint.path].error && (
                            <div className="text-xs text-red-600 dark:text-red-400 mb-2 font-medium">
                              Error: {testResults[endpoint.path].error}
                            </div>
                          )}
                          <pre className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded overflow-x-auto max-h-96 overflow-y-auto">
                            {JSON.stringify(testResults[endpoint.path].data || testResults[endpoint.path].error, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              </div>

            {/* Key Endpoints for Phase 2 Processing */}
            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-200 mb-4">
                🎯 Key Endpoints for Phase 2 Processing
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300 mb-2">
                    1. Single User Processing
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                    Use this endpoint to process individual user IDs from Phase 1:
                  </p>
                  <code className="text-sm text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                    GET /api/mediafy/user/{'{userId}'}
                  </code>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300 mb-2">
                    2. Batch User Processing
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                    Use this endpoint to process multiple user IDs efficiently (max 10 per batch):
                  </p>
                  <code className="text-sm text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                    POST /api/mediafy/users/batch
                  </code>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300 mb-2">
                    3. Background Processing
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                    Use this endpoint for large-scale processing with rate limiting:
                  </p>
                  <code className="text-sm text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                    POST /api/mediafy/process-users
                  </code>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default MediafyAPI;