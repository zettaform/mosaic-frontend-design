/**
 * Enterprise-grade resilient fetch utility with automatic retry, exponential backoff,
 * and connection health checking for handling network errors after inactivity.
 */

import { createTimeoutSignal } from './timeoutSignal';
import { getBackendUrl } from './getBackendUrl';

/**
 * Determines if an error is retryable
 */
const isRetryableError = (error) => {
  // Network errors (connection lost, timeout, etc.)
  if (error.name === 'AbortError' || 
      error.name === 'TypeError' ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('NetworkError') ||
      error.message?.includes('Network request failed') ||
      error.message?.includes('timeout') ||
      error.message?.includes('timed out')) {
    return true;
  }
  
  // HTTP errors that are retryable
  if (error.status) {
    // 5xx server errors
    if (error.status >= 500 && error.status < 600) {
      return true;
    }
    // 408 Request Timeout
    if (error.status === 408) {
      return true;
    }
    // 429 Too Many Requests
    if (error.status === 429) {
      return true;
    }
  }
  
  return false;
};

/**
 * Calculates exponential backoff delay with jitter
 */
const calculateBackoff = (attempt, baseDelay = 1000, maxDelay = 30000) => {
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // Add jitter (random 0-25% of delay) to prevent thundering herd
  const jitter = exponentialDelay * 0.25 * Math.random();
  return exponentialDelay + jitter;
};

/**
 * Checks if backend server is reachable
 */
const checkBackendHealth = async (baseUrl, timeout = 5000) => {
  try {
    const healthUrl = `${baseUrl}/api/health`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-cache',
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('🔍 Health check failed:', error.message);
    return false;
  }
};

/**
 * Resilient fetch with automatic retry, exponential backoff, and connection recovery
 * 
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} retryConfig - Retry configuration
 * @param {number} retryConfig.maxRetries - Maximum number of retries (default: 3)
 * @param {number} retryConfig.baseDelay - Base delay in ms for exponential backoff (default: 1000)
 * @param {number} retryConfig.maxDelay - Maximum delay in ms (default: 30000)
 * @param {number} retryConfig.timeout - Request timeout in ms (default: 30000)
 * @param {boolean} retryConfig.checkHealth - Whether to check backend health before retry (default: true)
 * @param {Function} retryConfig.onRetry - Callback called on each retry attempt
 * @returns {Promise<Response>} The fetch response
 */
export const resilientFetch = async (
  url,
  options = {},
  retryConfig = {}
) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    timeout = 30000,
    checkHealth = true,
    onRetry = null,
  } = retryConfig;

  const baseUrl = getBackendUrl();
  
  let lastError = null;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      // Create timeout signal
      const timeoutSignal = createTimeoutSignal(timeout);
      
      // Merge signals if abort signal is provided
      let finalSignal = timeoutSignal;
      if (options.signal) {
        // If both signals exist, create a combined signal
        const combinedController = new AbortController();
        const abort = () => combinedController.abort();
        
        if (timeoutSignal) {
          timeoutSignal.addEventListener('abort', abort, { once: true });
        }
        options.signal.addEventListener('abort', abort, { once: true });
        
        finalSignal = combinedController.signal;
      }

      // Make the fetch request
      const response = await fetch(url, {
        ...options,
        signal: finalSignal,
        cache: 'no-cache', // Prevent stale cache after inactivity
      });

      // Check if response is OK
      if (!response.ok) {
        // For non-2xx responses, check if retryable
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        
        if (isRetryableError(error) && attempt < maxRetries) {
          lastError = error;
          attempt++;
          
          // Call retry callback if provided
          if (onRetry) {
            onRetry(attempt, error, maxRetries);
          }
          
          // Calculate backoff delay
          const delay = calculateBackoff(attempt - 1, baseDelay, maxDelay);
          console.log(`🔄 Retry attempt ${attempt}/${maxRetries} after ${Math.round(delay)}ms for ${url}`);
          
          // Check backend health before retrying (if enabled)
          if (checkHealth && attempt > 1) {
            console.log('🔍 Checking backend health before retry...');
            const isHealthy = await checkBackendHealth(baseUrl, 5000);
            if (!isHealthy) {
              console.warn('⚠️ Backend health check failed, waiting longer before retry');
              await new Promise(resolve => setTimeout(resolve, delay * 2));
            } else {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          } else {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          continue;
        }
        
        // Not retryable or max retries reached
        throw error;
      }

      // Success - return response
      console.log(`✅ Request succeeded after ${attempt} ${attempt === 0 ? 'attempt' : 'retries'}: ${url}`);
      return response;

    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      if (isRetryableError(error) && attempt < maxRetries) {
        attempt++;
        
        // Call retry callback if provided
        if (onRetry) {
          onRetry(attempt, error, maxRetries);
        }
        
        // Calculate backoff delay
        const delay = calculateBackoff(attempt - 1, baseDelay, maxDelay);
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries} after ${Math.round(delay)}ms for ${url} (${error.message})`);
        
        // Check backend health before retrying (if enabled and not first retry)
        if (checkHealth && attempt > 1) {
          console.log('🔍 Checking backend health before retry...');
          try {
            const isHealthy = await checkBackendHealth(baseUrl, 5000);
            if (!isHealthy) {
              console.warn('⚠️ Backend health check failed, waiting longer before retry');
              await new Promise(resolve => setTimeout(resolve, delay * 2));
            } else {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          } catch (healthError) {
            console.warn('⚠️ Health check error, using standard backoff:', healthError.message);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } else {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        continue;
      }
      
      // Not retryable or max retries reached - throw error
      console.error(`❌ Request failed after ${attempt} ${attempt === 0 ? 'attempt' : 'retries'}: ${url}`, error);
      throw error;
    }
  }

  // Should never reach here, but just in case
  throw lastError || new Error('Request failed: Unknown error');
};

/**
 * Convenience wrapper for GET requests with resilient fetch
 */
export const resilientGet = async (url, options = {}, retryConfig = {}) => {
  return resilientFetch(url, {
    method: 'GET',
    ...options,
  }, retryConfig);
};

/**
 * Convenience wrapper for POST requests with resilient fetch
 */
export const resilientPost = async (url, body, options = {}, retryConfig = {}) => {
  return resilientFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
    ...options,
  }, retryConfig);
};

