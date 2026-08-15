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
import SavedResultsList from '../../components/tasks/SavedResultsList';
import TaskUsersModal from '../../components/tasks/modals/TaskUsersModal';
import TaskViewModal from '../../components/tasks/modals/TaskViewModal';
import CampaignModal from '../../components/tasks/modals/CampaignModal';
import SessionModal from '../../components/tasks/modals/SessionModal';
import UsersWithEmailsModal from '../../components/tasks/modals/UsersWithEmailsModal';
import TotalRecordsModal from '../../components/tasks/modals/TotalRecordsModal';

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
  const collection = useCollectionController(user);
  const savedResults = useSavedResultsController(user);
  const users = useUsersController(user);
  const modals = useModalsController(user, savedResults.savedResults);
  const polling = usePollingController(savedResults.savedResults);

  // Callback for when Users with Emails stat box is clicked
  // Opens the TaskUsersModal in tenant-wide mode to show all users with emails for the tenant
  const handleUsersWithEmailsStatClick = () => {
    // Open TaskUsersModal in tenant-wide mode (no task ID, tenant-wide = true)
    modals.openTaskUsersModal(null, null, true, null);
  };

  // Callback for when Total Records stat box is clicked
  // Opens the Total Records modal to show all records from dev-unified-tasks container
  const handleTotalRecordsStatClick = () => {
    modals.openTotalRecordsModal();
  };

  // Animation controller needs refs and callbacks
  const animations = useAnimationController(
    activeTab,
    savedResults.savedResultsSectionRef,
    setActiveTab,
    savedResults.setSortBy,
    polling.ensureRunningTasksVisible,
    handleUsersWithEmailsStatClick,
    handleTotalRecordsStatClick
  );

  // Column controller (needs Mediafy config - would come from modals or separate state)
  const columns = useColumnController(modals.selectedMediafyConfig);

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
    // Use savedResults.pageSize (defaults to 10) for consistency
    savedResults.loadSavedResults({ page: 1, size: savedResults.pageSize || 10, lastKey: null, preserveOptimistic: false });
    polling.resumePollingForRunningTasks();
  }, []);

  // Sync modals task ID to users controller and trigger fetching when modal opens
  useEffect(() => {
    if (modals.showTaskUsersModal) {
      if (modals.taskUsersIsTenantWide) {
        // Tenant-wide mode: clear cache immediately, set the mode, then trigger fresh fetch
        users.clearTaskUsersCache();
        users.setTaskUsersIsTenantWide(true);
        users.setTaskUsersTaskId(null);
        // Trigger fresh fetching for tenant-wide (no cache)
        users.fetchTaskUsers({ page: 1, startKey: null });
      } else if (modals.taskUsersTaskId) {
        // Task-specific mode: clear cache immediately, sync task ID and mode, then trigger fresh fetch
        users.clearTaskUsersCache();
        users.setTaskUsersTaskId(modals.taskUsersTaskId);
        users.setTaskUsersIsTenantWide(false);
        // Trigger fresh fetching for task-specific (no cache)
        users.fetchTaskUsers({ page: 1, startKey: null });
      }
    } else {
      // Reset when modal closes
      users.closeTaskUsersModal();
    }
  }, [modals.showTaskUsersModal, modals.taskUsersTaskId, modals.taskUsersIsTenantWide, users.setTaskUsersTaskId, users.setTaskUsersIsTenantWide, users.fetchTaskUsers, users.closeTaskUsersModal, users.clearTaskUsersCache]);

  // Sync tenant users modal and clear cache when modal opens
  useEffect(() => {
    if (modals.showUsersWithEmailsModal) {
      // Clear tenant users cache immediately when modal opens for consistent loading
      users.clearTenantUsersCache();
      // Trigger fresh fetching for tenant users
      users.fetchTenantUsersWithEmails({ page: 1, startKey: null });
    }
  }, [modals.showUsersWithEmailsModal, users.clearTenantUsersCache, users.fetchTenantUsersWithEmails]);

  // Sync total records modal and clear cache when modal opens
  useEffect(() => {
    if (modals.showTotalRecordsModal) {
      // Clear total records cache immediately when modal opens for consistent loading
      users.clearTotalRecordsCache();
      // Trigger fresh fetching for total records
      users.fetchTotalRecords({ page: 1, startKey: null });
    }
  }, [modals.showTotalRecordsModal, users.clearTotalRecordsCache, users.fetchTotalRecords]);

  // Trail animation SVG (for scroll trail effect)
  const renderTrailAnimation = () => {
    if (!animations.showTrail) return null;

    return (
      <svg
        className="fixed inset-0 pointer-events-none z-50"
        style={{ zIndex: 50 }}
      >
        <path
          className="trail-path text-blue-500"
          stroke="currentColor"
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
                  <nav className="-mb-px flex flex-wrap gap-4 sm:flex-nowrap sm:space-x-8 px-4 sm:px-6">
                    <button
                      onClick={() => setActiveTab('new')}
                      className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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
                      className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === 'saved'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                      }`}
                    >
                      Saved Results ({savedResults.totalItems || savedResults.savedResults.length})
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
                <SavedResultsList
                  savedResults={savedResults}
                  modals={modals}
                  users={users}
                  animations={animations}
                  polling={polling}
                />
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Trail Animation SVG */}
      {renderTrailAnimation()}

      {/* Modals */}
      <TaskUsersModal
        modals={modals}
        users={users}
        columns={columns}
      />
      <TaskViewModal
        modals={modals}
      />
      <CampaignModal
        modals={modals}
      />
      <SessionModal
        modals={modals}
      />
      <UsersWithEmailsModal
        modals={modals}
        users={users}
        columns={columns}
      />
      <TotalRecordsModal
        modals={modals}
        users={users}
      />
    </>
  );
}

export default Tasks;