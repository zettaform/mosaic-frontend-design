/**
 * Tasks Page - Refactored Example
 * 
 * This is an example of how Tasks.jsx should look after refactoring.
 * It demonstrates the controller-based architecture pattern.
 * 
 * To use: Copy this structure and integrate with your existing code gradually.
 */

import React, { useState, useEffect } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';

// Import controllers (like server.js imports routes)
import { useStatisticsController } from '../../controllers/tasks/statisticsController';
import { useCollectionController } from '../../controllers/tasks/collectionController';
import { useSavedResultsController } from '../../controllers/tasks/savedResultsController';
import { useModalsController } from '../../controllers/tasks/modalsController';
import { useUsersController } from '../../controllers/tasks/usersController';
import { usePollingController } from '../../controllers/tasks/pollingController';
import { useAnimationController } from '../../controllers/tasks/animationController';
import { usePaginationController } from '../../controllers/tasks/paginationController';
import { useColumnController } from '../../controllers/tasks/columnController';

// Import components
import StatisticsBox from '../../components/tasks/StatisticsBox';
import NewCollectionForm from '../../components/tasks/NewCollectionForm';
// import SavedResultsList from '../../components/tasks/SavedResultsList';
// import TaskUsersModal from '../../components/tasks/modals/TaskUsersModal';
// import TaskViewModal from '../../components/tasks/modals/TaskViewModal';
// import CampaignModal from '../../components/tasks/modals/CampaignModal';
// import SessionModal from '../../components/tasks/modals/SessionModal';
// import UsersWithEmailsModal from '../../components/tasks/modals/UsersWithEmailsModal';

// Import animation styles
import '../../styles/tasks-animations.css';

/**
 * Tasks Component - Main Orchestrator
 * Similar to server.js - imports controllers and orchestrates the page
 */
