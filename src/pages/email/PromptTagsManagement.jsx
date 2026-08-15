import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  TagIcon,
  DocumentTextIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Enhanced UI Components
const LoadingSpinner = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center justify-center py-12"
  >
    <div className="relative">
      <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-indigo-300 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
    </div>
  </motion.div>
);

const StatusBadge = ({ status, className = "" }) => {
  const statusConfig = {
    active: { 
      bg: 'bg-emerald-100 dark:bg-emerald-900/30', 
      text: 'text-emerald-800 dark:text-emerald-300',
      icon: '●'
    },
    new: { 
      bg: 'bg-blue-100 dark:bg-blue-900/30', 
      text: 'text-blue-800 dark:text-blue-300',
      icon: '✨'
    },
    updated: { 
      bg: 'bg-amber-100 dark:bg-amber-900/30', 
      text: 'text-amber-800 dark:text-amber-300',
      icon: '↻'
    }
  };
  
  const config = statusConfig[status] || statusConfig.active;
  
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${className}`}
    >
      <span className="text-xs">{config.icon}</span>
      {status}
    </motion.span>
  );
};

// API functions
const fetchTags = async () => {
  const response = await fetch('/api/email/tags');
  if (!response.ok) throw new Error('Failed to fetch tags');
  const data = await response.json();
  return data.items || [];
};

const createTag = async (tagData) => {
  const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
  const response = await fetch('/api/email/tags', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      tagName: tagData.tagName,
      content: tagData.prompt, // Backend expects 'content' not 'prompt'
      category: 'general',
      variables: []
    })
  });
  if (!response.ok) throw new Error('Failed to create tag');
  return response.json();
};

const updateTag = async ({ tagName, updates }) => {
  const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
  const response = await fetch(`/api/email/tags/${tagName}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      content: updates.prompt, // Backend expects 'content' not 'prompt'
      category: updates.category || 'general',
      variables: updates.variables || []
    })
  });
  if (!response.ok) throw new Error('Failed to update tag');
  return response.json();
};

const deleteTag = async (tagName) => {
  const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
  const response = await fetch(`/api/email/tags/${tagName}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) throw new Error('Failed to delete tag');
  return response.json();
};

// Tag Modal Component
const TagModal = ({ isOpen, onClose, tag = null, onSave }) => {
  const [formData, setFormData] = useState({
    tagName: '',
    description: '',
    prompt: ''
  });

  useEffect(() => {
    if (tag) {
      setFormData({
        tagName: tag.tagName || '',
        description: tag.description || '',
        prompt: tag.prompt || ''
      });
    } else {
      setFormData({
        tagName: '',
        description: '',
        prompt: ''
      });
    }
  }, [tag, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.tagName.trim() || !formData.prompt.trim()) {
      toast.error('Tag name and prompt are required');
      return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <SparklesIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {tag ? 'Edit Prompt Tag' : 'Create New Tag'}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {tag ? 'Update the tag details below' : 'Add a new AI prompt tag for email responses'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Tag Name *
                </label>
                <input
                  type="text"
                  value={formData.tagName}
                  onChange={(e) => setFormData({ ...formData, tagName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100"
                  placeholder="e.g., Follow Up, Welcome, Pricing Inquiry"
                  disabled={!!tag}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100"
                  placeholder="Brief description of when to use this tag"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                AI Prompt Text *
              </label>
              <textarea
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                rows={8}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none text-slate-900 dark:text-slate-100"
                placeholder="Enter the AI prompt text that will be used when this tag is selected..."
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                This prompt will be combined with other selected tags to create AI-ready responses
              </p>
            </div>
            
            <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg"
              >
                {tag ? 'Update Tag' : 'Create Tag'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Tag Card Component
const TagCard = ({ tag, onEdit, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {tag.tagName}
            </h3>
          </div>
          {tag.description && (
            <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-lg mb-2">
              {tag.description}
            </div>
          )}
        </div>
        <StatusBadge status="active" />
      </div>

      {/* Prompt Preview */}
      <div className="mb-4">
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Prompt Preview</div>
        <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-lg max-h-20 overflow-hidden">
          {tag.prompt.length > 100 ? `${tag.prompt.substring(0, 100)}...` : tag.prompt}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 gap-2 mb-4 text-xs">
        <div>
          <div className="text-slate-500 dark:text-slate-400 mb-1">Created</div>
          <div className="text-slate-900 dark:text-slate-100">
            {new Date(tag.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0.7 }}
        className="flex gap-2"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onEdit(tag)}
          className="flex-1 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          Edit
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDelete(tag.tagName)}
          className="px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          Delete
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

// Main Component
const PromptTagsManagement = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  
  const queryClient = useQueryClient();

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  // Fetch tags
  const { data: tags = [], isLoading, error } = useQuery({
    queryKey: ['email-tags'],
    queryFn: fetchTags
  });
  
  // Create tag mutation
  const createMutation = useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries(['email-tags']);
      toast.success('Tag created successfully!');
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
  
  // Update tag mutation
  const updateMutation = useMutation({
    mutationFn: updateTag,
    onSuccess: () => {
      queryClient.invalidateQueries(['email-tags']);
      toast.success('Tag updated successfully!');
      setIsModalOpen(false);
      setEditingTag(null);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
  
  // Delete tag mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries(['email-tags']);
      toast.success('Tag deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
  
  // Filter tags based on search term
  const filteredTags = tags.filter(tag =>
    tag.tagName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.prompt.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleCreateTag = () => {
    setEditingTag(null);
    setIsModalOpen(true);
  };
  
  const handleEditTag = (tag) => {
    setEditingTag(tag);
    setIsModalOpen(true);
  };
  
  const handleDeleteTag = (tagName) => {
    if (window.confirm(`Are you sure you want to delete the tag "${tagName}"?`)) {
      deleteMutation.mutate(tagName);
    }
  };
  
  const handleSaveTag = (formData) => {
    if (editingTag) {
      updateMutation.mutate({
        tagName: editingTag.tagName,
        updates: {
          description: formData.description,
          prompt: formData.prompt
        }
      });
    } else {
      createMutation.mutate({
        tagName: formData.tagName,
        description: formData.description,
        prompt: formData.prompt
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="sidebar-shell-main-noscroll">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner />
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="sidebar-shell-main-noscroll">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Error Loading Tags</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">{error.message}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
            {/* Page header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Prompt Tags</h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">Create and manage AI prompt tags for email responses</p>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Create New Tag
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            >
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <TagIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Tags</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{tags.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Tags</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{tags.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Prompts</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{tags.reduce((acc, tag) => acc + (tag.prompt ? 1 : 0), 0)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <SparklesIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Filtered</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{filteredTags.length}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search tags by name, description, or prompt..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 transition-colors"
                />
              </div>
            </motion.div>
        
            {/* Content */}
            {isLoading ? (
              <LoadingSpinner />
            ) : filteredTags.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <TagIcon className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  {searchTerm ? 'No tags found' : 'No prompt tags found'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  {searchTerm 
                    ? 'Try adjusting your search terms to find the tags you\'re looking for' 
                    : 'Create your first tag to get started with email response automation'
                  }
                </p>
                {!searchTerm && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Create Your First Tag
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence>
                  {filteredTags.map((tag) => (
                    <TagCard
                      key={tag.tagName}
                      tag={tag}
                      onEdit={handleEditTag}
                      onDelete={handleDeleteTag}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </main>
      </div>
      
      {/* Modal */}
      <TagModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTag(null);
        }}
        tag={editingTag}
        onSave={handleSaveTag}
      />
    </div>
  );
};

export default PromptTagsManagement;
