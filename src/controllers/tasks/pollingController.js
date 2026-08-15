import { useState, useEffect, useRef } from 'react';
import { getBackendUrl } from '../../utils/getBackendUrl';
import { createTimeoutSignal } from '../../utils/timeoutSignal';

function getAuthHeaders() {
  const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Polling Controller
 * Handles all background polling operations for tasks and statistics
 * 
 * @param {Array} savedResults - Current saved results array
 * @returns {Object} Controller interface with state and functions
 */
export const usePollingController = (savedResults = []) => {
  const [bgPolling, setBgPolling] = useState(false);
  const [bgTaskId, setBgTaskId] = useState(null);
  const [bgStatus, setBgStatus] = useState(null);
  const [liveUniqueUsersByTask, setLiveUniqueUsersByTask] = useState({});

  /**
   * Poll background task status
   * @param {string} taskId - Task ID to poll
   */
  const pollBackgroundStatus = async (taskId) => {
    if (!taskId) return;

    try {
      const base = getBackendUrl() || '';
      const normalizedBase = base.replace(/\/+$/, '');
      const response = await fetch(`${normalizedBase}/api/admin/tasks/${taskId}/status`, {
        headers: { ...getAuthHeaders() },
        signal: createTimeoutSignal(10000)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.task) {
          setBgStatus(data.task);
          
          // Update task in saved results if it exists
          if (data.task.status === 'completed' || data.task.status === 'failed' || data.task.status === 'cancelled') {
            setBgPolling(false);
            setBgTaskId(null);
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error polling background status:', err);
      }
    }
  };

  /**
   * Poll statistics for processing tasks
   */
  const pollProcessingTasksStats = async () => {
    // Filter tasks that are processing (status: 'running' or 'processing')
    const processingTasks = (savedResults || []).filter(task => 
      task?.task_id && (task.status === 'running' || task.status === 'processing')
    );

    if (processingTasks.length === 0) {
      return; // No processing tasks to poll
    }

    console.log(`📊 STATS POLLING: Polling unique users count for ${processingTasks.length} processing tasks (every 3 seconds)`);

    try {
      const base = getBackendUrl() || '';
      const normalizedBase = base.replace(/\/+$/, '');
      
      const statsPromises = processingTasks.map(async (task) => {
        try {
          const resp = await fetch(
            `${normalizedBase}/api/admin/tasks/${task.task_id}/stats`,
            {
              headers: { ...getAuthHeaders() },
              signal: createTimeoutSignal(5000)
            }
          );

          if (!resp.ok) {
            console.warn(`⚠️ STATS POLLING: Failed to get unique users for ${task.task_id}: ${resp.status}`);
            return null;
          }

          const json = await resp.json();
          if (json.success && json.stats) {
            return {
              task_id: task.task_id,
              unique_users: json.stats.unique_users,
              total_items: json.stats.total_items,
              total_calls: json.stats.total_calls
            };
          }
          return null;
        } catch (error) {
          console.warn(`⚠️ STATS POLLING: Error getting unique users for ${task.task_id}:`, error.message);
          return null;
        }
      });

      const statsResults = await Promise.allSettled(statsPromises);
      
      // Update live unique users by task
      const updates = {};
      statsResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          const stats = result.value;
          const taskId = stats.task_id;
          
          if (typeof stats.unique_users === 'number') {
            updates[taskId] = stats.unique_users;
          }
        }
      });

      if (Object.keys(updates).length > 0) {
        setLiveUniqueUsersByTask(prev => ({
          ...prev,
          ...updates
        }));
      }
    } catch (error) {
      console.error('Error polling processing tasks stats:', error);
    }
  };

  /**
   * Resume polling for running tasks after page refresh
   */
  const resumePollingForRunningTasks = async () => {
    try {
      const base = getBackendUrl() || '';
      const normalizedBase = base.replace(/\/+$/, '');
      const response = await fetch(`${normalizedBase}/api/admin/tasks?page=1&pageSize=100`, {
        headers: { ...getAuthHeaders() }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.tasks) {
          const runningTasks = data.tasks.filter(task => task.status === 'running');
          console.log(`🔄 RESUME: Found ${runningTasks.length} running tasks to resume polling`);
          
          if (runningTasks.length > 0) {
            setBgPolling(true);
            // Start polling for the first running task
            if (runningTasks[0]?.task_id) {
              setBgTaskId(runningTasks[0].task_id);
              pollBackgroundStatus(runningTasks[0].task_id);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ RESUME: Failed to resume polling for running tasks:', error);
    }
  };

  /**
   * Ensure running tasks are visible and being polled
   */
  const ensureRunningTasksVisible = async () => {
    try {
      const base = getBackendUrl() || '';
      const normalizedBase = base.replace(/\/+$/, '');
      const response = await fetch(`${normalizedBase}/api/admin/tasks?page=1&pageSize=100`, {
        headers: { ...getAuthHeaders() }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.tasks) {
          const runningTasks = data.tasks.filter(task => task.status === 'running');
          if (runningTasks.length > 0) {
            console.log(`🔄 ENSURE: Found ${runningTasks.length} running tasks, ensuring visibility`);
            
            if (!bgPolling && runningTasks[0]?.task_id) {
              setBgPolling(true);
              setBgTaskId(runningTasks[0].task_id);
              pollBackgroundStatus(runningTasks[0].task_id);
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ ENSURE: Failed to ensure running tasks visibility:', error);
    }
  };

  // Poll statistics for processing tasks (every 3 seconds)
  useEffect(() => {
    const interval = setInterval(pollProcessingTasksStats, 3000);
    
    // Poll immediately on mount or when savedResults change
    pollProcessingTasksStats();
    
    return () => clearInterval(interval);
  }, [savedResults]);

  // Periodic check for running tasks to ensure we don't lose track
  useEffect(() => {
    const checkRunningTasks = async () => {
      if (bgPolling) return; // Don't check if we're already polling
      
      try {
        const base = getBackendUrl() || '';
        const normalizedBase = base.replace(/\/+$/, '');
        const response = await fetch(`${normalizedBase}/api/admin/tasks?page=1&pageSize=100`, {
          headers: { ...getAuthHeaders() }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.tasks) {
            const runningTasks = data.tasks.filter(task => task.status === 'running');
            if (runningTasks.length > 0) {
              console.log(`🔄 PERIODIC: Found ${runningTasks.length} running tasks, resuming polling`);
              if (runningTasks[0]?.task_id) {
                setBgPolling(true);
                setBgTaskId(runningTasks[0].task_id);
                pollBackgroundStatus(runningTasks[0].task_id);
              }
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ PERIODIC: Failed to check for running tasks:', error);
      }
    };

    // Check every 30 seconds for running tasks
    const interval = setInterval(checkRunningTasks, 30000);
    return () => clearInterval(interval);
  }, [bgPolling]);

  // Poll background task if one is set
  useEffect(() => {
    if (bgPolling && bgTaskId) {
      const interval = setInterval(() => {
        pollBackgroundStatus(bgTaskId);
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [bgPolling, bgTaskId]);

  // Return controller interface
  return {
    // State
    bgPolling,
    bgTaskId,
    bgStatus,
    liveUniqueUsersByTask,
    
    // Actions
    pollBackgroundStatus,
    pollProcessingTasksStats,
    resumePollingForRunningTasks,
    ensureRunningTasksVisible,
    
    // Setters
    setBgPolling,
    setBgTaskId
  };
};

