import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';

// Utility functions
const getApiBase = () => (import.meta.env.VITE_API_URL || '').trim();

const getAdminKey = () => {
  try {
    return (localStorage.getItem('admin_key') || window.ADMIN_KEY || '').trim();
  } catch {
    return String(window.ADMIN_KEY || '').trim();
  }
};

// Health Status Components
const HealthStatusBadge = ({ status, message }) => {
  const statusConfig = {
    healthy: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-800 dark:text-green-200',
      icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
      label: 'Healthy'
    },
    degraded: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z',
      label: 'Degraded'
    },
    unhealthy: {
      bg: 'bg-red-100 dark:bg-red-900/20',
      text: 'text-red-800 dark:text-red-200',
      icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z',
      label: 'Unhealthy'
    },
    missing: {
      bg: 'bg-gray-100 dark:bg-gray-900/20',
      text: 'text-gray-800 dark:text-gray-200',
      icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z',
      label: 'Missing'
    },
    warning: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z',
      label: 'Warning'
    }
  };

  const config = statusConfig[status] || statusConfig.unhealthy;

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
      </svg>
      <span>{config.label}</span>
    </div>
  );
};

const HealthCard = ({ title, status, message, details, recommendations = [] }) => (
  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      <HealthStatusBadge status={status} message={message} />
    </div>
    
    <p className="text-slate-600 dark:text-slate-400 mb-4">{message}</p>
    
    {details && (
      <div className="mb-4">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Details:</h4>
        <div className="bg-slate-50 dark:bg-slate-700 rounded p-3">
          <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
            {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
          </pre>
        </div>
      </div>
    )}
    
    {recommendations.length > 0 && (
      <div>
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Recommendations:</h4>
        <ul className="space-y-1">
          {recommendations.map((rec, index) => (
            <li key={index} className="text-sm text-slate-600 dark:text-slate-400 flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              {rec}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

const MetricsCard = ({ title, metrics }) => (
  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Object.entries(metrics).map(([key, value]) => (
        <div key={key} className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 capitalize">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Main Component
function DevPhasesHealth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const [healthData, setHealthData] = useState(null);
  const [metricsData, setMetricsData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch health data
  const fetchHealthData = useCallback(async () => {
    setLoadingHealth(true);
    setError(null);
    
    try {
      const [healthResponse, metricsResponse] = await Promise.all([
        fetch(`${getApiBase()}/api/health/dev-phases`, {
          headers:
            localStorage.getItem('sessionToken') || localStorage.getItem('token')
              ? { Authorization: `Bearer ${localStorage.getItem('sessionToken') || localStorage.getItem('token')}` }
              : {}
        }),
        fetch(`${getApiBase()}/api/health/metrics`, {
          headers:
            localStorage.getItem('sessionToken') || localStorage.getItem('token')
              ? { Authorization: `Bearer ${localStorage.getItem('sessionToken') || localStorage.getItem('token')}` }
              : {}
        })
      ]);

      if (!healthResponse.ok || !metricsResponse.ok) {
        throw new Error('Failed to fetch health data');
      }

      const healthData = await healthResponse.json();
      const metricsData = await metricsResponse.json();

      setHealthData(healthData.health);
      setMetricsData(metricsData.metrics);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching health data:', err);
      setError('Failed to fetch health data: ' + err.message);
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, [fetchHealthData]);

  if (loading) return <LoadingSpinner />;
  
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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="sidebar-shell-main">
        <Header />
        
        <main className="flex-1">
          {/* Header */}
          <header className="bg-gradient-to-r from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-8 shadow-sm">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Dev Phases System Health
                  </h1>
                  <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
                    Monitor system status, performance, and configuration health
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={fetchHealthData}
                    disabled={loadingHealth}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    <svg className={`w-4 h-4 mr-2 ${loadingHealth ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                  {lastUpdated && (
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto px-6 py-8">
            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {loadingHealth ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
                <span className="ml-3 text-slate-600 dark:text-slate-400">Loading health data...</span>
              </div>
            ) : healthData ? (
              <div className="space-y-8">
                {/* Overall Status */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Overall System Status</h2>
                    <HealthStatusBadge status={healthData.status} message={healthData.status} />
                  </div>
                  
                  {healthData.recommendations && healthData.recommendations.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Recommendations:</h3>
                      <ul className="space-y-1">
                        {healthData.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-slate-600 dark:text-slate-400 flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Component Health */}
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Component Health</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(healthData.components || {}).map(([component, data]) => (
                      <HealthCard
                        key={component}
                        title={component.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        status={data.status}
                        message={data.message}
                        details={data.error}
                        recommendations={data.recommendations}
                      />
                    ))}
                  </div>
                </div>

                {/* Metrics */}
                {metricsData && (
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">System Metrics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {metricsData.tables && (
                        <MetricsCard
                          title="Database Tables"
                          metrics={Object.fromEntries(
                            Object.entries(metricsData.tables).map(([key, value]) => [
                              key,
                              value.itemCount || 0
                            ])
                          )}
                        />
                      )}
                      
                      {metricsData.configurations && (
                        <MetricsCard
                          title="Configurations"
                          metrics={metricsData.configurations}
                        />
                      )}
                      
                      {metricsData.sessions && (
                        <MetricsCard
                          title="Sessions"
                          metrics={metricsData.sessions}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Health Data Available</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Unable to load system health information.</p>
                <button
                  onClick={fetchHealthData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default DevPhasesHealth;