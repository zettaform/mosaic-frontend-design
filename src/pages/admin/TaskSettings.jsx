import React, { useState, useEffect } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';

function TaskSettings() {
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [settings, setSettings] = useState({
    delayMin: 3,      // Minimum delay in seconds
    delayMax: 10,     // Maximum delay in seconds
    jitter: 1.5       // Jitter in seconds (±)
  });

  // RBAC: Check permissions
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  const routeInfo = ROUTE_TO_SECTION[currentPath];
  if (routeInfo) {
    const { section, page } = routeInfo;
    if (!hasAccess(user, section, page)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Fetch current settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const base = (import.meta.env.VITE_API_URL || '').trim();
      const response = await fetch(`${base}/api/admin/tasks/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('sessionToken') || localStorage.getItem('token')
            ? { Authorization: `Bearer ${localStorage.getItem('sessionToken') || localStorage.getItem('token')}` }
            : {})
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.settings) {
        setSettings({
          delayMin: data.settings.delayMin || 3,
          delayMax: data.settings.delayMax || 10,
          jitter: data.settings.jitter || 1.5
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings. Using defaults.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (settings.delayMin < 1 || settings.delayMax < 1 || settings.jitter < 0) {
      setError('All values must be positive numbers');
      return;
    }
    if (settings.delayMin >= settings.delayMax) {
      setError('Minimum delay must be less than maximum delay');
      return;
    }
    if (settings.jitter > (settings.delayMax - settings.delayMin) / 2) {
      setError('Jitter should not exceed half the delay range');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Ensure all values are numbers before sending
      const payload = {
        delayMin: Number(settings.delayMin),
        delayMax: Number(settings.delayMax),
        jitter: Number(settings.jitter)
      };
      
      const base = (import.meta.env.VITE_API_URL || '').trim();
      const response = await fetch(`${base}/api/admin/tasks/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('sessionToken') || localStorage.getItem('token')
            ? { Authorization: `Bearer ${localStorage.getItem('sessionToken') || localStorage.getItem('token')}` }
            : {})
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save settings' }));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setSuccess('Settings saved successfully! Lambda functions will use these values for new tasks.');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        throw new Error(data.error || data.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      delayMin: 3,
      delayMax: 10,
      jitter: 1.5
    });
    setError('');
    setSuccess('');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">
              Task Settings
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Configure API call delays and jitter for Lambda tasks to avoid rate limiting
            </p>
          </div>

          {loading ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
              <div className="p-6">
                {/* Success Message */}
                {success && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-green-800 dark:text-green-200">{success}</p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}

                {/* Settings Form */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Minimum Delay (seconds)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      value={settings.delayMin}
                      onChange={(e) => setSettings({ ...settings, delayMin: parseFloat(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Minimum time between API calls (recommended: 3-5 seconds)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Maximum Delay (seconds)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      value={settings.delayMax}
                      onChange={(e) => setSettings({ ...settings, delayMax: parseFloat(e.target.value) || 10 })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Maximum time between API calls (recommended: 8-12 seconds)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Jitter (±seconds)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={settings.jitter}
                      onChange={(e) => setSettings({ ...settings, jitter: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Random variation to add to delays for human-like behavior (recommended: 1-2 seconds)
                    </p>
                  </div>

                  {/* Preview */}
                  <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Preview
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Delay range: <span className="font-mono font-semibold">{settings.delayMin}s - {settings.delayMax}s</span>
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      With jitter: <span className="font-mono font-semibold">
                        {Math.max(1, (settings.delayMin - settings.jitter).toFixed(1))}s - {(settings.delayMax + settings.jitter).toFixed(1)}s
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                      Each API call will wait a random time between these values to avoid detection
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={saving}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
                    >
                      Reset to Defaults
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default TaskSettings;

