import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import rbacTemplateService from '../../services/rbacTemplateService';
import PermissionsEditor from '../../partials/users/PermissionsEditor';

const initialFormState = {
  name: '',
  description: '',
  role: 'user'
};

function hasSelectedPermissions(permissions = {}) {
  if (!permissions || typeof permissions !== 'object') return false;
  return Object.values(permissions).some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (value && typeof value === 'object') {
      return hasSelectedPermissions(value);
    }
    return Boolean(value);
  });
}

function countPermissionPages(permissions = {}) {
  if (!permissions || typeof permissions !== 'object') return 0;
  return Object.values(permissions).reduce((total, pages) => {
    if (Array.isArray(pages)) {
      return total + pages.length;
    }
    if (pages && typeof pages === 'object') {
      return total + countPermissionPages(pages);
    }
    return total;
  }, 0);
}

function RBACTemplates() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [permissions, setPermissions] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deletingId, setDeletingId] = useState('');

  const routeInfo = ROUTE_TO_SECTION[currentPath];

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTemplates() {
    setLoading(true);
    setError('');
    try {
      const result = await rbacTemplateService.listTemplates();
      if (result.success) {
        setTemplates(result.templates || []);
      } else {
        setError(result.error || 'Failed to load RBAC templates');
      }
    } catch (err) {
      setError(err.message || 'Failed to load RBAC templates');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData(initialFormState);
    setPermissions({});
    setFormErrors({});
    setEditingTemplate(null);
  }

  function openCreateModal() {
    resetForm();
    setShowModal(true);
  }

  function openEditModal(template) {
    setEditingTemplate(template);
    setFormData({
      name: template.name || '',
      description: template.description || '',
      role: template.role || 'user'
    });
    setPermissions(template.permissions || {});
    setFormErrors({});
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;
    setShowModal(false);
    resetForm();
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (name === 'role') {
      // Force PermissionsEditor to recalc defaults for new role
      setPermissions({});
    }

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function validateForm() {
    const errors = {};
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      errors.name = 'Template name is required';
    } else if (trimmedName.length < 3) {
      errors.name = 'Template name must be at least 3 characters';
    }

    if (formData.role !== 'admin' && !hasSelectedPermissions(permissions)) {
      errors.permissions = 'Select at least one section/page or choose the Admin role';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        role: formData.role,
        permissions: permissions && typeof permissions === 'object' ? permissions : {}
      };

      let result;
      if (editingTemplate) {
        result = await rbacTemplateService.updateTemplate(editingTemplate.template_id, payload);
      } else {
        result = await rbacTemplateService.createTemplate(payload);
      }

      if (result.success) {
        setSuccess(editingTemplate ? 'Template updated successfully' : 'Template created successfully');
        setShowModal(false);
        resetForm();
        await loadTemplates();
      } else {
        setError(result.error || 'Failed to save RBAC template');
      }
    } catch (err) {
      setError(err.message || 'Failed to save RBAC template');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(templateId) {
    if (!templateId) return;
    const template = templates.find((t) => t.template_id === templateId);
    const confirmed = window.confirm(
      `Delete RBAC template "${template?.name || templateId}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(templateId);
    setError('');
    setSuccess('');
    try {
      const result = await rbacTemplateService.deleteTemplate(templateId);
      if (result.success) {
        setSuccess('Template deleted successfully');
        await loadTemplates();
      } else {
        setError(result.error || 'Failed to delete template');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete template');
    } finally {
      setDeletingId('');
    }
  }

  const totalPages = useMemo(() => {
    return templates.reduce((sum, template) => sum + countPermissionPages(template.permissions), 0);
  }, [templates]);

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (!routeInfo || !hasAccess(user, routeInfo.section, routeInfo.page)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">RBAC Templates</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Define reusable permission blueprints for new users.
                </p>
              </div>
              <button
                onClick={openCreateModal}
                className="btn bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-2"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16">
                  <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
                </svg>
                New Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Templates</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{templates.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Sections Covered</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {templates.reduce((sum, template) => sum + Object.keys(template.permissions || {}).length, 0)}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Pages Allowed</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{totalPages}</p>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4 mb-6 text-sm text-rose-600 dark:text-rose-300">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-6 text-sm text-emerald-600 dark:text-emerald-300">
                {success}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-slate-600 dark:text-slate-400">Loading templates...</span>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">No RBAC templates yet</p>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Create a template to quickly apply consistent permissions when onboarding users.
                </p>
                <button
                  onClick={openCreateModal}
                  className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  Create your first template
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <div
                    key={template.template_id}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{template.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {template.description || 'No description provided'}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300">
                        {template.role}
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                        Sections
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(template.permissions || {}).length === 0 ? (
                          <span className="text-xs text-slate-500 dark:text-slate-400">All sections</span>
                        ) : (
                          Object.keys(template.permissions).map((section) => (
                            <span
                              key={section}
                              className="px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                            >
                              {section}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      {countPermissionPages(template.permissions)} pages allowed ·{' '}
                      {template.created_at ? new Date(template.created_at).toLocaleDateString() : 'Unknown date'}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => openEditModal(template)}
                        className="flex-1 btn-sm bg-white border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(template.template_id)}
                        className="flex-1 btn-sm bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40"
                        disabled={deletingId === template.template_id}
                      >
                        {deletingId === template.template_id ? 'Removing…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {editingTemplate ? 'Edit RBAC Template' : 'Create RBAC Template'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Configure sections and pages this template grants access to.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M13.41 12l4.3-4.29a1 1 0 10-1.42-1.42L12 10.59 7.71 6.29a1 1 0 10-1.42 1.42L10.59 12l-4.3 4.29a1 1 0 101.42 1.42L12 13.41l4.29 4.3a1 1 0 001.42-1.42z"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Template Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`form-input w-full ${formErrors.name ? 'border-rose-500' : ''}`}
                  placeholder="e.g. Support Agent"
                />
                {formErrors.name && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  rows={3}
                  placeholder="Explain what this template is used for"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Default Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="form-select w-full"
                >
                  <option value="user">User</option>
                  <option value="dev">Dev</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Permissions
                  </label>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Select the sections and pages this template grants access to.
                  </span>
                </div>

                <PermissionsEditor
                  role={formData.role}
                  permissions={permissions}
                  onPermissionsChange={setPermissions}
                />
                {formErrors.permissions && (
                  <p className="text-xs text-rose-500 mt-2">{formErrors.permissions}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  className="btn border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RBACTemplates;