function Tasks() {
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'saved'

  // Initialize controllers (like server.js imports routes)
  const statistics = useStatisticsController(user);
  const collection = useCollectionController();
  const savedResults = useSavedResultsController();
  const modals = useModalsController();
  const users = useUsersController(user);
  const polling = usePollingController(savedResults.savedResults);
  
  // Animation controller needs refs and callbacks
  const animations = useAnimationController(
    activeTab,
    savedResults.savedResultsSectionRef,
    setActiveTab,
    savedResults.setSortBy,
    polling.ensureRunningTasksVisible
  );
  
  // Column controller (needs Mediafy config - would come from modals or separate state)
  const columns = useColumnController(null); // TODO: Pass selectedMediafyConfig
  
  // Pagination controller (if needed separately)
  const pagination = usePaginationController({ initialPage: 1, initialPageSize: 10 });

  // RBAC: Check permissions
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  const routeInfo = ROUTE_TO_SECTION[currentPath];
  if (routeInfo) {
    const { section, page } = routeInfo;
    if (!hasAccess(user, section, page)) {
      console.log(`❌ Access denied: User ${user.email || user.user_id} attempted to access ${currentPath}`);
      return <Navigate to="/unauthorized" replace />;
    }
  } else {
    console.log(`❌ Access denied: Route ${currentPath} is not in ROUTE_TO_SECTION`);
    return <Navigate to="/unauthorized" replace />;
  }

  // Load data on mount
  useEffect(() => {
    savedResults.loadTotalCount();
    savedResults.loadSavedResults({ page: 1, size: pagination.pageSize, lastKey: null, preserveOptimistic: false });
    polling.resumePollingForRunningTasks();
  }, []);

  // Trail animation SVG (for scroll trail effect)
  const renderTrailAnimation = () => {
    if (!animations.showTrail) return null;
    
    return (
      <svg
        className="fixed inset-0 pointer-events-none z-50"
        style={{ zIndex: 50 }}
      >
        <path
          className="trail-path"
          stroke="#3b82f6"
          strokeWidth="2"
          fill="none"
          strokeDasharray="1000"
          strokeDashoffset="1000"
          opacity="0.3"
        />
      </svg>
    );
  };

  return (
    <>
      {/* Animation styles - could be moved to global CSS */}
      <style>{`
        .glass-ripple {
          pointer-events: none;
        }
      `}</style>

      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="sidebar-shell-main">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex-1">
            <div className="px-4 sm:px-6 lg:px-8 py-4 w-full max-w-7xl mx-auto">
              
              {/* Statistics Box */}
              <StatisticsBox 
                statistics={statistics}
                animations={animations}
              />
              
              {/* Tab Navigation */}
              <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="border-b border-slate-200 dark:border-slate-700">
                  <nav className="-mb-px flex space-x-8 px-6">
                    <button
                      onClick={() => setActiveTab('new')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'new'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                      }`}
                    >
                      New Collection
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('saved');
                        setTimeout(() => {
                          polling.ensureRunningTasksVisible();
                        }, 500);
                      }}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'saved'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                      }`}
                    >
                      Saved Results ({savedResults.savedResults.length})
                    </button>
                  </nav>
                </div>
              </div>

              {/* New Collection Tab */}
              {activeTab === 'new' && (
                <NewCollectionForm collection={collection} />
              )}

              {/* Saved Results Tab */}
              {activeTab === 'saved' && (
                <div className="space-y-6">
                  {/* TODO: Extract to SavedResultsList component */}
                  <div 
                    ref={savedResults.savedResultsSectionRef}
                    className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 ${
                      animations.savedResultsHighlight ? 'spotlight-glow breathing-illumination' : ''
                    }`}
                    style={{
                      willChange: animations.savedResultsHighlight ? 'box-shadow, transform' : 'auto',
                      transition: animations.savedResultsHighlight ? 'box-shadow 0.3s ease-out' : 'none'
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                          Saved Tasks
                        </h2>
                        {savedResults.totalItems > 0 && (
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            ({savedResults.getFilteredAndSortedTasks(savedResults.savedResults).length} of {savedResults.totalItems} tasks)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Filter Dropdown */}
                        <select
                          value={savedResults.sortBy}
                          onChange={(e) => savedResults.setSortBy(e.target.value)}
                          className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        >
                          <option value="all">All Tasks</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={savedResults.refreshCurrentPage}
                          disabled={savedResults.loadingResults}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium"
                        >
                          Refresh
                        </button>
                      </div>
                    </div>

                    {/* Task List */}
                    {savedResults.loadingResults ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                        <span className="ml-2 text-slate-600 dark:text-slate-400">Loading results...</span>
                      </div>
                    ) : savedResults.savedResults.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        No saved results found. Run a hashtag collection to see results here.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {savedResults.getFilteredAndSortedTasks(savedResults.savedResults).map((task) => (
                          <div
                            key={task.task_id}
                            className={`border rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer ${
                              task.status === 'running' 
                                ? 'border-blue-300 dark:border-blue-600 bg-blue-50/30 dark:bg-blue-900/20' 
                                : task.status === 'completed'
                                ? 'border-green-300 dark:border-green-600 bg-green-50/20 dark:bg-green-900/10'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                            onClick={() => {
                              modals.setShowTaskViewModal(true);
                              modals.loadTaskForModal(task.task_id);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium text-slate-800 dark:text-slate-100">
                                  #{task.hashtag} - {task.total_items ?? task.summary?.total_items ?? 0} items
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  {task.status} • {task.created_at ? new Date(task.created_at).toLocaleString() : 'N/A'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    users.openTaskUsersModal(task.task_id, e, false, task.hashtag);
                                  }}
                                  className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-sm"
                                >
                                  View Users
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Trail Animation SVG */}
      {renderTrailAnimation()}

      {/* Modals - TODO: Extract to separate modal components */}
      {/* 
      {modals.showTaskUsersModal && (
        <TaskUsersModal
          modals={modals}
          users={users}
          columns={columns}
        />
      )}
      
      {modals.showTaskViewModal && (
        <TaskViewModal
          modals={modals}
        />
      )}
      
      {modals.showCampaignModal && (
        <CampaignModal
          modals={modals}
        />
      )}
      */}
    </>
  );
}

export default Tasks;

