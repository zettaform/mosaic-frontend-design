import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import promptTemplatesService from '../../services/promptTemplatesService';

function PromptTemplates() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // State management
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form state
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    category: 'general',
    tags: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Wait for auth to finish loading
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // Check authentication - redirect to signin if not authenticated
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // RBAC: Check permissions
  const routeInfo = ROUTE_TO_SECTION[currentPath];
  if (routeInfo) {
    const { section, page } = routeInfo;
    // Debug logging for admin users
    if (user.email === 'admin@example.com' || user.role === 'admin') {
      console.log('🔍 Admin user access check:', {
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        section,
        page,
        routeInfo,
        hasAccess: hasAccess(user, section, page)
      });
    }
    if (!hasAccess(user, section, page)) {
      console.log(`❌ Access denied: User ${user.email || user.user_id} (role: ${user.role}) attempted to access ${currentPath} (${section}/${page})`);
      console.log('   User object:', { role: user.role, permissions: user.permissions });
      return <Navigate to="/unauthorized" replace />;
    }
  } else {
    // Route not in ROUTE_TO_SECTION - deny access
    console.log(`❌ Access denied: Route ${currentPath} is not in ROUTE_TO_SECTION`);
    return <Navigate to="/unauthorized" replace />;
  }

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const result = await promptTemplatesService.getTemplates(user?.email);

      if (result.success) {
        setTemplates(result.templates || []);
        if (result.templates && result.templates.length === 0) {
          // Don't show error for empty list, just let the empty state show
        }
      } else {
        const errorMsg = result.message || result.error || 'Failed to load templates';
        setError(errorMsg);
        console.error('Failed to load templates:', result);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load templates';
      setError(errorMsg);
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Template name is required';
    }
    
    if (!formData.content.trim()) {
      errors.content = 'Template content is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Template description is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const templateData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        tokenCount: promptTemplatesService.calculateTokenCount(formData.content)
      };

      let result;
      if (editingTemplate) {
        result = await promptTemplatesService.updateTemplate(editingTemplate.id, templateData);
      } else {
        result = await promptTemplatesService.createTemplate(templateData);
      }

      if (result.success) {
        setSuccess(editingTemplate ? 'Template updated successfully' : 'Template created successfully');
        setShowModal(false);
        setEditingTemplate(null);
        resetForm();
        loadTemplates();
      } else {
        setError(result.message || 'Failed to save template');
      }
    } catch (err) {
      setError('Failed to save template');
      console.error('Error saving template:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      content: template.content,
      category: template.category || 'general',
      tags: template.tags ? template.tags.join(', ') : '',
      isActive: template.isActive !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      setError(null);
      const result = await promptTemplatesService.deleteTemplate(templateId);
      
      if (result.success) {
        setSuccess('Template deleted successfully');
        loadTemplates();
      } else {
        setError(result.message || 'Failed to delete template');
      }
    } catch (err) {
      setError('Failed to delete template');
      console.error('Error deleting template:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      content: '',
      category: 'general',
      tags: '',
      isActive: true
    });
    setFormErrors({});
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    resetForm();
  };

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'sales', label: 'Sales & Marketing' },
    { value: 'support', label: 'Customer Support' },
    { value: 'technical', label: 'Technical' },
    { value: 'creative', label: 'Creative' },
    { value: 'analytical', label: 'Analytical' }
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="sidebar-shell-main">
        {/* Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
            
            {/* Page header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    Prompt Templates
                  </h1>
                  <p className="text-base text-slate-600 dark:text-slate-400">
                    Create and manage AI prompt templates for your workflows
                  </p>
                </div>
                <button
                  onClick={handleNewTemplate}
                  className="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Template</span>
                </button>
              </div>
            </div>

            {/* Status messages */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded-lg p-4 mb-6 shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-200">{error}</p>
                    {error === 'Authentication required' && (
                      <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                        Please log in to view and manage your prompt templates.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="ml-4 flex-shrink-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 rounded-lg p-4 mb-6 shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-semibold text-green-800 dark:text-green-200">{success}</p>
                  </div>
                  <button
                    onClick={() => setSuccess(null)}
                    className="ml-4 flex-shrink-0 text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Templates grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 dark:border-indigo-900"></div>
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-indigo-600 dark:border-t-indigo-400 absolute top-0 left-0"></div>
                </div>
                <span className="mt-4 text-base font-medium text-slate-600 dark:text-slate-400">Loading templates...</span>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-6">
                  <svg className="w-10 h-10 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No templates yet</h3>
                <p className="text-base text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                  Get started by creating your first prompt template. Templates help you standardize and reuse AI prompts across your workflows.
                </p>
                <button
                  onClick={handleNewTemplate}
                  className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Your First Template</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <div 
                    key={template.id} 
                    className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 flex flex-col"
                  >
                    {/* Header */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {template.name}
                        </h3>
                        <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          template.isActive !== false
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {template.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {template.description}
                      </p>
                    </div>

                    {/* Tags */}
                    {template.tags && template.tags.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {template.tags.map((tag, index) => (
                            <span 
                              key={index} 
                              className="inline-flex items-center px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Content Preview */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 mb-4 flex-1">
                      <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-4 leading-relaxed">
                        {template.content}
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        {template.tokenCount || 0} tokens
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {template.category || 'general'}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {template.user_email || 'Unknown user'}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEdit(template)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal */}
            {showModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                  {/* Modal Header */}
                  <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {editingTemplate ? 'Edit Template' : 'Create New Template'}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {editingTemplate ? 'Update your prompt template' : 'Fill in the details to create a new prompt template'}
                        </p>
                      </div>
                      <button
                        onClick={closeModal}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="flex-1 overflow-y-auto p-6">

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Template Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                              formErrors.name 
                                ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' 
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                            }`}
                            placeholder="e.g., Customer Support Response"
                          />
                          {formErrors.name && (
                            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {formErrors.name}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Category
                          </label>
                          <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          >
                            {categories.map(category => (
                              <option key={category.value} value={category.value}>
                                {category.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Description <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                            formErrors.description 
                              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' 
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                          }`}
                          placeholder="Brief description of what this template does"
                        />
                        {formErrors.description && (
                          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {formErrors.description}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Tags
                        </label>
                        <input
                          type="text"
                          name="tags"
                          value={formData.tags}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          placeholder="e.g., support, email, automated"
                        />
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Separate multiple tags with commas</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Template Content <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="content"
                          value={formData.content}
                          onChange={handleInputChange}
                          rows={10}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors font-mono text-sm ${
                            formErrors.content 
                              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' 
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                          }`}
                          placeholder="Enter your prompt template content here..."
                        />
                        {formErrors.content && (
                          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {formErrors.content}
                          </p>
                        )}
                        <div className="mt-3 flex items-center justify-between px-1">
                          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                              </svg>
                              <span className="font-semibold">{promptTemplatesService.calculateTokenCount(formData.content)}</span> tokens
                            </span>
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                              </svg>
                              <span className="font-semibold">{formData.content.length}</span> characters
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2"
                        />
                        <label className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                          Template is active and available for use
                        </label>
                      </div>
                    </form>
                  </div>

                  {/* Modal Footer */}
                  <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          {editingTemplate ? (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Update Template
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Create Template
                            </>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default PromptTemplates;
