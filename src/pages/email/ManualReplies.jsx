import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  EnvelopeIcon,
  TagIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  XMarkIcon,
  ArrowRightIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListBulletIcon,
  ArrowPathIcon,
  UserIcon
} from '@heroicons/react/24/outline';

// API functions
const fetchTags = async () => {
  const response = await fetch('/api/email/tags');
  if (!response.ok) throw new Error('Failed to fetch tags');
  const data = await response.json();
  return data.items || [];
};

const fetchAiModels = async () => {
  const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch('/api/admin/ai-models', { headers });
  if (!response.ok) throw new Error('Failed to fetch AI models');
  const data = await response.json();
  return data.models || [];
};

const fetchInstagramUserId = async (username) => {
  const response = await fetch(`https://instagram-func-1763894980.azurewebsites.net/api/instagram-user-id?username=${encodeURIComponent(username)}&apiKey=insta_test_key_001`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user ID for username: ${username}`);
  }

  const data = await response.json();
  if (!data.user_id) {
    throw new Error('Invalid response from user ID API');
  }

  return data.user_id;
};

const fetchInstagramUserIdByEmail = async (email) => {
  const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api/instagram/resolve-userid?email=${encodeURIComponent(email)}`, { headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || `Failed to resolve user ID for email: ${email}`);
  }

  if (!data.userId) {
    throw new Error('Invalid response from email resolver API');
  }

  return String(data.userId);
};

const isEmailLike = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

