import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Pagination from '../../components/Pagination';
import { 
  EnvelopeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  EyeIcon,
  ArrowPathIcon,
  XMarkIcon,
  ArrowUpIcon,
  TableCellsIcon,
  Squares2X2Icon,
  BarsArrowUpIcon
} from '@heroicons/react/24/outline';

// API functions
const fetchConversations = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.lastKey) queryParams.append('lastKey', params.lastKey);
  if (params.search) queryParams.append('search', params.search);
  if (params.label) queryParams.append('label', params.label);
  if (params.fromDate) queryParams.append('fromDate', params.fromDate);
  if (params.toDate) queryParams.append('toDate', params.toDate);
  if (params.gmailAccount) queryParams.append('gmailAccount', params.gmailAccount);
  
  const response = await fetch(`/api/email/conversations?${queryParams}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch conversations');
  }
  const data = await response.json();
  return data;
};

const seedConversations = async () => {
  // Note: Seed endpoint not implemented - using real data from Cosmos DB
  // This function is kept for UI compatibility but will show an error
  throw new Error('Seed functionality not available. Using real data from Cosmos DB gmail-conversations container.');
};

// Table Row Component
const ConversationTableRow = ({ conversation, onView, index }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
      onClick={() => onView(conversation)}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-sm">
            {conversation.from?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {conversation.from || 'Unknown Sender'}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {conversation.to?.[0] || 'No recipient'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {conversation.subject || 'No Subject'}
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-md">
          {conversation.snippet || 'No preview'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-slate-900 dark:text-slate-100">
          {formatDate(conversation.date)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-wrap gap-1">
          {conversation.labels?.slice(0, 2).map((label, idx) => (
            <span
              key={idx}
              className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full"
            >
              {label}
            </span>
          ))}
          {conversation.labels?.length > 2 && (
            <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded-full">
              +{conversation.labels.length - 2}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
        {conversation.conversation?.length || 1} message{(conversation.conversation?.length || 1) !== 1 ? 's' : ''}
      </td>
    </motion.tr>
  );
};

// Conversation Card Component
const ConversationCard = ({ conversation, onView, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLabelColor = (label) => {
    const colors = {
      'INBOX': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'IMPORTANT': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'URGENT': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'SUPPORT': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'SALES': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'BILLING': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'FEEDBACK': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      'SECURITY': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'PARTNERSHIP': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
      'ONBOARDING': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
      'CANCELLATION': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      'UPGRADE': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      'FEATURE_REQUEST': 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
      'PRODUCT': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      'POSITIVE': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    };
    return colors[label] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -2, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer transition-all duration-200"
      onClick={() => onView(conversation)}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate mb-1">
              {conversation.subject}
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <UserIcon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{conversation.from}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              #{conversation.threadId?.split('-')[1] || conversation.threadId?.substring(0, 8) || 'N/A'}
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <EyeIcon className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        {/* Snippet */}
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
          {conversation.snippet}
        </p>

        {/* Labels */}
        <div className="flex flex-wrap gap-2 mb-4">
          {conversation.labels?.slice(0, 3).map((label, idx) => (
            <span
              key={idx}
              className={`px-2 py-1 rounded-full text-xs font-medium ${getLabelColor(label)}`}
            >
              {label}
            </span>
          ))}
          {conversation.labels?.length > 3 && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              +{conversation.labels.length - 3}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <CalendarIcon className="h-4 w-4" />
            <span>{formatDate(conversation.date)}</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {conversation.conversation?.length || 1} message{(conversation.conversation?.length || 1) !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Hover overlay */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-400/10 dark:to-purple-400/10 pointer-events-none"
          />
        )}
      </AnimatePresence>
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

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Main Component
const GmailConversations = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Local search term for input
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); // Actual search term used for API
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [selectedGmailAccount, setSelectedGmailAccount] = useState(''); // Empty means all accounts
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Date filter state
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Sorting state
  const [sortBy, setSortBy] = useState('date'); // 'date', 'labels', 'from', 'to'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  
  // View mode state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  
  // Offset-based pagination state (like savedResultsController)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0); // Will be fetched from backend
  const [currentPageData, setCurrentPageData] = useState([]); // Current page conversations
  const [allLabels, setAllLabels] = useState([]); // All available labels from DynamoDB table
  const [isLoadingLabels, setIsLoadingLabels] = useState(true); // Loading state for labels from DynamoDB
  const [allGmailAccounts, setAllGmailAccounts] = useState([]); // All available Gmail accounts
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true); // Loading state for Gmail accounts
  
  // Loading state
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Debounce search term to avoid flashing
  const debouncedSearch = useDebounce(searchTerm, 500); // 500ms delay

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // Sync debounced search term for API calls
  useEffect(() => {
    if (debouncedSearch !== debouncedSearchTerm) {
      setIsSearching(true);
      setDebouncedSearchTerm(debouncedSearch);
    }
  }, [debouncedSearch, debouncedSearchTerm]);

  // Fetch total count from backend
  const fetchTotalCount = useCallback(async () => {
    try {
      // Convert date inputs to ISO format for proper DynamoDB comparison
      let fromDateISO = undefined;
      let toDateISO = undefined;
      
      if (fromDate) {
        const date = new Date(fromDate);
        date.setHours(0, 0, 0, 0);
        fromDateISO = date.toISOString();
      }
      
      if (toDate) {
        const date = new Date(toDate);
        date.setHours(23, 59, 59, 999);
        toDateISO = date.toISOString();
      }
      
      const params = new URLSearchParams();
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      if (selectedLabels.length > 0) {
        // Use first label for now (backend supports single label filter)
        params.append('label', selectedLabels[0]);
      }
      if (fromDateISO) {
        params.append('fromDate', fromDateISO);
      }
      if (toDateISO) {
        params.append('toDate', toDateISO);
      }
      if (selectedGmailAccount) {
        params.append('gmailAccount', selectedGmailAccount);
      }

      const response = await fetch(`/api/email/conversations/stats?${params.toString()}`);
      const result = await response.json();
      
      if (result.success && result.stats) {
        setTotalItems(result.stats.totalThreads || 0);
      }
    } catch (error) {
      console.error('Failed to fetch total count:', error);
      // Don't show error toast, just log it
    }
  }, [debouncedSearchTerm, selectedLabels, fromDate, toDate, selectedGmailAccount]);

  // Fetch all available labels from DynamoDB table column
  // This loads labels from the labels column in the database
  const fetchLabels = useCallback(async (bustCache = false) => {
    setIsLoadingLabels(true);
    try {
      const url = bustCache 
        ? '/api/email/conversations/labels?bustCache=true'
        : '/api/email/conversations/labels';
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success && result.labels) {
        setAllLabels(result.labels || []);
      } else {
        console.error('Failed to fetch labels from DynamoDB:', result);
        setAllLabels([]);
      }
    } catch (error) {
      console.error('Failed to fetch labels from DynamoDB:', error);
      toast.error('Failed to load labels from database. Please refresh the page.');
      setAllLabels([]);
    } finally {
      setIsLoadingLabels(false);
    }
  }, []);

  // Fetch all available Gmail accounts from backend
  const fetchGmailAccounts = useCallback(async (bustCache = false) => {
    setIsLoadingAccounts(true);
    try {
      const url = bustCache
        ? '/api/email/conversations/accounts?bustCache=true'
        : '/api/email/conversations/accounts';
      const response = await fetch(url);
      const result = await response.json();

      if (result.success && result.accounts) {
        setAllGmailAccounts(result.accounts || []);
      } else {
        console.error('Failed to fetch Gmail accounts:', result);
        setAllGmailAccounts([]);
      }
    } catch (error) {
      console.error('Failed to fetch Gmail accounts:', error);
      toast.error('Failed to load Gmail accounts. Please refresh the page.');
      setAllGmailAccounts([]);
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

  // Load page data function - offset-based pagination like savedResultsController
  const loadPage = useCallback(async (page, offset = null) => {
    setIsLoadingPage(true);
    try {
      // Convert date inputs to ISO format for proper DynamoDB comparison
      // fromDate: start of day (00:00:00)
      // toDate: end of day (23:59:59.999)
      let fromDateISO = undefined;
      let toDateISO = undefined;

      if (fromDate) {
        const date = new Date(fromDate);
        date.setHours(0, 0, 0, 0);
        fromDateISO = date.toISOString();
      }

      if (toDate) {
        const date = new Date(toDate);
        date.setHours(23, 59, 59, 999);
        toDateISO = date.toISOString();
      }

      // Build filter params - offset-based pagination like savedResults
      const params = {
        limit: pageSize,
        lastKey: offset || undefined, // Use offset as lastKey (like savedResults)
        search: debouncedSearchTerm || undefined,
        label: selectedLabels.length > 0 ? selectedLabels[0] : undefined, // Backend supports single label
        fromDate: fromDateISO,
        toDate: toDateISO,
        gmailAccount: selectedGmailAccount || undefined
      };

      const data = await fetchConversations(params);

      // Update current page data
      setCurrentPageData(data.conversations || []);

      // Update total count from backend response
      if (data.totalCount) {
        setTotalItems(data.totalCount);
      } else {
        // Fetch total count after loading page if not in response
        await fetchTotalCount();
      }

      return data;
    } catch (error) {
      console.error('Failed to load page:', error);
      toast.error('Failed to load conversations: ' + error.message);
      throw error;
    } finally {
      setIsLoadingPage(false);
    }
  }, [pageSize, debouncedSearchTerm, selectedLabels, fromDate, toDate, selectedGmailAccount, fetchTotalCount]);

  // Fetch labels from DynamoDB table column on mount
  // Load labels immediately - they come from the labels column in the database
  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  // Fetch Gmail accounts on mount
  useEffect(() => {
    fetchGmailAccounts();
  }, [fetchGmailAccounts]);

  // Reset pagination when search/filters change
  useEffect(() => {
    if (debouncedSearchTerm || selectedLabels.length > 0 || fromDate || toDate || selectedGmailAccount) {
      setCurrentPage(1);
      setIsSearching(true);
    }
    // Fetch total count when filters change
    fetchTotalCount();
  }, [debouncedSearchTerm, selectedLabels, fromDate, toDate, selectedGmailAccount, fetchTotalCount]);

  // Initial load and page change handler - offset-based like savedResultsController
  useEffect(() => {
    // Skip if loadPage is not ready (shouldn't happen, but safety check)
    if (!loadPage) {
      console.warn('loadPage not ready, skipping load');
      return;
    }

    let isMounted = true;

    const loadCurrentPage = async () => {
      try {
        // Calculate offset for current page (offset-based pagination like savedResults)
        // For page 1: offset = 0 (no lastKey)
        // For page 2: offset = pageSize (e.g., "50")
        // For page 3: offset = pageSize * 2 (e.g., "100")
        const offset = currentPage > 1 ? String((currentPage - 1) * pageSize) : null;

        console.log(`📄 Loading page ${currentPage} with offset:`, offset);

        // Load the requested page
        if (isMounted) {
          await loadPage(currentPage, offset);

          if (isMounted) {
            setIsSearching(false);
          }
        }
      } catch (error) {
        console.error('Error loading page:', error);
        if (isMounted) {
          setIsSearching(false);
          setIsLoadingPage(false);
          // Show user-friendly error
          toast.error('Failed to load conversations. Please try again.');
        }
      }
    };

    // Small delay to ensure component is fully mounted
    const timeoutId = setTimeout(() => {
      loadCurrentPage();
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [currentPage, loadPage, pageSize]);

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / pageSize);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage && !isLoadingPage) {
      setCurrentPage(newPage);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize) => {
    if (newPageSize !== pageSize && !isLoadingPage) {
      setPageSize(newPageSize);
      setCurrentPage(1); // Reset to first page
    }
  };

  // Seed conversations mutation (disabled - using real DynamoDB data)
  const seedMutation = useMutation({
    mutationFn: seedConversations,
    onSuccess: () => {
      toast.success('Conversations seeded successfully!');
      // Reload page 1
      setCurrentPage(1);
    },
    onError: (error) => {
      toast.error('Failed to seed conversations: ' + error.message);
    }
  });

  // Use current page data directly (backend already filters)
  const filteredConversations = useMemo(() => {
    return currentPageData || [];
  }, [currentPageData]);

  // Use labels from DynamoDB table column (loaded from backend)
  // This is the source of truth for all available labels
  const availableLabels = useMemo(() => {
    if (!allLabels || allLabels.length === 0) {
      return [];
    }
    
    // Clean and sort labels from backend
    const cleanedLabels = allLabels
      .map(label => {
        // Handle label format (e.g., "CATEGORY/INBOX" or just "INBOX")
        const cleanLabel = typeof label === 'string' 
          ? label.split('/').pop().trim()
          : String(label).trim();
        return cleanLabel && cleanLabel !== '' && cleanLabel !== 'undefined' ? cleanLabel : null;
      })
      .filter(label => label !== null);
    
    return [...new Set(cleanedLabels)].sort();
  }, [allLabels]);

  // Apply client-side label filtering if multiple labels selected (backend only supports single label)
  const filteredConversationsWithLabels = useMemo(() => {
    let filtered = filteredConversations;
    
    // Client-side filter for multiple labels
    if (selectedLabels.length > 1) {
      filtered = filteredConversations.filter(conversation => {
        const conversationLabels = conversation.labels || [];
        return selectedLabels.some(selectedLabel => 
          conversationLabels.some(label => {
            // Handle label format (e.g., "CATEGORY/INBOX" or just "INBOX")
            const cleanLabel = typeof label === 'string' 
              ? label.split('/').pop() 
              : String(label);
            return cleanLabel === selectedLabel;
          })
        );
      });
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date || 0).getTime();
          bValue = new Date(b.date || 0).getTime();
          break;
          
        case 'labels':
          // Sort by first label alphabetically, or empty string if no labels
          // Handle various label formats (e.g., "CATEGORY/INBOX" -> "INBOX")
          const aLabels = (a.labels || [])
            .filter(l => l != null && l !== '') // Filter out null/empty values
            .map(l => {
              const labelStr = typeof l === 'string' ? l : String(l);
              // Remove prefix like "CATEGORY/" or "LABEL/" if present
              return labelStr.split('/').pop().trim();
            })
            .filter(l => l !== '') // Filter out empty strings after processing
            .sort();
          const bLabels = (b.labels || [])
            .filter(l => l != null && l !== '') // Filter out null/empty values
            .map(l => {
              const labelStr = typeof l === 'string' ? l : String(l);
              // Remove prefix like "CATEGORY/" or "LABEL/" if present
              return labelStr.split('/').pop().trim();
            })
            .filter(l => l !== '') // Filter out empty strings after processing
            .sort();
          // Use first label (alphabetically) for comparison, or empty string if no labels
          aValue = aLabels.length > 0 ? aLabels[0].toLowerCase() : '';
          bValue = bLabels.length > 0 ? bLabels[0].toLowerCase() : '';
          break;
          
        case 'from':
          aValue = (a.from || '').toLowerCase();
          bValue = (b.from || '').toLowerCase();
          break;
          
        case 'to':
          // Sort by first recipient
          const aTo = Array.isArray(a.to) && a.to.length > 0 ? a.to[0] : (a.to || '');
          const bTo = Array.isArray(b.to) && b.to.length > 0 ? b.to[0] : (b.to || '');
          aValue = (typeof aTo === 'string' ? aTo : String(aTo)).toLowerCase();
          bValue = (typeof bTo === 'string' ? bTo : String(bTo)).toLowerCase();
          break;
          
        default:
          return 0;
      }
      
      // Compare values
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [filteredConversations, selectedLabels, sortBy, sortOrder]);

  // Handle view conversation
  const handleViewConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  // Handle close conversation view
  const handleCloseConversation = () => {
    setSelectedConversation(null);
  };

  // Handle seed conversations
  const handleSeedConversations = () => {
    if (window.confirm('This will add 10 sample conversations to the database. Continue?')) {
      seedMutation.mutate();
    }
  };

  // Handle scroll to top
  const handleScrollToTop = () => {
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
      modalContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle scroll detection
  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    setShowScrollTop(scrollTop > 200);
  };

  // Show loading state only on initial load
  if (isLoadingPage && currentPageData.length === 0 && currentPage === 1) {
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


  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="sidebar-shell-main-noscroll">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-900">
          <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
            {/* Page header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Gmail Conversations</h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">
                    {totalItems > 0 ? (
                      <>
                        Showing {filteredConversationsWithLabels.length} of {totalItems.toLocaleString()} total conversations
                        {isSearching && ' (searching...)'}
                        {selectedLabels.length > 0 && ` • Filtered by ${selectedLabels.length} label${selectedLabels.length > 1 ? 's' : ''}`}
                        {selectedGmailAccount && ` • Gmail Account: ${selectedGmailAccount}`}
                        {fromDate && ` • From: ${new Date(fromDate).toLocaleDateString()}`}
                        {toDate && ` • To: ${new Date(toDate).toLocaleDateString()}`}
                        {sortBy !== 'date' || sortOrder !== 'desc' ? ` • Sorted by ${sortBy} (${sortOrder === 'asc' ? 'A→Z' : 'Z→A'})` : ''}
                      </>
                    ) : (
                      'Loading conversation count...'
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* View Toggle */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all font-medium"
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <TableCellsIcon className="h-4 w-4" />
                        <span>Table View</span>
                      </>
                    ) : (
                      <>
                        <Squares2X2Icon className="h-4 w-4" />
                        <span>Grid View</span>
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setCurrentPage(1);
                    }}
                    disabled={isLoadingPage}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium disabled:opacity-50"
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${isLoadingPage ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Search and Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-8 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors ${isSearching ? 'text-indigo-500' : 'text-slate-400'}`} />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Filter Toggle */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all font-medium ${
                    showFilters 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <FunnelIcon className="h-5 w-5" />
                  <span>Filters</span>
                </motion.button>
              </div>

              {/* Filter Options */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600"
                  >
                    <div className="space-y-4">
                      {/* Sorting Options */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <BarsArrowUpIcon className="h-4 w-4 inline mr-1" />
                          Sort By
                        </label>
                        <div className="flex flex-wrap gap-3">
                          <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Sort Field</label>
                            <select
                              value={sortBy}
                              onChange={(e) => {
                                setSortBy(e.target.value);
                                setCurrentPage(1);
                              }}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100"
                            >
                              <option value="date">Date</option>
                              <option value="labels">Labels</option>
                              <option value="from">From Address</option>
                              <option value="to">To Address</option>
                            </select>
                          </div>
                          <div className="flex-1 min-w-[150px]">
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Order</label>
                            <select
                              value={sortOrder}
                              onChange={(e) => {
                                setSortOrder(e.target.value);
                                setCurrentPage(1);
                              }}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100"
                            >
                              <option value="asc">Ascending</option>
                              <option value="desc">Descending</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Date Range Filters */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <CalendarIcon className="h-4 w-4 inline mr-1" />
                          Date Range Filter
                        </label>
                        <div className="flex flex-wrap gap-3">
                          <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">From Date</label>
                            <input
                              type="date"
                              value={fromDate}
                              onChange={(e) => {
                                setFromDate(e.target.value);
                                setCurrentPage(1);
                              }}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">To Date</label>
                            <input
                              type="date"
                              value={toDate}
                              onChange={(e) => {
                                setToDate(e.target.value);
                                setCurrentPage(1);
                              }}
                              min={fromDate || undefined}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Gmail Account Filters */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <UserIcon className="h-4 w-4 inline mr-1" />
                          Gmail Account
                          {allGmailAccounts.length > 0 && (
                            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                              ({allGmailAccounts.length} accounts available)
                            </span>
                          )}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {isLoadingAccounts ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                              <span>Loading Gmail accounts...</span>
                            </div>
                          ) : allGmailAccounts.length > 0 ? (
                            <>
                              {/* "All Accounts" option */}
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  setSelectedGmailAccount('');
                                  setCurrentPage(1);
                                }}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  selectedGmailAccount === ''
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                              >
                                All Accounts
                                {selectedGmailAccount === '' && (
                                  <span className="ml-1">✓</span>
                                )}
                              </motion.button>

                              {/* Individual account options */}
                              {allGmailAccounts.map((account) => (
                                <motion.button
                                  key={account}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setSelectedGmailAccount(account);
                                    setCurrentPage(1);
                                  }}
                                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                    selectedGmailAccount === account
                                      ? 'bg-indigo-600 text-white shadow-md'
                                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                  }`}
                                >
                                  {account}
                                  {selectedGmailAccount === account && (
                                    <span className="ml-1">✓</span>
                                  )}
                                </motion.button>
                              ))}
                            </>
                          ) : (
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              <p className="mb-2">
                                No Gmail accounts found in the database. The gmail_account column may be empty.
                              </p>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  fetchGmailAccounts(true); // Bust cache
                                }}
                                className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                              >
                                Refresh Accounts
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Label Filters */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <TagIcon className="h-4 w-4 inline mr-1" />
                          Labels
                          {availableLabels.length > 0 && (
                            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                              ({availableLabels.length} from DynamoDB)
                            </span>
                          )}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {isLoadingLabels ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                              <span>Loading labels from DynamoDB table...</span>
                            </div>
                          ) : availableLabels.length > 0 ? (
                            availableLabels.map((label) => (
                            <motion.button
                              key={label}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                  setSelectedLabels(prev => {
                                    const newLabels = prev.includes(label)
                                    ? prev.filter(l => l !== label)
                                      : [...prev, label];
                                    // Reset pagination when filters change
                                    setCurrentPage(1);
                                    return newLabels;
                                  });
                              }}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                selectedLabels.includes(label)
                                    ? 'bg-indigo-600 text-white shadow-md'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                              }`}
                            >
                              {label}
                                {selectedLabels.includes(label) && (
                                  <span className="ml-1">✓</span>
                                )}
                            </motion.button>
                            ))
                          ) : (
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              <p className="mb-2">
                                No labels found in DynamoDB table. The labels column may be empty.
                              </p>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  fetchLabels(true); // Bust cache
                                }}
                                className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                              >
                                Refresh Labels
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Clear Filters Button */}
                      {(selectedLabels.length > 0 || selectedGmailAccount || fromDate || toDate || sortBy !== 'date' || sortOrder !== 'desc') && (
                        <div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedLabels([]);
                              setSelectedGmailAccount('');
                              setFromDate('');
                              setToDate('');
                              setSortBy('date');
                              setSortOrder('desc');
                              setCurrentPage(1);
                            }}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                          >
                            Clear All Filters & Sorting
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Conversations View - Grid or Table */}
            {viewMode === 'grid' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
              >
                <AnimatePresence mode="wait">
                  {isLoadingPage && filteredConversationsWithLabels.length === 0 ? (
                    <div className="col-span-full flex items-center justify-center py-12">
                      <LoadingSpinner />
                    </div>
                  ) : filteredConversationsWithLabels.length > 0 ? (
                    filteredConversationsWithLabels.map((conversation, index) => (
                  <ConversationCard
                    key={conversation.threadId}
                    conversation={conversation}
                    onView={handleViewConversation}
                    index={index}
                  />
                    ))
                  ) : (
                    <div className="col-span-full flex items-center justify-center py-12">
                      <div className="text-center">
                        <EnvelopeIcon className="h-16 w-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-600 dark:text-slate-400">No conversations found</p>
                      </div>
                    </div>
                  )}
              </AnimatePresence>
            </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-8"
              >
                {isLoadingPage && filteredConversations.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                      <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            From / To
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Subject / Preview
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Labels
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Messages
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        <AnimatePresence>
                          {filteredConversationsWithLabels.length > 0 ? (
                            filteredConversationsWithLabels.map((conversation, index) => (
                              <ConversationTableRow
                                key={conversation.threadId}
                                conversation={conversation}
                                onView={handleViewConversation}
                                index={index}
                              />
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="px-6 py-12 text-center">
                                <EnvelopeIcon className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                                <p className="text-slate-600 dark:text-slate-400">No conversations found</p>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* Pagination */}
            {filteredConversationsWithLabels.length > 0 && totalPages > 1 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={totalItems}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  loading={isLoadingPage}
                  showPageSizeSelector={true}
                />
              </div>
            )}

            {/* Empty State */}
            {filteredConversationsWithLabels.length === 0 && !isLoadingPage && !isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl inline-block mb-4">
                  <EnvelopeIcon className="h-16 w-16 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  No conversations found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {searchTerm || selectedLabels.length > 0 || fromDate || toDate
                    ? 'Try adjusting your search or filters'
                    : 'No conversations available. Click "Seed Data" to add sample conversations.'
                  }
                </p>
                {!searchTerm && selectedLabels.length === 0 && !fromDate && !toDate && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSeedConversations}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium"
                  >
                    Add Sample Data
                  </motion.button>
                )}
              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* Conversation Detail Modal */}
      <AnimatePresence>
        {selectedConversation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto"
            onClick={handleCloseConversation}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-5xl my-2 sm:my-8 min-h-[90vh] sm:min-h-[80vh] max-h-[98vh] sm:max-h-[95vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Fixed Header */}
              <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100 break-words">
                      {selectedConversation.subject}
                    </h2>
                    <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      <span>Thread ID: {selectedConversation.threadId}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>From: {selectedConversation.from}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{selectedConversation.conversation?.length || 1} message{(selectedConversation.conversation?.length || 1) !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseConversation}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              {/* Scrollable Content */}
              <div 
                className="flex-1 overflow-y-auto modal-content"
                onScroll={handleScroll}
              >
                <div className="p-4 sm:p-6">
                  <div className="space-y-6">
                    {selectedConversation.conversation?.length > 0 ? (
                      selectedConversation.conversation.map((email, index) => {
                        // Handle both object and string formats
                        const emailData = typeof email === 'string' 
                          ? { body: email, from: selectedConversation.from, date: selectedConversation.date }
                          : email;
                        
                        return (
                      <motion.div
                            key={emailData.emailId || emailData.email_id || emailData.messageId || emailData.id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 sm:p-6 bg-slate-50 dark:bg-slate-700/50"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100">
                                    {emailData.from || emailData.From || selectedConversation.from || 'Unknown Sender'}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                    {new Date(emailData.date || emailData.Date || emailData.timestamp || selectedConversation.date).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded-full">
                            Message {index + 1}
                          </div>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                          <div className="prose dark:prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-sans leading-relaxed m-0">
                                  {emailData.body || emailData.Body || emailData.content || emailData.text || emailData || 'No content'}
                            </pre>
                          </div>
                        </div>
                      </motion.div>
                        );
                      })
                    ) : (
                      // Fallback for single email conversations
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 sm:p-6 bg-slate-50 dark:bg-slate-700/50"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              1
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100">
                                {selectedConversation.from}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {new Date(selectedConversation.date).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded-full">
                            Single Message
                          </div>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                          <div className="prose dark:prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-sans leading-relaxed m-0">
                              {selectedConversation.body || selectedConversation.snippet}
                            </pre>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* Scroll to Top Button */}
              <AnimatePresence>
                {showScrollTop && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={handleScrollToTop}
                    className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 p-2 sm:p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all duration-200 z-10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ArrowUpIcon className="h-5 w-5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GmailConversations;
