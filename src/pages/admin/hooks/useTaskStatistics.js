import { useState, useEffect, useRef } from 'react';
import { createTimeoutSignal } from '../../../utils/timeoutSignal';

const getApiBaseUrl = () => (import.meta.env.VITE_API_URL || '').trim();
const getSessionToken = () => (localStorage.getItem('sessionToken') || localStorage.getItem('token') || '').trim();

export function useTaskStatistics(user) {
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
  const [usersWithEmailsCount, setUsersWithEmailsCount] = useState(null);
  const [loadingUsersWithEmails, setLoadingUsersWithEmails] = useState(false);
  const [showGreenUsersWithEmails, setShowGreenUsersWithEmails] = useState(false);
  const previousUsersWithEmailsCountRef = useRef(null);
  const greenTimeoutRef = useRef(null);

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

  const fetchUnifiedStatistics = async () => {
    if (!user?.email) return;

    const base = getApiBaseUrl();
    setLoadingUnifiedStatistics(true);

    try {
      const resp = await fetch(
        `${base}/api/admin/user-statistics?user_email=${encodeURIComponent(user.email)}`,
        {
          headers: getSessionToken() ? { Authorization: `Bearer ${getSessionToken()}` } : {},
          signal: createTimeoutSignal(35000)
        }
      );

      if (!resp.ok) {
        throw new Error('Failed to fetch unified statistics');
      }

      const json = await resp.json();
      if (json.success) {
        setUnifiedStatistics({
          totalTasks: json.totalTasks ?? 0,
          runningTasks: json.runningTasks ?? 0,
          completedTasks: json.completedTasks ?? 0,
          totalRecords: json.totalRecords ?? 0,
          totalUniqueUsers: json.totalUniqueUsers ?? 0,
          usersWithEmails: json.usersWithEmails ?? null,
          lastUpdated: json.lastUpdated || null
        });

        if (json.usersWithEmails !== undefined && json.usersWithEmails !== null) {
          updateUsersWithEmailsMetric(json.usersWithEmails);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching unified statistics:', err);
    } finally {
      setLoadingUnifiedStatistics(false);
    }
  };

  useEffect(() => {
    fetchUnifiedStatistics();
    const interval = setInterval(fetchUnifiedStatistics, 10000);
    return () => clearInterval(interval);
  }, [user?.email]);

  return {
    unifiedStatistics,
    loadingUnifiedStatistics,
    usersWithEmailsCount,
    loadingUsersWithEmails,
    showGreenUsersWithEmails,
    fetchUnifiedStatistics
  };
}