const fetchInstagramCaptions = async (username, limit) => {
  const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api/instagram/captions?username=${encodeURIComponent(username)}&limit=${limit}`, { headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch captions');
  }

  return data.captions || [];
};

const assemblePrompt = async (tagNames, modifiers) => {
  const response = await fetch('/api/email/assemble', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tags: tagNames,
      variables: modifiers,
      userId: null
    })
  });
  if (!response.ok) throw new Error('Failed to assemble prompt');
  const data = await response.json();
  return data.email.body; // Return the assembled body
};

// Normalize model ID to DeepInfra format (matching campaign modal logic)
const normalizeModelId = (modelId) => {
  if (!modelId || typeof modelId !== 'string') {
    return modelId;
  }
  
  const trimmed = modelId.trim();
  
  // If it already starts with "openai/", return as is
  if (trimmed.startsWith('openai/')) {
    return trimmed;
  }
  
  // Handle "openaigpt-oss-120b" format - replace "openaigpt" with "openai/gpt"
  if (trimmed.startsWith('openaigpt-oss')) {
    return trimmed.replace(/^openaigpt-oss/, 'openai/gpt-oss');
  }
  
  // If it starts with "gpt-oss" but doesn't have "openai/" prefix, add it
  if (trimmed.startsWith('gpt-oss')) {
    return `openai/${trimmed}`;
  }
  
  // For other models, return as is (they should already have correct prefixes like "meta-llama/", etc.)
  return trimmed;
};

const processWithDeepInfra = async (captions, prompt, model) => {
  try {
    // Normalize the model ID to DeepInfra format
    const normalizedModel = normalizeModelId(model);
    console.log('[DeepInfra] Processing request:', {
      originalModel: model,
      normalizedModel,
      captionsCount: captions.length,
      promptLength: prompt.length
    });
    
    const response = await fetch('/api/deepinfra/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ captions, prompt, model: normalizedModel })
    });
    
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
      console.error('[DeepInfra] Request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        data
      });
      throw new Error(errorMessage);
    }
    
    if (!data.success) {
      const errorMessage = data.message || 'Failed to process with DeepInfra';
      console.error('[DeepInfra] Response indicates failure:', data);
      throw new Error(errorMessage);
    }
    
    return data.response;
  } catch (error) {
    console.error('[DeepInfra] Error processing:', error);
    throw error;
  }
};

// Tag Chip Component (reused from EmailReplySimulator)
const TagChip = ({ tag, isSelected, onToggle, isDragging = false }) => {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onToggle(tag)}
      className={`
        flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200
        ${isSelected
          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
        }
        ${isDragging ? 'shadow-2xl rotate-2' : ''}
      `}
    >
      <TagIcon className="h-4 w-4" />
      <span>{tag.tagName}</span>
      {isSelected && <CheckIcon className="h-4 w-4" />}
    </motion.button>
  );
};

// Selected Tag Item Component (reused from EmailReplySimulator)
const SelectedTagItem = ({ tag, index, onRemove }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex items-center space-x-3 p-4 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl border border-indigo-200 dark:border-indigo-700"
    >
      <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-300">
        <span className="text-sm font-semibold">#{index + 1}</span>
        <TagIcon className="h-5 w-5" />
      </div>
      <span className="flex-1 text-sm font-semibold text-indigo-800 dark:text-indigo-200">{tag.tagName}</span>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onRemove(tag.tagName)}
        className="p-2 text-indigo-500 dark:text-indigo-400 hover:text-red-600 dark:hover:text-red-400 transition-colors bg-white dark:bg-slate-800 rounded-lg"
      >
        <XMarkIcon className="h-4 w-4" />
      </motion.button>
    </motion.div>
  );
};

// Loading Spinner Component
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

// Main Component
const ManualReplies = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [modifiers, setModifiers] = useState({
    tone: '',
    length: ''
  });
  const [assembledPrompt, setAssembledPrompt] = useState('');
  const [isAssembling, setIsAssembling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [username, setUsername] = useState('');
  const [emailResolvedUserId, setEmailResolvedUserId] = useState(null);
  const [isResolvingEmail, setIsResolvingEmail] = useState(false);
  const [limit, setLimit] = useState(12);
  const [captions, setCaptions] = useState([]);
  const [deepInfraResponse, setDeepInfraResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // Fetch tags
  const { data: tags = [], isLoading: tagsLoading, error: tagsError } = useQuery({
    queryKey: ['email-tags'],
    queryFn: fetchTags
  });

  // Fetch AI models
  const { data: models = [], isLoading: modelsLoading, error: modelsError } = useQuery({
    queryKey: ['ai-models'],
    queryFn: fetchAiModels
  });

  // Generate limit options (6, 12, 24, 36, 48, 60)
  const limitOptions = [6, 12, 24, 36, 48, 60];

  // If the operator enters an email, resolve it immediately (debounced) and then fetch captions.
  useEffect(() => {
    const input = username.trim();
    setEmailResolvedUserId(null);

    if (!input || !isEmailLike(input)) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsResolvingEmail(true);
      toast.loading('Resolving email to user ID...', { id: 'resolve-email' });
      try {
        const resolved = await fetchInstagramUserIdByEmail(input.toLowerCase());
        if (cancelled) return;
        setEmailResolvedUserId(resolved);
        toast.success(`Email resolved to user ID: ${resolved}`, { id: 'resolve-email' });

        // Auto-fetch captions once resolved (as requested).
        const fetchedCaptions = await fetchInstagramCaptions(resolved, limit);
        if (cancelled) return;
        setCaptions(fetchedCaptions);
        toast.success(`Fetched ${fetchedCaptions.length} captions`);
      } catch (error) {
        if (cancelled) return;
        toast.error('Failed to resolve email: ' + error.message, { id: 'resolve-email' });
      } finally {
        if (!cancelled) setIsResolvingEmail(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username, limit]);

  // Handle tag toggle
  const handleTagToggle = (tag) => {
    const isSelected = selectedTags.some(t => t.tagName === tag.tagName);

    if (isSelected) {
      setSelectedTags(selectedTags.filter(t => t.tagName !== tag.tagName));
    } else if (selectedTags.length < 7) {
      setSelectedTags([...selectedTags, tag]);
    } else {
      toast.error('Maximum 7 tags allowed');
    }
  };

  // Handle assemble
  const handleAssemble = async () => {
    if (selectedTags.length === 0) {
      toast.error('Please select at least one tag');
      return;
    }

    setIsAssembling(true);
    try {
      const tagNames = selectedTags.map(tag => tag.tagName);
      const prompt = await assemblePrompt(tagNames, modifiers);
      setAssembledPrompt(prompt);
      toast.success('Prompt assembled successfully!');
    } catch (error) {
      toast.error('Failed to assemble prompt: ' + error.message);
    } finally {
      setIsAssembling(false);
    }
  };

  // Handle fetch captions
  const handleFetchCaptions = async () => {
    if (!username.trim()) {
      toast.error('Please enter a username, user ID, or email');
      return;
    }

    try {
      let userId = username.trim();

      // If input is a valid email, resolve via backend (dev-campaign) first.
      if (isEmailLike(userId)) {
        toast.loading('Resolving email to user ID...', { id: 'resolve-email-click' });
        try {
          userId = await fetchInstagramUserIdByEmail(userId.toLowerCase());
          setEmailResolvedUserId(userId);
          toast.success('Email resolved to user ID', { id: 'resolve-email-click' });
        } catch (error) {
          toast.error('Failed to resolve email: ' + error.message, { id: 'resolve-email-click' });
          return;
        }
      }

      // Check if input is not numeric (i.e., it's a username)
      if (!/^\d+$/.test(userId)) {
        toast.loading('Resolving username to user ID...', { id: 'resolve-username' });
        try {
          userId = await fetchInstagramUserId(userId);
          toast.success('Username resolved to user ID', { id: 'resolve-username' });
        } catch (error) {
          toast.error('Failed to resolve username: ' + error.message, { id: 'resolve-username' });
          return;
        }
      }

      const fetchedCaptions = await fetchInstagramCaptions(userId, limit);
      setCaptions(fetchedCaptions);
      toast.success(`Fetched ${fetchedCaptions.length} captions`);
    } catch (error) {
      toast.error('Failed to fetch captions: ' + error.message);
    }
  };

  // Handle process with DeepInfra
  const handleProcessWithDeepInfra = async () => {
    if (captions.length === 0) {
      toast.error('Please fetch captions first');
      return;
    }

    if (!assembledPrompt) {
      toast.error('Please assemble a prompt first');
      return;
    }

    if (!selectedModel) {
      toast.error('Please select an AI model');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await processWithDeepInfra(captions, assembledPrompt, selectedModel);
      setDeepInfraResponse(response);
      toast.success('Processed successfully!');
    } catch (error) {
      toast.error('Failed to process: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle copy
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(deepInfraResponse || assembledPrompt);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  if (tagsLoading) {
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

  if (tagsError) {
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
                <p className="text-slate-600 dark:text-slate-400 mb-4">{tagsError.message}</p>
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
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Manual Replies</h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">Generate personalized replies using Instagram captions and AI prompts</p>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Username Input & Captions */}
              <div>
                {/* User ID Input Section */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Instagram User
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        Username, User ID, or Email
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter Instagram username, user ID, or an email (dev-campaign)"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100"
                      />
                      {(isResolvingEmail || emailResolvedUserId) && (
                        <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                          {isResolvingEmail ? 'Resolving email…' : `Resolved email user ID: ${emailResolvedUserId}`}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <ListBulletIcon className="h-4 w-4" />
                        Number of captions
                      </label>
                      <select
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100"
                      >
                        {limitOptions.map(limitValue => (
                          <option key={limitValue} value={limitValue}>{limitValue} captions</option>
                        ))}
                      </select>
                    </div>

                    <motion.button
                      whileHover={{ scale: username.trim() ? 1.02 : 1 }}
                      whileTap={{ scale: username.trim() ? 0.98 : 1 }}
                      onClick={handleFetchCaptions}
                      disabled={!username.trim()}
                      className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all font-semibold shadow-lg"
                    >
                      <ListBulletIcon className="h-5 w-5" />
                      <span>Fetch Captions</span>
                      <ArrowRightIcon className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>

                {/* Captions Display */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <DocumentTextIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    Instagram Captions ({captions.length})
                  </h3>

                  {captions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl inline-block mb-4">
                        <DocumentTextIcon className="h-16 w-16 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">No captions fetched yet</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500">Enter a username or user ID and click "Fetch Captions" to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      <AnimatePresence>
                        {captions.map((caption, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                Caption #{index + 1}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {caption.timestamp ? new Date(caption.timestamp).toLocaleDateString() : ''}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                              {caption.caption || 'No caption available'}
                            </p>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Tag Selection & Processing */}
              <div className="space-y-6">
                {/* Selected Tags */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <TagIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    Selected Tags ({selectedTags.length}/7)
                  </h3>

                  {selectedTags.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl inline-block mb-4">
                        <TagIcon className="h-16 w-16 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">No tags selected yet</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500">Choose tags from the list below to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence>
                        {selectedTags.map((tag, index) => (
                          <SelectedTagItem
                            key={tag.tagName}
                            tag={tag}
                            index={index}
                            onRemove={(tagName) => setSelectedTags(selectedTags.filter(t => t.tagName !== tagName))}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Modifiers */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <SparklesIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    Response Modifiers
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Tone</label>
                      <select
                        value={modifiers.tone}
                        onChange={(e) => setModifiers({ ...modifiers, tone: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100"
                      >
                        <option value="">Select tone...</option>
                        <option value="professional">Professional</option>
                        <option value="friendly">Friendly</option>
                        <option value="formal">Formal</option>
                        <option value="casual">Casual</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Length</label>
                      <select
                        value={modifiers.length}
                        onChange={(e) => setModifiers({ ...modifiers, length: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100"
                      >
                        <option value="">Select length...</option>
                        <option value="brief">Brief</option>
                        <option value="concise">Concise</option>
                        <option value="detailed">Detailed</option>
                        <option value="comprehensive">Comprehensive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Assemble Button */}
                <motion.button
                  whileHover={{ scale: selectedTags.length > 0 ? 1.02 : 1 }}
                  whileTap={{ scale: selectedTags.length > 0 ? 0.98 : 1 }}
                  onClick={handleAssemble}
                  disabled={selectedTags.length === 0 || isAssembling}
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all font-semibold shadow-lg"
                >
                  {isAssembling ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Assembling...</span>
                    </>
                  ) : (
                    <>
                      <DocumentTextIcon className="h-5 w-5" />
                      <span>Assemble Prompt</span>
                      <ArrowRightIcon className="h-5 w-5" />
                    </>
                  )}
                </motion.button>

                {/* AI Model Selection */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <SparklesIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    AI Model Selection
                  </h3>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Model <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      disabled={modelsLoading}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Select an AI model...</option>
                      {models.map((model) => {
                        // Use model_id if available (DeepInfra format), otherwise use id
                        const modelValue = model.model_id || model.id;
                        return (
                          <option key={model.id} value={modelValue}>
                            {model.name}
                          </option>
                        );
                      })}
                    </select>
                    {modelsLoading && (
                      <p className="mt-2 text-sm text-slate-500">Loading models...</p>
                    )}
                    {modelsError && (
                      <p className="mt-2 text-sm text-red-500">Failed to load models</p>
                    )}
                  </div>
                </div>

                {/* Process with DeepInfra Button */}
                <motion.button
                  whileHover={{ scale: (captions.length > 0 && assembledPrompt && selectedModel) ? 1.02 : 1 }}
                  whileTap={{ scale: (captions.length > 0 && assembledPrompt && selectedModel) ? 0.98 : 1 }}
                  onClick={handleProcessWithDeepInfra}
                  disabled={captions.length === 0 || !assembledPrompt || !selectedModel || isProcessing}
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all font-semibold shadow-lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5" />
                      <span>Generate Reply</span>
                      <ArrowRightIcon className="h-5 w-5" />
                    </>
                  )}
                </motion.button>

                {/* Response Display */}
                {(assembledPrompt || deepInfraResponse) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        {deepInfraResponse ? 'AI Generated Reply' : 'Assembled Prompt'}
                      </h3>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all font-medium"
                      >
                        {copied ? (
                          <>
                            <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm">Copied!</span>
                          </>
                        ) : (
                          <>
                            <ClipboardDocumentIcon className="h-4 w-4" />
                            <span className="text-sm">Copy</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
                      <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                        {deepInfraResponse || assembledPrompt}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Available Tags */}
            <div className="mt-8">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <TagIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Available Tags ({tags.length})
                </h3>
                <div className="flex flex-wrap gap-4">
                  <AnimatePresence>
                    {tags.map((tag) => (
                      <TagChip
                        key={tag.tagName}
                        tag={tag}
                        isSelected={selectedTags.some(t => t.tagName === tag.tagName)}
                        onToggle={handleTagToggle}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManualReplies;