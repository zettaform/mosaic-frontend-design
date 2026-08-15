import React, { useState, useEffect } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import rbacTemplateService from '../../services/rbacTemplateService';

function AdminConsole() {
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [templates, setTemplates] = useState([]);
  
  const [settings, setSettings] = useState({
    signupEnabled: true,
    defaultRbacTemplateId: ''
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

  // Fetch current settings and templates
  useEffect(() => {
    fetchSettings();
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const result = await rbacTemplateService.listTemplates();
      if (result.success) {
        setTemplates(result.templates || []);
      } else {
        console.error('Failed to load RBAC templates:', result.error);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const base = (import.meta.env.VITE_API_URL || '').trim();
      const response = await fetch(`${base}/api/admin/console/settings`, {
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
          signupEnabled: data.settings.signupEnabled !== undefined ? data.settings.signupEnabled : true,
          defaultRbacTemplateId: data.settings.defaultRbacTemplateId || ''
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
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const payload = {
        signupEnabled: settings.signupEnabled,
        defaultRbacTemplateId: settings.defaultRbacTemplateId || null
      };
      
      const base = (import.meta.env.VITE_API_URL || '').trim();
      const response = await fetch(`${base}/api/admin/console/settings`, {
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
        setSuccess('Settings saved successfully!');
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
      signupEnabled: true,
      defaultRbacTemplateId: ''
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
              Admin Console
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Manage signup settings and default RBAC templates for new users
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
                  {/* Signup Toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Enable User Signups
                      </label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Allow new users to create accounts through the signup page
                      </p>
                    </div>
                    <div className="ml-4">
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, signupEnabled: !settings.signupEnabled })}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                          settings.signupEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'
                        }`}
                        role="switch"
                        aria-checked={settings.signupEnabled}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.signupEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Default RBAC Template Selector */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Default RBAC Template for New Signups
                    </label>
                    <select
                      value={settings.defaultRbacTemplateId}
                      onChange={(e) => setSettings({ ...settings, defaultRbacTemplateId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">None (Use role defaults)</option>
                      {templates.map((template) => (
                        <option key={template.template_id} value={template.template_id}>
                          {template.name} {template.description ? `- ${template.description}` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Select which RBAC template will be automatically applied to users who sign up. 
                      If no template is selected, new users will receive the default permissions for their role.
                    </p>
                  </div>

                  {/* Info Box */}
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      How it works
                    </h3>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                      <li>When signups are disabled, the signup page will show a restriction message</li>
                      <li>When a default RBAC template is selected, new signups will automatically receive those permissions</li>
                      <li>If no template is selected, new users will get default permissions based on their role</li>
                      <li>You can always manually change a user's permissions after they sign up</li>
                    </ul>
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

export default AdminConsole;
