import { useState, useCallback, useRef, useEffect, useMemo, startTransition } from 'react';
import { getBackendUrl } from '../../utils/getBackendUrl';
import { createTimeoutSignal } from '../../utils/timeoutSignal';

function getAuthHeaders() {
  const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Modals Controller
 * Handles all modal states and operations
 * Similar to backend controller pattern - exports functions that can be called
 */
export const useModalsController = (user, savedResults = []) => {
  // Modal visibility states
  const [showUsersWithEmailsModal, setShowUsersWithEmailsModal] = useState(false);
  const [showTaskUsersModal, setShowTaskUsersModal] = useState(false);
  const [showTaskViewModal, setShowTaskViewModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showTotalRecordsModal, setShowTotalRecordsModal] = useState(false);

  // Task Users Modal state
  const [taskUsersTaskId, setTaskUsersTaskId] = useState(null);
  const [taskUsersTaskHashtag, setTaskUsersTaskHashtag] = useState(null);
  const [taskUsersIsTenantWide, setTaskUsersIsTenantWide] = useState(false);

  // Task View Modal state
  const [taskViewLoading, setTaskViewLoading] = useState(false);
  const [modalSelectedResult, setModalSelectedResult] = useState(null);
  const [modalSummary, setModalSummary] = useState(null);
  const [modalExtractedItems, setModalExtractedItems] = useState([]);
  const [modalRecordsLoading, setModalRecordsLoading] = useState(false);
  const [modalRecordsPageIndex, setModalRecordsPageIndex] = useState(0);
  const [modalRecordsKeyStack, setModalRecordsKeyStack] = useState([null]);
  const [modalRecordsNextKey, setModalRecordsNextKey] = useState(null);

  // Campaign Modal state
  const [campaignName, setCampaignName] = useState('');
  const [campaignPromptTemplateId, setCampaignPromptTemplateId] = useState('');
  const [campaignGptModel, setCampaignGptModel] = useState('');
  const [campaignTaskIds, setCampaignTaskIds] = useState([]);
  const [campaignRequirePublicEmail, setCampaignRequirePublicEmail] = useState(false);
  const [campaignJsonFormat, setCampaignJsonFormat] = useState(false);
  const [sendingToCampaign, setSendingToCampaign] = useState(false);

  // Campaign exclusion state
  const [excludedCampaignIds, setExcludedCampaignIds] = useState([]);
  const [availableCampaignIds, setAvailableCampaignIds] = useState([]);
  const [campaignIdsLoading, setCampaignIdsLoading] = useState(false);
  
  // Tenant-wide campaign state
  const [isTenantWideCampaign, setIsTenantWideCampaign] = useState(false);
  const [campaignUserLimit, setCampaignUserLimit] = useState(100);
  const [tenantTotalUsersWithEmails, setTenantTotalUsersWithEmails] = useState(0);

  // Followers filter state
  const [campaignFollowersMin, setCampaignFollowersMin] = useState('');
  const [campaignFollowersMax, setCampaignFollowersMax] = useState('');

  // Prompt templates and AI models for campaign modal
  const [promptTemplates, setPromptTemplates] = useState([]);
  const [promptTemplatesLoading, setPromptTemplatesLoading] = useState(false);
  const [aiModels, setAiModels] = useState([]);
  const [aiModelsLoading, setAiModelsLoading] = useState(false);

  // Session Modal state
  const [sessionName, setSessionName] = useState('');
  const [pendingTaskId, setPendingTaskId] = useState(null);
  const [pendingUserIds, setPendingUserIds] = useState([]);
  const [creatingSession, setCreatingSession] = useState(false);

  // Refs to prevent glitching and race conditions
  const taskUsersAbortControllerRef = useRef(null);
  const promptTemplatesFetchedRef = useRef(false);
  const mediafyConfigsFetchedRef = useRef(false);
  const aiModelsFetchedRef = useRef(false);
  const campaignIdsFetchedRef = useRef(false);

  /**
   * Fetch prompt templates
   */
  const fetchPromptTemplates = useCallback(async () => {
    if (promptTemplatesFetchedRef.current || promptTemplatesLoading) return;
    
    setPromptTemplatesLoading(true);
    try {
      const base = getBackendUrl() || '';
      const normalizedBase = base.replace(/\/+$/, '');
      
      // Get auth token from localStorage (matching api.js interceptor pattern)
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      
      const headers = {};
      // Include Authorization header if token exists (required for backend to get user email)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${normalizedBase}/api/prompt-templates?limit=200`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch prompt templates: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.templates) {
        setPromptTemplates(data.templates || []);
        promptTemplatesFetchedRef.current = true;
      }
    } catch (error) {
      console.error('Error fetching prompt templates:', error);
    } finally {
      setPromptTemplatesLoading(false);
    }
  }, [promptTemplatesLoading]);

  /**
   * Fetch AI models
   */
  const fetchAiModels = useCallback(async () => {
    if (aiModelsFetchedRef.current || aiModelsLoading) return;

    setAiModelsLoading(true);
    try {
      const base = getBackendUrl() || '';
      const normalizedBase = base.replace(/\/+$/, '');

      // Get auth token from localStorage (matching api.js interceptor pattern)
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');

      const headers = {};

      // Include Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${normalizedBase}/api/admin/ai-models`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch AI models: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.models) {
        setAiModels(data.models || []);
        aiModelsFetchedRef.current = true;
      }
    } catch (error) {
      console.error('Error fetching AI models:', error);
    } finally {
      setAiModelsLoading(false);
    }
  }, [aiModelsLoading]);

  /**
   * Fetch campaign IDs for exclusion
   */
  const fetchCampaignIds = useCallback(async () => {
    if (campaignIdsFetchedRef.current || campaignIdsLoading) return;

    setCampaignIdsLoading(true);
    try {
      const base = getBackendUrl() || '';
      const normalizedBase = base.replace(/\/+$/, '');

      // Get auth token from localStorage (matching api.js interceptor pattern)
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');

      const headers = {};

      // Include Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${normalizedBase}/api/campaign/ids`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch campaign IDs: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.campaign_ids) {
        setAvailableCampaignIds(data.campaign_ids || []);
        campaignIdsFetchedRef.current = true;
      }
    } catch (error) {
      console.error('Error fetching campaign IDs:', error);
    } finally {
      setCampaignIdsLoading(false);
    }
  }, [campaignIdsLoading]);

  // Fetch prompt templates, AI models, and campaign IDs when campaign modal opens
  useEffect(() => {
    if (showCampaignModal) {
      if (!promptTemplatesFetchedRef.current) {
        fetchPromptTemplates();
      }
      if (!aiModelsFetchedRef.current) {
        fetchAiModels();
      }
      if (!campaignIdsFetchedRef.current) {
        fetchCampaignIds();
      }
    }
  }, [showCampaignModal, fetchPromptTemplates, fetchAiModels, fetchCampaignIds]);

  // Compute ordered prompt templates and AI models
  const orderedPromptTemplates = useMemo(() => {
    const active = (promptTemplates || []).filter(tpl => tpl.isActive !== false);
    return [...active].sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
  }, [promptTemplates]);

  const orderedAiModels = useMemo(() => {
    const active = (aiModels || []).filter(model => model && model.status !== 'inactive');
    return [...active].sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
  }, [aiModels]);

  // Compute campaign task options from saved results
  // Also include the current task from TaskUsersModal if it's not already in savedResults
  const campaignTaskOptions = useMemo(() => {
    const options = (savedResults || []).map(task => ({
      taskId: task.taskId || task.task_id,
      hashtag: task.hashtag,
      status: task.status,
      totalUsers: task.totalUsers || task.total_users || null
    })).filter(option => option.taskId);
    
    // If there's a current task from TaskUsersModal and it's not in the options, add it
    if (taskUsersTaskId && !taskUsersIsTenantWide) {
      const currentTaskExists = options.some(opt => opt.taskId === taskUsersTaskId);
      if (!currentTaskExists) {
        options.unshift({
          taskId: taskUsersTaskId,
          hashtag: taskUsersTaskHashtag || null,
          status: 'unknown', // We don't know the status if it's not in savedResults
          totalUsers: null
        });
      }
    }
    
    return options;
  }, [savedResults, taskUsersTaskId, taskUsersTaskHashtag, taskUsersIsTenantWide]);

  /**
   * Open Users with Emails Modal
   */
  const openUsersWithEmailsModal = useCallback((users) => {
    // Clear tenant users cache immediately when opening modal for consistent loading
    if (users?.clearTenantUsersCache) {
      users.clearTenantUsersCache();
    }
    setShowUsersWithEmailsModal(true);
  }, []);

  /**
   * Close Users with Emails Modal
   */
  const closeUsersWithEmailsModal = useCallback(() => {
    setShowUsersWithEmailsModal(false);
  }, []);

  /**
   * Open Total Records Modal
   */
  const openTotalRecordsModal = useCallback(() => {
    setShowTotalRecordsModal(true);
  }, []);

  /**
   * Close Total Records Modal
   */
  const closeTotalRecordsModal = useCallback(() => {
    setShowTotalRecordsModal(false);
  }, []);

  /**
   * Open Task Users Modal
   */
  const openTaskUsersModal = useCallback((taskId, e, isTenantWide = false, taskHashtag = null) => {
    e?.stopPropagation?.();
    
    // Cancel any ongoing fetch
    if (taskUsersAbortControllerRef.current) {
      taskUsersAbortControllerRef.current.abort();
      taskUsersAbortControllerRef.current = null;
    }
    
    // Reset all state
    setTaskUsersTaskHashtag(isTenantWide ? null : (typeof taskHashtag === 'string' ? taskHashtag.replace(/^#/, '') : null));
    
    // Set task ID (null for tenant-wide) and mode, then open modal
    setTaskUsersTaskId(isTenantWide ? null : taskId);
    setTaskUsersIsTenantWide(isTenantWide);
    setShowTaskUsersModal(true);
  }, []);

  /**
   * Close Task Users Modal
   */
  const closeTaskUsersModal = useCallback(() => {
    // Reset fetch tracking refs
    promptTemplatesFetchedRef.current = false;
    mediafyConfigsFetchedRef.current = false;
    aiModelsFetchedRef.current = false;
    campaignIdsFetchedRef.current = false;

    // Cancel any ongoing fetch
    if (taskUsersAbortControllerRef.current) {
      taskUsersAbortControllerRef.current.abort();
      taskUsersAbortControllerRef.current = null;
    }

    setShowTaskUsersModal(false);
    setTaskUsersTaskId(null);
    setTaskUsersTaskHashtag(null);
    setTaskUsersIsTenantWide(false);
  }, []);

  /**
   * Close Task View Modal
   */
  const closeTaskViewModal = useCallback(() => {
    setShowTaskViewModal(false);
    setTaskViewLoading(false);
    // Clear modal state
    setModalSelectedResult(null);
    setModalSummary(null);
    setModalExtractedItems([]);
    setModalRecordsLoading(false);
    setModalRecordsPageIndex(0);
    setModalRecordsKeyStack([null]);
    setModalRecordsNextKey(null);
  }, []);

  /**
   * Load task for modal view
   */
  const loadTaskForModal = async (taskId) => {
    try {
      setTaskViewLoading(true);
      const base = getBackendUrl() || '';
      const normalizedBase = base.replace(/\/+$/, '');
      
      // Load task meta
      const taskResp = await fetch(`${normalizedBase}/api/admin/tasks/${taskId}`, {
        headers: { ...getAuthHeaders() }
      });

      if (!taskResp.ok) {
        let errorMessage = 'Failed to load task details';
        try {
          const contentType = taskResp.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const jsonError = await taskResp.json();
            errorMessage = jsonError.message || jsonError.error || errorMessage;
            if (typeof errorMessage === 'object') {
              errorMessage = JSON.stringify(errorMessage);
            }
          } else {
            const errorText = await taskResp.text().catch(() => errorMessage);
            errorMessage = errorText || errorMessage;
          }
        } catch {
          errorMessage = 'Failed to load task details. Please try again.';
        }
        throw new Error(errorMessage);
      }

      const taskJson = await taskResp.json();
      const task = taskJson.task || {};
      setModalSelectedResult({ taskId, created_at: task.created_at, hashtag: task.hashtag });
      setModalSummary(task.summary || null);

      // Reset pagination state and load first page
      setModalRecordsKeyStack([null]);
      setModalRecordsPageIndex(0);
      await fetchTaskRecordsForModal(taskId, null, 100);

    } catch (error) {
      console.error('Error loading task for modal:', error);
      throw error;
    } finally {
      setTaskViewLoading(false);
    }
  };

  /**
   * Open Task View Modal
   */
  const openTaskViewModal = useCallback(async (taskId) => {
    try {
      setShowTaskViewModal(true);
      await loadTaskForModal(taskId);
    } catch (error) {
      console.error('Error opening task view modal:', error);
      setShowTaskViewModal(false);
      // Could add user notification here if needed
    }
  }, []);

  /**
   * Fetch task records for modal
   */
  const fetchTaskRecordsForModal = async (taskId, startKey, pageSize) => {
    if (!taskId) return;

    setModalRecordsLoading(true);

    try {
      const base = getBackendUrl() || '';
      const normalizedBase = base.replace(/\/+$/, '');
      const params = new URLSearchParams({
        task_id: taskId,
        limit: String(pageSize)
      });

      if (startKey) {
        params.set('lastKey', startKey);
      }

      const response = await fetch(`${normalizedBase}/api/admin/tasks/records/list?${params}`, {
        headers: { ...getAuthHeaders() }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch records: ${response.status}`);
      }

      const data = await response.json();

      // Update modal state
      setModalExtractedItems(data.items || []);
      setModalRecordsNextKey(data.lastKey || null);

    } catch (error) {
      console.error('Error fetching records for modal:', error);
      throw error;
    } finally {
      setModalRecordsLoading(false);
    }
  };

  /**
   * Handle modal next records page
   */
  const handleModalNextRecordsPage = async () => {
    if (!modalSelectedResult?.taskId || !modalRecordsNextKey) return;
    const nextStartKey = modalRecordsNextKey;
    const newIndex = modalRecordsPageIndex + 1;
    setModalRecordsKeyStack(prev => [...prev, nextStartKey]);
    setModalRecordsPageIndex(newIndex);
    await fetchTaskRecordsForModal(modalSelectedResult.taskId, nextStartKey, 100);
  };

  /**
   * Handle modal prev records page
   */
  const handleModalPrevRecordsPage = async () => {
    if (!modalSelectedResult?.taskId) return;
    if (modalRecordsPageIndex === 0) return;
    const newIndex = modalRecordsPageIndex - 1;
    const prevStartKey = modalRecordsKeyStack[newIndex] || null;
    // Trim forward history when going back
    setModalRecordsKeyStack(prev => prev.slice(0, newIndex + 1));
    setModalRecordsPageIndex(newIndex);
    await fetchTaskRecordsForModal(modalSelectedResult.taskId, prevStartKey, 100);
  };

  /**
   * Handle send to campaign
   */
  const handleSendToCampaign = useCallback((taskId, orderedAiModels) => {
    if (!taskId) {
      alert('No task selected');
      return;
    }
    
    // Prefer openai/gpt-oss-20b as the campaign model
    const DEFAULT_CAMPAIGN_GPT_MODEL_ID = 'openai/gpt-oss-20b';
    const DEFAULT_CAMPAIGN_GPT_MODEL_MATCHERS = ['openai/gpt-oss-20b', 'gpt-oss-20b', 'gptoss20b', 'oss-20b', '20b'];
    const normalizeModelKey = (value = '') => value.toString().toLowerCase().replace(/\s+/g, '-');
    
    const normalizedDefault = normalizeModelKey(DEFAULT_CAMPAIGN_GPT_MODEL_ID);
    const match = orderedAiModels?.find((model) => {
      if (!model) return false;
      const normalizedId = normalizeModelKey(model.id || '');
      const normalizedName = normalizeModelKey(model.name || '');
      const combined = `${normalizedId} ${normalizedName}`.trim();
      if (!combined) {
        return normalizedId === normalizedDefault;
      }
      return (
        normalizedId === normalizedDefault ||
        DEFAULT_CAMPAIGN_GPT_MODEL_MATCHERS.some((matcher) => combined.includes(matcher))
      );
    });

    const defaultModelId = match?.id || DEFAULT_CAMPAIGN_GPT_MODEL_ID;
    
    if (match) {
      console.log('✅ Default GPT model set to:', match.name, '(', match.id, ')');
    } else if (orderedAiModels?.length) {
      console.warn(
        `ℹ️ Default GPT model ${DEFAULT_CAMPAIGN_GPT_MODEL_ID} not found in ai-models. Available models:`,
        orderedAiModels.map((m) => ({ name: m?.name, id: m?.id }))
      );
    }

    // Ensure tenant-wide mode is disabled for task-based campaigns
    setIsTenantWideCampaign(false);
    
    // Set all form state first, then open modal in a transition to prevent glitching
    setCampaignName('');
    setCampaignPromptTemplateId('');
    // Pre-select the current task ID, but allow user to select additional tasks
    setCampaignTaskIds(taskId ? [taskId] : []);
    setCampaignRequirePublicEmail(false);
    setCampaignJsonFormat(false);
    setCampaignGptModel(defaultModelId);
    
    // Use startTransition to mark modal opening as non-urgent, preventing glitches
    startTransition(() => {
      setShowCampaignModal(true);
    });
  }, []);

  /**
   * Handle send tenant-wide users to campaign (from UsersWithEmailsModal)
   * Opens campaign modal in tenant-wide mode with limit functionality
   */
  const handleSendTenantUsersToCampaign = useCallback((totalUsersCount, orderedAiModels) => {
    // Prefer openai/gpt-oss-20b as the campaign model
    const DEFAULT_CAMPAIGN_GPT_MODEL_ID = 'openai/gpt-oss-20b';
    const DEFAULT_CAMPAIGN_GPT_MODEL_MATCHERS = ['openai/gpt-oss-20b', 'gpt-oss-20b', 'gptoss20b', 'oss-20b', '20b'];
    const normalizeModelKey = (value = '') => value.toString().toLowerCase().replace(/\s+/g, '-');
    
    const normalizedDefault = normalizeModelKey(DEFAULT_CAMPAIGN_GPT_MODEL_ID);
    const match = orderedAiModels?.find((model) => {
      if (!model) return false;
      const normalizedId = normalizeModelKey(model.id || '');
      const normalizedName = normalizeModelKey(model.name || '');
      const combined = `${normalizedId} ${normalizedName}`.trim();
      if (!combined) {
        return normalizedId === normalizedDefault;
      }
      return (
        normalizedId === normalizedDefault ||
        DEFAULT_CAMPAIGN_GPT_MODEL_MATCHERS.some((matcher) => combined.includes(matcher))
      );
    });

    const defaultModelId = match?.id || DEFAULT_CAMPAIGN_GPT_MODEL_ID;
    
    if (match) {
      console.log('✅ Default GPT model set to:', match.name, '(', match.id, ')');
    } else if (orderedAiModels?.length) {
      console.warn(
        `ℹ️ Default GPT model ${DEFAULT_CAMPAIGN_GPT_MODEL_ID} not found in ai-models. Available models:`,
        orderedAiModels.map((m) => ({ name: m?.name, id: m?.id }))
      );
    }

    // Set tenant-wide mode and default limit
    setIsTenantWideCampaign(true);
    setTenantTotalUsersWithEmails(totalUsersCount || 0);
    setCampaignUserLimit(Math.min(100, totalUsersCount || 100)); // Default to 100 or total if less
    
    // Set all form state first, then open modal in a transition to prevent glitching
    setCampaignName('');
    setCampaignPromptTemplateId('');
    setCampaignTaskIds([]); // No task IDs for tenant-wide
    setCampaignRequirePublicEmail(true); // Always true for tenant-wide (users already have emails)
    setCampaignJsonFormat(false);
    setCampaignGptModel(defaultModelId);
    
    // Use startTransition to mark modal opening as non-urgent, preventing glitches
    startTransition(() => {
      setShowCampaignModal(true);
    });
  }, []);

  /**
   * Normalize GPT model ID to ensure it has the correct prefix
   * Handles various formats:
   * - "openaigpt-oss-120b" -> "openai/gpt-oss-120b"
   * - "gpt-oss-120b" -> "openai/gpt-oss-120b"
   * - "openai/gpt-oss-120b" -> "openai/gpt-oss-120b" (already correct)
   */
  const normalizeGptModelId = useCallback((modelId) => {
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
  }, []);

  /**
   * Build followers filter object for payload
   */
  const buildFollowersFilter = useCallback(() => {
    const min = parseInt(campaignFollowersMin, 10);
    const max = parseInt(campaignFollowersMax, 10);

    if (isNaN(min) && isNaN(max)) {
      return null; // No followers filter
    }

    const filter = {};

    if (!isNaN(min) && min >= 0) {
      filter.$gte = min;
    }

    if (!isNaN(max) && max >= 0) {
      filter.$lte = max;
    }

    // Validate that min <= max if both are provided
    if (filter.$gte !== undefined && filter.$lte !== undefined && filter.$gte > filter.$lte) {
      alert('Minimum followers cannot be greater than maximum followers');
      return null;
    }

    return Object.keys(filter).length > 0 ? { fol_cnt: filter } : null;
  }, [campaignFollowersMin, campaignFollowersMax]);

  /**
   * Handle confirm send to campaign
   */
  const handleConfirmSendToCampaign = useCallback(async () => {
    const effectiveTaskIds = campaignTaskIds.length > 0 ? campaignTaskIds : [];
    if (!campaignName || !campaignName.trim()) {
      alert('Please enter a campaign name');
      return;
    }

    if (!campaignPromptTemplateId || !campaignGptModel) {
      alert('Please select both a prompt template and GPT model');
      return;
    }

    // For non-tenant-wide mode, require at least one task
    if (!isTenantWideCampaign && effectiveTaskIds.length === 0) {
      alert('Select at least one task to sync');
      return;
    }

    // For tenant-wide mode, validate user limit
    if (isTenantWideCampaign && (!campaignUserLimit || campaignUserLimit < 1)) {
      alert('Please enter a valid user limit (minimum 1)');
      return;
    }

    setSendingToCampaign(true);
    try {
      const base = getBackendUrl() || '';
      const normalizedBase = base.replace(/\/+$/, '');
      
      // Normalize the GPT model ID to ensure it has the correct prefix
      const normalizedGptModel = normalizeGptModelId(campaignGptModel);
      
      let payload;
      let endpoint;
      
      if (isTenantWideCampaign) {
        // Tenant-wide campaign: send users from unique-users collection
        endpoint = `${normalizedBase}/api/campaign/send-tenant-users/durable`;
        payload = {
          campaign_name: campaignName.trim(),
          prompt_template_id: campaignPromptTemplateId,
          gpt_model: normalizedGptModel,
          user_limit: campaignUserLimit,
          tenant_email: user?.email,
          json_format: !!campaignJsonFormat,
        };

        // Build filters object
        const filters = {};

        // Include followers filter if specified
        const followersFilter = buildFollowersFilter();
        if (followersFilter) {
          Object.assign(filters, followersFilter);
        }

        // Set filters if any exist
        if (Object.keys(filters).length > 0) {
          payload.filters = filters;
        }

        // Include excluded campaign IDs if any are selected
        if (excludedCampaignIds.length > 0) {
          payload.excluded_campaign_ids = excludedCampaignIds;
        }
      } else {
        // Task-based campaign
        endpoint = `${normalizedBase}/api/campaign/send-users/durable`;
        payload = {
          campaign_name: campaignName.trim(),
          task_ids: effectiveTaskIds,
          prompt_template_id: campaignPromptTemplateId,
          gpt_model: normalizedGptModel,
          json_format: !!campaignJsonFormat,
        };

        // Build filters object
        const filters = {};

        // Include public email filter if required
        if (campaignRequirePublicEmail) {
          filters.has_public_email = true;
        }

        // Include followers filter if specified
        const followersFilter = buildFollowersFilter();
        if (followersFilter) {
          Object.assign(filters, followersFilter);
        }

        // Set filters if any exist
        if (Object.keys(filters).length > 0) {
          payload.filters = filters;
        }

        // Include tenant email if available
        if (user?.email) {
          payload.tenant_email = user.email;
        }

        // Include excluded campaign IDs if any are selected
        if (excludedCampaignIds.length > 0) {
          payload.excluded_campaign_ids = excludedCampaignIds;
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to send users to campaign');
      }

      const result = await response.json();
      if (result.success) {
        const instanceMessage = result.instance_id
          ? `Durable campaign sync started (instance ${result.instance_id}).`
          : 'Durable campaign sync started.';
        const userCountMessage = isTenantWideCampaign 
          ? `\nSending up to ${campaignUserLimit} users from your tenant.`
          : '';
        alert(`${instanceMessage}${userCountMessage}\nTrack progress in Active Durable Functions.`);
        setShowCampaignModal(false);
        setCampaignName('');
        setCampaignPromptTemplateId('');
        setCampaignGptModel('openai/gpt-oss-20b');
        setCampaignTaskIds([]);
        setCampaignRequirePublicEmail(false);
        setCampaignJsonFormat(false);
        setCampaignFollowersMin('');
        setCampaignFollowersMax('');
        setIsTenantWideCampaign(false);
        setCampaignUserLimit(100);
        setTenantTotalUsersWithEmails(0);
        setExcludedCampaignIds([]);
      } else {
        throw new Error(result.message || result.error || 'Failed to send users to campaign');
      }
    } catch (error) {
      console.error('Error sending to campaign:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSendingToCampaign(false);
    }
  }, [campaignName, campaignPromptTemplateId, campaignGptModel, campaignTaskIds, campaignRequirePublicEmail, campaignJsonFormat, user, normalizeGptModelId, isTenantWideCampaign, campaignUserLimit, excludedCampaignIds]);

  // Return controller interface (similar to backend controller exports)
  return {
    // Modal visibility states
    showUsersWithEmailsModal,
    showTaskUsersModal,
    showTaskViewModal,
    showCampaignModal,
    showSessionModal,
    showTotalRecordsModal,
    
    // Task Users Modal state
    taskUsersTaskId,
    taskUsersTaskHashtag,
    taskUsersIsTenantWide,
    
    // Task View Modal state
    taskViewLoading,
    modalSelectedResult,
    modalSummary,
    modalExtractedItems,
    modalRecordsLoading,
    modalRecordsPageIndex,
    modalRecordsNextKey,
    
    // Campaign Modal state
    campaignName,
    setCampaignName,
    campaignPromptTemplateId,
    setCampaignPromptTemplateId,
    campaignGptModel,
    setCampaignGptModel,
    campaignTaskIds,
    setCampaignTaskIds,
    campaignRequirePublicEmail,
    setCampaignRequirePublicEmail,
    campaignJsonFormat,
    setCampaignJsonFormat,
    sendingToCampaign,
    campaignTaskOptions,
    orderedPromptTemplates,
    orderedAiModels,
    promptTemplatesLoading,
    aiModelsLoading,

    // Campaign exclusion state
    excludedCampaignIds,
    setExcludedCampaignIds,
    availableCampaignIds,
    campaignIdsLoading,
    
    // Tenant-wide campaign state
    isTenantWideCampaign,
    setIsTenantWideCampaign,
    campaignUserLimit,
    setCampaignUserLimit,
    tenantTotalUsersWithEmails,

    // Followers filter state
    campaignFollowersMin,
    setCampaignFollowersMin,
    campaignFollowersMax,
    setCampaignFollowersMax,
    
    // Session Modal state
    sessionName,
    setSessionName,
    pendingTaskId,
    setPendingTaskId,
    pendingUserIds,
    setPendingUserIds,
    creatingSession,
    setCreatingSession,
    
    // Actions
    openUsersWithEmailsModal,
    closeUsersWithEmailsModal,
    openTotalRecordsModal,
    closeTotalRecordsModal,
    openTaskUsersModal,
    closeTaskUsersModal,
    openTaskViewModal,
    closeTaskViewModal,
    loadTaskForModal,
    fetchTaskRecordsForModal,
    handleModalNextRecordsPage,
    handleModalPrevRecordsPage,
    handleSendToCampaign,
    handleSendTenantUsersToCampaign,
    handleConfirmSendToCampaign,
    
    // Setters
    setShowTaskViewModal,
    setShowCampaignModal,
    setShowSessionModal
  };
};

