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
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// API functions
const fetchTags = async () => {
  const response = await fetch('/api/email/tags');
  if (!response.ok) throw new Error('Failed to fetch tags');
  const data = await response.json();
  return data.items || [];
};

const fetchConversations = async () => {
  const response = await fetch('/api/email/conversations?limit=50');
  if (!response.ok) throw new Error('Failed to fetch conversations');
  const data = await response.json();
  return data.conversations || [];
};

const assemblePrompt = async (tagNames, modifiers) => {
  const response = await fetch('/api/email/assemble', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tagNames, modifiers })
  });
  if (!response.ok) throw new Error('Failed to assemble prompt');
  const data = await response.json();
  return data.combinedPrompt;
};

// Sample email conversation data
const sampleEmailConversation = {
  original: {
    subject: "Question about your pricing plans",
    from: "john.doe@example.com",
    date: "2024-01-15T10:30:00Z",
    body: `Hi there,

I'm interested in learning more about your pricing plans. I saw your website and I'm particularly interested in the Enterprise plan.

Could you please send me more details about:
- What's included in the Enterprise plan
- Pricing options
- Any discounts for annual subscriptions
- Implementation timeline

I'm looking to make a decision by the end of this month.

Thanks,
John Doe`
  },
  reply: {
    body: `Hi John,

Thank you for your interest in our Enterprise plan! I'd be happy to provide you with detailed information.

Here's what's included in our Enterprise plan:
- Unlimited users and projects
- Advanced analytics and reporting
- Priority support (24/7)
- Custom integrations
- Dedicated account manager

For pricing, our Enterprise plan starts at $299/month for up to 100 users, with volume discounts available. We offer a 15% discount for annual subscriptions.

Implementation typically takes 2-4 weeks depending on your specific requirements. I'd be happy to schedule a call to discuss your needs in more detail.

Would you like to set up a demo call this week? I can show you the platform and answer any specific questions you might have.

Best regards,
Alex Chen
Customer Success Team`
  }
};

// Tag Chip Component
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

// Selected Tag Item Component
const SelectedTagItem = ({ tag, index, onRemove, onDragStart, onDragEnd }) => {
  return (
    <Draggable draggableId={tag.tagName} index={index}>
      {(provided, snapshot) => (
        <motion.div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          layout
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`
            flex items-center space-x-3 p-4 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl border border-indigo-200 dark:border-indigo-700
            ${snapshot.isDragging ? 'shadow-xl rotate-1' : ''}
          `}
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
      )}
    </Draggable>
  );
};

