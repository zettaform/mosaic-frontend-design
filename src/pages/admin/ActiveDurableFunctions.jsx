import React, { useState, useEffect } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import { PlayCircle, StopCircle, RefreshCw, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';

const getApiBaseUrl = () => (import.meta.env.VITE_API_URL || '').trim();

function ActiveDurableFunctions() {
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // State
  const [orchestrations, setOrchestrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [terminating, setTerminating] = useState(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // RBAC check
  const section = ROUTE_TO_SECTION[currentPath];
  const canAccess = hasAccess(user, section, 'read');

  if (!canAccess) {
    return <Navigate to="/dashboard" />;
  }

  // Fetch active durable functions
  const fetchActiveDurableFunctions = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');

    try {
      const base = getApiBaseUrl();
      const url = `${base}/api/admin/tasks/durable-functions/active`;

      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('sessionToken') || localStorage.getItem('token')
            ? { Authorization: `Bearer ${localStorage.getItem('sessionToken') || localStorage.getItem('token')}` }
            : {})
        }
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Failed to fetch durable functions: ${resp.status} ${errorText}`);
      }

      const data = await resp.json();

      if (data.success) {
        setOrchestrations(data.orchestrations || []);
        setLastRefresh(new Date());
      } else {
        throw new Error(data.message || 'Failed to fetch durable functions');
      }
    } catch (err) {
      console.error('Error fetching durable functions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Terminate durable function
  const terminateDurableFunction = async (instanceId) => {
    if (!confirm(`Are you sure you want to terminate orchestration ${instanceId}?`)) {
      return;
    }

    setTerminating(prev => new Set(prev).add(instanceId));

    try {
      const base = getApiBaseUrl();
      const url = `${base}/api/admin/tasks/durable-functions/terminate`;

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('sessionToken') || localStorage.getItem('token')
            ? { Authorization: `Bearer ${localStorage.getItem('sessionToken') || localStorage.getItem('token')}` }
            : {})
        },
        body: JSON.stringify({
          instance_id: instanceId,
          reason: 'Terminated by user via admin panel'
        })
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Failed to terminate: ${resp.status} ${errorText}`);
      }

      const data = await resp.json();

      if (data.success) {
        alert(`Successfully terminated orchestration ${instanceId}`);
        // Refresh the list
        fetchActiveDurableFunctions(true);
      } else {
        throw new Error(data.message || 'Failed to terminate');
      }
    } catch (err) {
      console.error('Error terminating durable function:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setTerminating(prev => {
        const newSet = new Set(prev);
        newSet.delete(instanceId);
        return newSet;
      });
    }
  };

  // Auto-refresh every 5 seconds
  useEffect(() => {
    fetchActiveDurableFunctions();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchActiveDurableFunctions(true);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'Running':
        return 'text-green-600 bg-green-50';
      case 'Pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'Completed':
        return 'text-blue-600 bg-blue-50';
      case 'Failed':
        return 'text-red-600 bg-red-50';
      case 'Terminated':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Running':
        return <PlayCircle className="w-4 h-4" />;
      case 'Pending':
        return <Clock className="w-4 h-4" />;
      case 'Completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'Failed':
      case 'Terminated':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Loader className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime) return 'N/A';
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationMs = end - start;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main>
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            
            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl text-slate-800 font-bold">Active Durable Functions</h1>
              <p className="text-slate-600 mt-2">
                Monitor and manage Azure Durable Functions orchestrations for long-running hashtag tasks
              </p>
            </div>

            {/* Controls */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => fetchActiveDurableFunctions()}
                  disabled={loading}
                  className="btn bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="form-checkbox"
                  />
                  <span className="text-slate-600">Auto-refresh (5s)</span>
                </label>
              </div>

              <div className="text-sm text-slate-600">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">Error:</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Orchestrations list */}
            <div className="bg-white shadow-lg rounded-lg border border-slate-200">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-lg font-semibold text-slate-800">
                  Active Orchestrations ({orchestrations.length})
                </h2>
              </div>

              {loading && orchestrations.length === 0 ? (
                <div className="p-8 text-center">
                  <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
                  <p className="text-slate-600">Loading durable functions...</p>
                </div>
              ) : orchestrations.length === 0 ? (
                <div className="p-8 text-center">
                  <PlayCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-600 font-medium">No active durable functions</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Start a new hashtag task to see active orchestrations here
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-auto w-full">
                    <thead className="text-xs font-semibold uppercase text-slate-500 bg-slate-50 border-t border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-left">Instance ID</div>
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-left">Hashtag</div>
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-left">Status</div>
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-left">Started</div>
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-left">Duration</div>
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-left">User</div>
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-center">Actions</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-200">
                      {orchestrations.map((orch) => (
                        <tr key={orch.instance_id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-mono text-xs text-slate-600">
                              {orch.instance_id}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-medium text-slate-800">
                              #{orch.input?.hashtag || 'N/A'}
                            </div>
                            <div className="text-xs text-slate-500">
                              Limit: {orch.input?.limit || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(orch.runtime_status)}`}>
                              {getStatusIcon(orch.runtime_status)}
                              {orch.runtime_status}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-xs text-slate-600">
                              {formatDate(orch.created_time)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-xs text-slate-600 font-mono">
                              {calculateDuration(orch.created_time, orch.last_updated_time)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-xs text-slate-600">
                              {orch.input?.user_email || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {(orch.runtime_status === 'Running' || orch.runtime_status === 'Pending') && (
                              <button
                                onClick={() => terminateDurableFunction(orch.instance_id)}
                                disabled={terminating.has(orch.instance_id)}
                                className="btn-xs bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 inline-flex items-center gap-1"
                              >
                                {terminating.has(orch.instance_id) ? (
                                  <>
                                    <Loader className="w-3 h-3 animate-spin" />
                                    Terminating...
                                  </>
                                ) : (
                                  <>
                                    <StopCircle className="w-3 h-3" />
                                    Terminate
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Info box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">About Durable Functions</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Durable Functions can run indefinitely without timeout constraints</li>
                <li>The orchestrator coordinates the workflow while activity functions do the heavy processing</li>
                <li>Terminating a function will stop the processing and mark the task as terminated</li>
                <li>All data collected before termination is preserved in Cosmos DB</li>
              </ul>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

export default ActiveDurableFunctions;

