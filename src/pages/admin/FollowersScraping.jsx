import React, { useState, useEffect } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';

function FollowersScraping() {
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [scrapingType, setScrapingType] = useState('followers'); // 'followers' or 'following'
  const [targetUser, setTargetUser] = useState('');
  const [targetCount, setTargetCount] = useState(500);
  const [isScraping, setIsScraping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  const [savedRecords, setSavedRecords] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState({});

  // Helper to group records by task (target_user + scraped_at)
  const getGroupedTasks = () => {
    const tasks = {};
    savedRecords.forEach(record => {
      const taskKey = `${record.target_user}_${record.scraped_at}`;
      if (!tasks[taskKey]) {
        tasks[taskKey] = {
          key: taskKey,
          target_user: record.target_user,
          scraped_at: record.scraped_at,
          followers: []
        };
      }
      tasks[taskKey].followers.push(record);
    });
    return Object.values(tasks).sort((a, b) => new Date(b.scraped_at) - new Date(a.scraped_at));
  };

  const toggleTaskExpansion = (taskKey) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskKey]: !prev[taskKey]
    }));
  };

  const exportTaskToCSV = (task) => {
    const isFollowers = scrapingType === 'followers';
    const typeLabel = isFollowers ? 'Follower ID' : 'Following ID';
    const headers = ['Target User', typeLabel, 'Username', 'Full Name', 'Is Private', 'Is Verified', 'Scraped At'];
    
    const csvContent = [
      headers.join(','),
      ...task.followers.map(r => [
        r.target_user || '',
        r.follower_id || '',
        (r.username || '').replace(/,/g, ''),
        (r.full_name || '').replace(/,/g, ''),
        r.is_private ? 'Yes' : 'No',
        r.is_verified ? 'Yes' : 'No',
        r.scraped_at || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${scrapingType}_${task.target_user}_task_${new Date(task.scraped_at).toISOString().replace(/[:.]/g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // RBAC Check
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  const routeInfo = ROUTE_TO_SECTION[currentPath];
  if (routeInfo) {
    const { section, page } = routeInfo;
    if (!hasAccess(user, section, page)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  const getApiBase = () => (import.meta.env.VITE_API_URL || '').trim();

  // Load saved records
  const loadSavedRecords = async () => {
    setIsLoadingRecords(true);
    try {
      const base = getApiBase();
      const url = `${base}/api/mediafy/${scrapingType}/saved${targetUser ? `?target_user=${encodeURIComponent(targetUser)}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionToken') || localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSavedRecords(data.followers || []);
        }
      }
    } catch (error) {
      console.error('Error loading saved records:', error);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  // Reload records when scrapingType changes
  useEffect(() => {
    loadSavedRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrapingType]);

  const handleStartScraping = async () => {
    if (!targetUser) {
      alert("Please enter a username or ID");
      return;
    }
    
    setIsScraping(true);
    setProgress(0);
    setStatusMessage(`Starting ${scrapingType} scrape...`);
    
    let allFollowers = [];
    let currentPaginationToken = '';
    let fetchedCount = 0;
    const isFollowers = scrapingType === 'followers';
    const typeLabelLabel = isFollowers ? 'followers' : 'following';
    
    try {
      const base = getApiBase();
      
      while (fetchedCount < targetCount) {
        setStatusMessage(`Fetching batch... (${fetchedCount}/${targetCount})`);
        
        const fetchAmount = 500;
        let url = `${base}/api/mediafy/${scrapingType}?username_or_id_or_url=${encodeURIComponent(targetUser)}&amount=${fetchAmount}`;
        if (currentPaginationToken) {
          url += `&pagination_token=${encodeURIComponent(currentPaginationToken)}`;
        }

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('sessionToken') || localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success || !data.data || !data.data.data) {
          throw new Error('Invalid data format received');
        }

        const batchFollowers = data.data.data.items || [];
        if (batchFollowers.length === 0) {
          setStatusMessage(`No more ${typeLabelLabel} found.`);
          break;
        }

        allFollowers = [...allFollowers, ...batchFollowers];
        fetchedCount += batchFollowers.length;
        setProgress(Math.min(100, Math.round((fetchedCount / targetCount) * 100)));

        currentPaginationToken = data.data.data.pagination_token || data.data.pagination_token;
        
        if (!currentPaginationToken) {
          setStatusMessage(`Reached end of ${typeLabelLabel} list.`);
          break;
        }

        // Add a small delay between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Ensure we don't save more than targetCount if the last batch exceeded it
      allFollowers = allFollowers.slice(0, targetCount);
      setStatusMessage(`Scraping complete. Saving ${allFollowers.length} ${typeLabelLabel}...`);

      // Save to database
      if (allFollowers.length > 0) {
        const saveResponse = await fetch(`${base}/api/mediafy/${scrapingType}/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('sessionToken') || localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            target_user: targetUser,
            followers: allFollowers
          })
        });

        if (saveResponse.ok) {
          setStatusMessage(`Successfully saved ${allFollowers.length} ${typeLabelLabel}.`);
          loadSavedRecords(); // Reload records table
        } else {
          setStatusMessage(`Failed to save ${typeLabelLabel} to database.`);
        }
      }

    } catch (error) {
      console.error('Scraping error:', error);
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setIsScraping(false);
    }
  };

  const exportToCSV = () => {
    if (savedRecords.length === 0) return;
    
    const isFollowers = scrapingType === 'followers';
    const typeLabel = isFollowers ? 'Follower ID' : 'Following ID';
    const headers = ['Target User', typeLabel, 'Username', 'Full Name', 'Is Private', 'Is Verified', 'Scraped At'];
    
    const csvContent = [
      headers.join(','),
      ...savedRecords.map(r => [
        r.target_user || '',
        r.follower_id || '',
        (r.username || '').replace(/,/g, ''),
        (r.full_name || '').replace(/,/g, ''),
        r.is_private ? 'Yes' : 'No',
        r.is_verified ? 'Yes' : 'No',
        r.scraped_at || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${scrapingType}_${targetUser || 'all'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isFollowersMode = scrapingType === 'followers';

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                {isFollowersMode ? 'Followers Scraping' : 'Following Scraping'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Scrape Instagram {isFollowersMode ? 'followers' : 'following'} in batches of 500 and save them to the database.
              </p>
            </div>

            {/* Type selector tabs */}
            <div className="flex space-x-2 p-1 bg-slate-200/60 dark:bg-slate-700/50 rounded-lg max-w-md mb-6 border border-slate-300/40 dark:border-slate-600/30">
              <button
                onClick={() => setScrapingType('followers')}
                disabled={isScraping}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-150 ${
                  scrapingType === 'followers'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Followers
              </button>
              <button
                onClick={() => setScrapingType('following')}
                disabled={isScraping}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-150 ${
                  scrapingType === 'following'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Following
              </button>
            </div>

            {/* Scraper Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-8">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">Scrape Parameters</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Target Username or ID
                  </label>
                  <input
                    type="text"
                    value={targetUser}
                    onChange={(e) => setTargetUser(e.target.value)}
                    disabled={isScraping}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="e.g. chil_sez_cbe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Target Count
                  </label>
                  <input
                    type="number"
                    value={targetCount}
                    onChange={(e) => setTargetCount(parseInt(e.target.value) || 0)}
                    disabled={isScraping}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="500"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleStartScraping}
                  disabled={isScraping || !targetUser}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition duration-150 ease-in-out"
                >
                  {isScraping ? 'Scraping...' : 'Start Scraping'}
                </button>
                {statusMessage && (
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {statusMessage}
                  </span>
                )}
              </div>

              {isScraping && (
                <div className="mt-4">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
                  <p className="text-xs text-right mt-1 text-slate-500 dark:text-slate-400">{progress}%</p>
                </div>
              )}
            </div>

            {/* Saved Records Section (Task-wise) */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Scraping Tasks</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={loadSavedRecords}
                    disabled={isLoadingRecords}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition duration-150 ease-in-out"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={exportToCSV}
                    disabled={savedRecords.length === 0}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg text-sm font-medium transition duration-150 ease-in-out"
                  >
                    Export All CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                {isLoadingRecords ? (
                  <div className="py-8 text-center text-slate-500">Loading tasks...</div>
                ) : getGroupedTasks().length === 0 ? (
                  <div className="py-8 text-center text-slate-500">No saved scraping tasks found.</div>
                ) : (
                  <div className="space-y-4">
                    {getGroupedTasks().map((task) => {
                      const isExpanded = !!expandedTasks[task.key];
                      return (
                        <div key={task.key} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                          {/* Task Header Row */}
                          <div 
                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            onClick={() => toggleTaskExpansion(task.key)}
                          >
                            <div className="flex items-center space-x-6">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                @{task.target_user}
                              </span>
                              <span className="text-sm text-slate-500 dark:text-slate-400">
                                {new Date(task.scraped_at).toLocaleString()}
                              </span>
                              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                {task.followers.length} {isFollowersMode ? 'Followers' : 'Following'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => exportTaskToCSV(task)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition"
                              >
                                Export Task CSV
                              </button>
                              <button
                                onClick={() => toggleTaskExpansion(task.key)}
                                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white font-medium text-sm px-2 py-1"
                              >
                                {isExpanded ? 'Collapse ▲' : 'View Records ▼'}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Task Records Table */}
                          {isExpanded && (
                            <div className="border-t border-slate-200 dark:border-slate-700 overflow-x-auto">
                              <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-800 dark:text-slate-300">
                                  <tr>
                                    <th className="px-6 py-3">Username</th>
                                    <th className="px-6 py-3">Full Name</th>
                                    <th className="px-6 py-3">Private</th>
                                    <th className="px-6 py-3">Verified</th>
                                    <th className="px-6 py-3">{isFollowersMode ? 'Follower ID' : 'Following ID'}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {task.followers.map((follower, idx) => (
                                    <tr key={idx} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                        <div className="flex items-center space-x-2">
                                          {follower.profile_pic_url && (
                                            <img src={follower.profile_pic_url} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                                          )}
                                          <span>{follower.username}</span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4">{follower.full_name}</td>
                                      <td className="px-6 py-4">{follower.is_private ? 'Yes' : 'No'}</td>
                                      <td className="px-6 py-4">{follower.is_verified ? 'Yes' : 'No'}</td>
                                      <td className="px-6 py-4 text-xs font-mono">{follower.follower_id}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

export default FollowersScraping;