// Email Viewer Component
const EmailViewer = ({ conversation, isRealConversation = false }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isRealConversation) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <EnvelopeIcon className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold">Gmail Conversation</h3>
          </div>
          <div className="text-sm text-slate-300 space-y-1">
            <p><span className="font-semibold text-slate-200">Subject:</span> {conversation.subject}</p>
            <p><span className="font-semibold text-slate-200">From:</span> {conversation.from}</p>
            <p><span className="font-semibold text-slate-200">Date:</span> {formatDate(conversation.date)}</p>
            <p><span className="font-semibold text-slate-200">Thread ID:</span> {conversation.threadId}</p>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Conversation Messages */}
          {conversation.conversation?.map((email, index) => (
            <div key={email.emailId || index}>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-slate-400' : 'bg-indigo-500'}`}></div>
                {index === 0 ? 'Original Message' : `Reply ${index}`}
              </h4>
              <div className={`rounded-xl p-4 border ${
                index === 0 
                  ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
                  : 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-700'
              }`}>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  From: {email.from} • {formatDate(email.date)}
                </div>
                <pre className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {email.body}
                </pre>
              </div>
            </div>
          )) || (
            // Fallback for single email
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                Email Content
              </h4>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                <pre className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {conversation.body}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Original sample conversation format
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-500 rounded-lg">
            <EnvelopeIcon className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-bold">Email Conversation</h3>
        </div>
        <div className="text-sm text-slate-300 space-y-1">
          <p><span className="font-semibold text-slate-200">Subject:</span> {conversation.original.subject}</p>
          <p><span className="font-semibold text-slate-200">From:</span> {conversation.original.from}</p>
          <p><span className="font-semibold text-slate-200">Date:</span> {new Date(conversation.original.date).toLocaleString()}</p>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Original Email */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
            Original Message
          </h4>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
            <pre className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
              {conversation.original.body}
            </pre>
          </div>
        </div>
        
        {/* Reply */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            Your Reply
          </h4>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-700">
            <pre className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
              {conversation.reply.body}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

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

// Main Component
const EmailReplySimulator = () => {
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
  const [currentConversationIndex, setCurrentConversationIndex] = useState(0);
  const [useRealConversations, setUseRealConversations] = useState(false);

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  // Fetch tags
  const { data: tags = [], isLoading, error } = useQuery({
    queryKey: ['email-tags'],
    queryFn: fetchTags
  });

  // Fetch conversations
  const { 
    data: conversations = [], 
    isLoading: conversationsLoading, 
    error: conversationsError,
    refetch: refetchConversations
  } = useQuery({
    queryKey: ['gmail-conversations-simulator'],
    queryFn: fetchConversations,
    enabled: useRealConversations
  });

  // Assemble mutation
  const assembleMutation = useMutation({
    mutationFn: ({ tagNames, modifiers }) => assemblePrompt(tagNames, modifiers),
    onSuccess: (prompt) => {
      setAssembledPrompt(prompt);
      toast.success('Prompt assembled successfully!');
    },
    onError: (error) => {
      toast.error('Failed to assemble prompt: ' + error.message);
    }
  });

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

  // Handle drag end
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(selectedTags);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setSelectedTags(items);
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
      await assembleMutation.mutateAsync({ tagNames, modifiers });
    } finally {
      setIsAssembling(false);
    }
  };

  // Handle copy
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(assembledPrompt);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Navigation functions
  const handlePreviousConversation = () => {
    if (useRealConversations && conversations.length > 0) {
      setCurrentConversationIndex(prev => 
        prev === 0 ? conversations.length - 1 : prev - 1
      );
    }
  };

  const handleNextConversation = () => {
    if (useRealConversations && conversations.length > 0) {
      setCurrentConversationIndex(prev => 
        prev === conversations.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleToggleConversationMode = () => {
    setUseRealConversations(!useRealConversations);
    if (!useRealConversations) {
      refetchConversations();
    }
  };

  // Get current conversation
  const getCurrentConversation = () => {
    if (useRealConversations && conversations.length > 0) {
      return conversations[currentConversationIndex];
    }
    return sampleEmailConversation;
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
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Error Loading Simulator</h2>
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
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Email Reply Simulator</h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">Select prompt tags and assemble AI-ready responses</p>
                </div>
              </div>
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Email Viewer */}
              <div>
                {/* Conversation Browser Controls */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-6 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <ListBulletIcon className="h-5 w-5" />
                      Conversation Browser
                    </h3>
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleToggleConversationMode}
                        className={`px-4 py-2 rounded-xl font-medium transition-all ${
                          useRealConversations
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {useRealConversations ? 'Gmail Data' : 'Sample Data'}
                      </motion.button>
                      {useRealConversations && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => refetchConversations()}
                          className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {useRealConversations && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handlePreviousConversation}
                          disabled={conversationsLoading || conversations.length === 0}
                          className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <ChevronLeftIcon className="h-4 w-4" />
                        </motion.button>
                        <span className="text-sm text-slate-600 dark:text-slate-400 px-3">
                          {conversationsLoading ? 'Loading...' : `${currentConversationIndex + 1} of ${conversations.length}`}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleNextConversation}
                          disabled={conversationsLoading || conversations.length === 0}
                          className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <ChevronRightIcon className="h-4 w-4" />
                        </motion.button>
                      </div>
                      {conversations.length > 0 && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Thread ID: {conversations[currentConversationIndex]?.threadId}
                        </div>
                      )}
                    </div>
                  )}

                  {conversationsError && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Error loading conversations: {conversationsError.message}
                      </p>
                    </div>
                  )}
                </div>

                <EmailViewer 
                  conversation={getCurrentConversation()} 
                  isRealConversation={useRealConversations}
                />
              </div>
              
              {/* Right Column - Tag Selection & Assembly */}
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
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="selected-tags">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="space-y-3"
                          >
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
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
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
                
                {/* Assembled Prompt */}
                {assembledPrompt && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <DocumentTextIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        Assembled Prompt
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
                        {assembledPrompt}
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

export default EmailReplySimulator;