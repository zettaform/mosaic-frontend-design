import { useState } from 'react';
import { getBackendUrl } from '../../utils/getBackendUrl';
import { createTimeoutSignal } from '../../utils/timeoutSignal';

function getAuthHeaders() {
  const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Collection Controller
 * Handles new collection form and submission
 * Similar to backend controller pattern - exports functions that can be called
 *
 * @param {Object} user - User object with email property
 */
export const useCollectionController = (user) => {
  const [hashtag, setHashtag] = useState('summer');
  const [targetCount, setTargetCount] = useState(100);
  const [paginationToken, setPaginationToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [extractedItems, setExtractedItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [lastRequestUrl, setLastRequestUrl] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ 
    current: 0, 
    target: 0, 
    phase: '',
    call_number: null,
    new_items: null
  });
  const [retryStatus, setRetryStatus] = useState(null);
  const [animatedRows, setAnimatedRows] = useState([]);

  /**
   * Trigger hashtag collection (synchronous)
   */
  const triggerFetch = async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!hashtag.trim()) {
      setError('Please enter a hashtag');
      return;
    }

    if (targetCount > 5000) {
      setError('Target count cannot exceed 5000');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setExtractedItems([]);
    setSummary(null);
    setAnimatedRows([]);
    setProgress({ current: 0, target: targetCount, phase: 'Initializing...' });

    try {
      const base = getBackendUrl() || '';
      const normalizedBase = base.replace(/\/+$/, '');
      const url = `${normalizedBase}/api/hashtag/collect?hashtag=${encodeURIComponent(hashtag)}&target_count=${targetCount}`;
      setLastRequestUrl(url);

      const response = await fetch(url, {
        headers: { ...getAuthHeaders() },
        signal: createTimeoutSignal(300000), // 5 minute timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
        setExtractedItems(data.items || []);
        setSummary(data.summary || null);
        
        // Trigger animation for all rows
        if (data.items && data.items.length > 0) {
          setAnimatedRows(data.items.map((_, i) => i));
        }
      } else {
        throw new Error(data.message || 'Collection failed');
      }
    } catch (err) {
      console.error('Error triggering fetch:', err);
      setError(err.message || 'Failed to collect hashtag data');
    } finally {
      setLoading(false);
      setProgress({ current: 0, target: 0, phase: '' });
    }
  };

  /**
   * Start background task (asynchronous)
   */
  const startBackgroundTask = async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!hashtag.trim()) {
      setError('Please enter a hashtag');
      return;
    }

    if (targetCount > 5000) {
      setError('Target count cannot exceed 5000');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setProgress({ current: 0, target: targetCount, phase: 'Starting background task...' });

    try {
      const base = getBackendUrl() || '';
      const normalizedBase = base.replace(/\/+$/, '');
      const url = `${normalizedBase}/api/admin/tasks/background`;
      setLastRequestUrl(url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          hashtag: hashtag.trim(),
          target_count: targetCount,
          user_email: user?.email || null
        }),
        signal: createTimeoutSignal(30000),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to start task: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setResult({
          task_id: data.task_id,
          message: 'Background task started successfully',
          saved_file: data.saved_file || null
        });
        setProgress({ 
          current: 0, 
          target: targetCount, 
          phase: 'Task queued',
          call_number: null,
          new_items: null
        });
        
        // Show success message
        alert(`Background task started!\nTask ID: ${data.task_id}\n\nYou can monitor the progress in the Saved Results tab below.`);
      } else {
        throw new Error(data.message || data.error || 'Failed to start background task');
      }
    } catch (err) {
      console.error('Error starting background task:', err);
      setError(err.message || 'Failed to start background task');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send task to phases page
   */
  const sendTaskToPhases = async (taskId) => {
    if (!taskId) {
      setError('No task ID provided');
      return;
    }

    try {
      // Navigate to phases page with task ID
      window.location.href = `/admin/phases?task_id=${taskId}`;
    } catch (err) {
      console.error('Error navigating to phases:', err);
      setError('Failed to navigate to phases page');
    }
  };

  // Return controller interface (similar to backend controller exports)
  return {
    // State
    hashtag,
    setHashtag,
    targetCount,
    setTargetCount,
    paginationToken,
    setPaginationToken,
    loading,
    result,
    extractedItems,
    summary,
    lastRequestUrl,
    error,
    progress,
    retryStatus,
    setRetryStatus,
    animatedRows,
    
    // Actions
    triggerFetch,
    startBackgroundTask,
    sendTaskToPhases,
    
    // Setters for error handling
    setError
  };
};

