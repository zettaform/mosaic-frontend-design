/**
 * Utils Controller
 * Utility functions for tasks page
 * Similar to backend utility functions - pure functions that can be imported
 */

/**
 * Get UNIX timestamp for consistent ordering
 * @param {string} dateString - ISO date string
 * @returns {number} UNIX timestamp
 */
export const getUnixTimestamp = (dateString) => {
  if (!dateString) return 0;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? 0 : Math.floor(date.getTime() / 1000);
};

/**
 * Ensure task has UNIX timestamp
 * @param {Object} task - Task object
 * @returns {Object} Task with UNIX timestamp
 */
export const ensureUnixTimestamp = (task) => {
  if (!task) return task;
  
  const unixTimestamp = task._unixTimestamp || getUnixTimestamp(task.created_at);
  return {
    ...task,
    _unixTimestamp: unixTimestamp,
    created_at: task.created_at || new Date(unixTimestamp * 1000).toISOString()
  };
};

/**
 * Format last updated timestamp
 * @param {string} isoString - ISO date string
 * @returns {string|null} Formatted date string
 */
export const formatLastUpdated = (isoString) => {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleString();
};

/**
 * Sanitize error messages - removes technical details
 * @param {string} message - Error message
 * @returns {string} Sanitized error message
 */
export const sanitizeErrorMessage = (message) => {
  if (!message) {
    return 'Failed to load data. Please try again or contact support if the issue persists.';
  }

  let messageStr = typeof message === 'string' ? message : String(message);

  // Try to parse JSON if it looks like JSON
  try {
    if (messageStr.trim().startsWith('{') || messageStr.trim().startsWith('[')) {
      const parsed = JSON.parse(messageStr);
      messageStr = parsed.message || parsed.error || parsed.details || parsed.status || messageStr;
      if (typeof messageStr !== 'string') {
        messageStr = JSON.stringify(messageStr);
      }
    }
  } catch {
    // Not JSON, continue with original string
  }

  // Remove all AWS/DynamoDB related terms
  let sanitized = messageStr
    .replace(/DynamoDB/gi, '')
    .replace(/AWS/gi, '')
    .replace(/aws/gi, '')
    .replace(/TableName/gi, '')
    .replace(/getDocClient/gi, '')
    .replace(/ResourceNotFoundException/gi, '')
    .replace(/@aws-sdk/gi, '')
    .replace(/aws-sdk/gi, '')
    .replace(/\{[\s\S]*"status"[\s\S]*\}/gi, '')
    .replace(/\{[\s\S]*"error"[\s\S]*\}/gi, '')
    .replace(/\{[\s\S]*"message"[\s\S]*\}/gi, '')
    .replace(/["{}[\]]/g, '')
    .trim();

  // Check if message contains technical details
  const technicalTerms = [
    'TableName', 'getDocClient', '@aws-sdk', 'aws-sdk', 'DynamoDB', 'AWS', 'aws',
    'ResourceNotFoundException', 'ValidationException', 'ProvisionedThroughput',
    'RequestLimitExceeded', 'ThrottlingException', 'ECONNREFUSED', 'ENOTFOUND'
  ];

  const containsTechnicalDetails = technicalTerms.some(term => 
    sanitized.toLowerCase().includes(term.toLowerCase())
  );

  if (!sanitized || sanitized.length > 200 || containsTechnicalDetails || sanitized.length < 10) {
    return 'Failed to load data. Please try again or contact support if the issue persists.';
  }

  return sanitized;
};

/**
 * Normalize model key for comparison
 * @param {string} value - Model key
 * @returns {string} Normalized key
 */
export const normalizeModelKey = (value = '') => {
  return value.toString().toLowerCase().replace(/\s+/g, '-');
};

/**
 * Resolve default campaign model
 * @param {Array} models - Available models
 * @returns {Object} Default model info
 */
export const resolveDefaultCampaignModel = (models = []) => {
  const DEFAULT_CAMPAIGN_GPT_MODEL_ID = 'openai/gpt-oss-20b';
  const DEFAULT_CAMPAIGN_GPT_MODEL_MATCHERS = [
    'openai/gpt-oss-20b', 
    'gpt-oss-20b', 
    'gptoss20b', 
    'oss-20b', 
    '20b'
  ];
  
  const normalizedDefault = normalizeModelKey(DEFAULT_CAMPAIGN_GPT_MODEL_ID);
  const match = models.find((model) => {
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

  return {
    id: match?.id || DEFAULT_CAMPAIGN_GPT_MODEL_ID,
    match
  };
};

/**
 * Get API base URL
 * @returns {string} Normalized base URL
 */
export const getApiBaseUrl = () => {
  const { getBackendUrl } = require('../../../utils/getBackendUrl');
  const backendBase = getBackendUrl() || '';
  return backendBase.replace(/\/+$/, '');
};

/**
 * Log task order for debugging
 * @param {Array} tasks - Tasks array
 * @param {string} context - Context description
 */
export const logTaskOrder = (tasks, context) => {
  console.log(`🕐 ${context}:`, tasks.map(task => ({
    id: task.task_id?.substring(0, 8),
    unix: task._unixTimestamp,
    status: task.status
  })));
};

