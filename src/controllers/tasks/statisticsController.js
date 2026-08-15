import { useState, useEffect, useRef } from 'react';
import { getBackendUrl } from '../../utils/getBackendUrl';
import { createTimeoutSignal } from '../../utils/timeoutSignal';

function getAuthHeaders() {
  const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Statistics Controller
 * Handles all statistics-related operations including fetching and polling
 * Similar to backend controller pattern - exports functions that can be called
 */
export const useStatisticsController = (user) => {
  // State for unified statistics (all 5 stats from one endpoint)
  const [unifiedStatistics, setUnifiedStatistics] = useState({
    totalTasks: 0,
    runningTasks: 0,
    completedTasks: 0,
    totalRecords: 0,
    totalUniqueUsers: 0,
    usersWithEmails: null,
    lastUpdated: null
  });
  
  const [loadingUnifiedStatistics, setLoadingUnifiedStatistics] = useState(false);
  const [userStatsLastUpdated, setUserStatsLastUpdated] = useState(null);
  
  // State for users with emails count
  const [usersWithEmailsCount, setUsersWithEmailsCount] = useState(null);
  const [loadingUsersWithEmails, setLoadingUsersWithEmails] = useState(false);
  const [showGreenUsersWithEmails, setShowGreenUsersWithEmails] = useState(false);
  
  // Refs for previous values
  const previousUsersWithEmailsCountRef = useRef(null);
  const greenTimeoutRef = useRef(null);
  
  /**
   * Update users with emails metric with green highlight animation
   */
  const updateUsersWithEmailsMetric = (count) => {
    let numericCount = null;
    if (count !== null && count !== undefined) {
      const parsed = Number(count);
      numericCount = Number.isNaN(parsed) ? null : parsed;
    }

    const previousCount = previousUsersWithEmailsCountRef.current;
    if (
      previousCount !== null &&
      numericCount !== null &&
      numericCount > previousCount
    ) {
      setShowGreenUsersWithEmails(true);
      if (greenTimeoutRef.current) {
        clearTimeout(greenTimeoutRef.current);
      }
      greenTimeoutRef.current = setTimeout(() => {
        setShowGreenUsersWithEmails(false);
        greenTimeoutRef.current = null;
      }, 2000);
    }

    previousUsersWithEmailsCountRef.current = numericCount;
    setUsersWithEmailsCount(numericCount);
  };

  /**
   * Fetch unified statistics (all 5 stats in one call)
   * Similar to backend controller function pattern
   */
  const fetchUnifiedStatistics = async () => {
    if (!user?.email) {
      console.log('⚠️ No user email, skipping unified statistics fetch');
      setUserStatsLastUpdated(null);
      previousUsersWithEmailsCountRef.current = null;
      setUsersWithEmailsCount(null);
      setShowGreenUsersWithEmails(false);
      return;
    }
    
    console.log('✅ User email found:', user.email);
    setLoadingUnifiedStatistics(true);
    setLoadingUsersWithEmails(true);
    
    try {
      const base = getBackendUrl() || '';
      const normalizedBase = base.replace(/\/+$/, '');
      const userEmail = encodeURIComponent(user.email);
      const url = `${normalizedBase}/api/admin/tasks/user-statistics?user_email=${userEmail}`;
      console.log('🔍 Fetching user statistics from:', url);
      
      const resp = await fetch(url, {
        headers: { ...getAuthHeaders() },
        signal: createTimeoutSignal(30000), // 30 second timeout for large scans
      });
      
      console.log('📡 Response status:', resp.status, resp.statusText);
      
      if (resp.ok) {
        const json = await resp.json();
        console.log('📊 User statistics response:', json);
        
        if (json.success) {
          // Handle both nested (json.statistics) and flat (top-level) response structures
          const stats = json.statistics || json;
          console.log('📊 Extracted stats object:', stats);
          console.log('📊 Stats keys:', Object.keys(stats));
          
          const statisticsData = {
            totalTasks: Number(stats.totalTasks) || 0,
            runningTasks: Number(stats.runningTasks) || 0,
            completedTasks: Number(stats.completedTasks) || 0,
            totalRecords: Number(stats.totalRecords) || 0,
            totalUniqueUsers: Number(stats.totalUniqueUsers) || 0,
            usersWithEmails: stats.usersWithEmails !== undefined && stats.usersWithEmails !== null 
              ? Number(stats.usersWithEmails) 
              : null,
            lastUpdated: json.lastUpdated ?? null
          };
          
          console.log('📊 Setting unified statistics:', statisticsData);
          setUnifiedStatistics(statisticsData);
          setUserStatsLastUpdated(json.lastUpdated ?? null);
          updateUsersWithEmailsMetric(stats.usersWithEmails);
          console.log('✅ User statistics updated successfully');
        } else {
          console.warn('⚠️ Response not successful:', json);
          updateUsersWithEmailsMetric(null);
        }
      } else {
        const errorText = await resp.text();
        console.warn('❌ Failed to fetch user statistics:', resp.status, errorText);
        updateUsersWithEmailsMetric(null);
      }
    } catch (error) {
      console.error('❌ Error fetching user statistics:', error);
      updateUsersWithEmailsMetric(null);
    } finally {
      setLoadingUnifiedStatistics(false);
      setLoadingUsersWithEmails(false);
    }
  };

  /**
   * Calculate overall statistics from unified API response
   */
  const calculateOverallStats = () => {
    return {
      totalTasks: unifiedStatistics.totalTasks ?? 0,
      runningTasks: unifiedStatistics.runningTasks ?? 0,
      completedTasks: unifiedStatistics.completedTasks ?? 0,
      totalRecords: unifiedStatistics.totalRecords ?? 0,
      totalUniqueUsers: unifiedStatistics.totalUniqueUsers ?? 0,
      usersWithEmails: unifiedStatistics.usersWithEmails ?? null,
      lastUpdated: userStatsLastUpdated ?? unifiedStatistics.lastUpdated ?? null
    };
  };

  // Fetch statistics on mount and set up polling
  useEffect(() => {
    fetchUnifiedStatistics();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnifiedStatistics, 30000);
    return () => clearInterval(interval);
  }, [user?.email]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (greenTimeoutRef.current) {
        clearTimeout(greenTimeoutRef.current);
        greenTimeoutRef.current = null;
      }
    };
  }, []);

  // Reset when user changes
  useEffect(() => {
    previousUsersWithEmailsCountRef.current = null;
    setShowGreenUsersWithEmails(false);
  }, [user?.email]);

  // Return controller interface (similar to backend controller exports)
  return {
    // State
    statistics: unifiedStatistics,
    loading: loadingUnifiedStatistics,
    userStatsLastUpdated,
    usersWithEmailsCount,
    loadingUsersWithEmails,
    showGreenUsersWithEmails,
    
    // Computed
    overallStats: calculateOverallStats(),
    
    // Actions
    refresh: fetchUnifiedStatistics
  };
};

