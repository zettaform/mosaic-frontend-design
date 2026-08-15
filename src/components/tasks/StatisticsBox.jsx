import React from 'react';
import { Database, Users, Mail, ClipboardList, CheckCircle, PlayCircle, ArrowUp } from 'lucide-react';

/**
 * Statistics Box Component
 * Displays 6 statistics cards with click handlers and animations
 * 
 * @param {Object} props
 * @param {Object} props.statistics - Statistics controller data
 * @param {Object} props.animations - Animation controller data
 */
export default function StatisticsBox({ statistics, animations }) {
  const { overallStats, loading } = statistics;
  const {
    handleTotalTasksClick,
    handleTotalRecordsClick,
    handleRunningTasksClick,
    handleUsersWithEmailsClick,
    handleTotalTasksMouseMove,
    handleTotalTasksMouseLeave,
    handleTotalRecordsMouseMove,
    handleTotalRecordsMouseLeave,
    handleRunningTasksMouseMove,
    handleRunningTasksMouseLeave,
    handleUsersWithEmailsMouseMove,
    handleUsersWithEmailsMouseLeave,
    totalTasksBoxRef,
    totalRecordsBoxRef,
    runningTasksBoxRef,
    usersWithEmailsBoxRef,
    ripplePosition,
    recordsRipplePosition,
    runningRipplePosition,
    usersWithEmailsRipplePosition,
    tiltStyle,
    recordsTiltStyle,
    runningTiltStyle,
    usersWithEmailsTiltStyle
  } = animations;

  return (
    <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-6">
      {/* Row 1: Total Records, Total Unique Users, Users with Emails */}
      <div
        ref={totalRecordsBoxRef}
        onClick={handleTotalRecordsClick}
        onMouseMove={handleTotalRecordsMouseMove}
        onMouseLeave={handleTotalRecordsMouseLeave}
        style={{
          ...recordsTiltStyle,
          cursor: 'pointer',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d',
          position: 'relative'
        }}
        className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pt-5 pb-12 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-white/10 sm:px-6 sm:pt-6"
      >
        {/* Ripple effect overlay */}
        {recordsRipplePosition.active && (
          <div
            className="glass-ripple"
            style={{
              position: 'absolute',
              left: recordsRipplePosition.x,
              top: recordsRipplePosition.y,
              width: '0',
              height: '0',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0.2) 40%, transparent 70%)',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              animation: 'rippleExpand 0.6s ease-out',
              zIndex: 10
            }}
          />
        )}
        <dt>
          <div className="absolute rounded-md bg-blue-500 p-3">
            <Database aria-hidden="true" className="h-6 w-6 text-white" />
          </div>
          <p className="ml-16 truncate text-sm font-medium text-slate-500 dark:text-slate-400">Total Records</p>
        </dt>
        <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {loading ? '...' : overallStats.totalRecords}
          </p>
          <p className="ml-2 flex items-baseline text-sm font-semibold text-green-400">
            <ArrowUp aria-hidden="true" className="h-5 w-5 shrink-0 self-center text-green-400" />
            <span className="sr-only">Increased by</span>
            {!loading ? Math.round(overallStats.totalRecords * 0.05) : '0'}
          </p>
          <div className="absolute inset-x-0 bottom-0 bg-slate-50 dark:bg-slate-700/20 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300">
                View all<span className="sr-only"> Total Records stats</span>
              </a>
            </div>
          </div>
        </dd>
      </div>

      <div className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pt-5 pb-12 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-white/10 sm:px-6 sm:pt-6">
        <dt>
          <div className="absolute rounded-md bg-purple-500 p-3">
            <Users aria-hidden="true" className="h-6 w-6 text-white" />
          </div>
          <p className="ml-16 truncate text-sm font-medium text-slate-500 dark:text-slate-400">Total Unique Users</p>
        </dt>
        <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {loading ? '...' : (overallStats.totalUniqueUsers ?? '-')}
          </p>
          <p className="ml-2 flex items-baseline text-sm font-semibold text-green-400">
            <ArrowUp aria-hidden="true" className="h-5 w-5 shrink-0 self-center text-green-400" />
            <span className="sr-only">Increased by</span>
            {!loading && overallStats.totalUniqueUsers ? Math.round(overallStats.totalUniqueUsers * 0.08) : '0'}
          </p>
          <div className="absolute inset-x-0 bottom-0 bg-slate-50 dark:bg-slate-700/20 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <span className="font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed">
                View all<span className="sr-only"> Total Unique Users stats</span>
              </span>
            </div>
          </div>
        </dd>
      </div>

      <div
        ref={usersWithEmailsBoxRef}
        onClick={handleUsersWithEmailsClick}
        onMouseMove={handleUsersWithEmailsMouseMove}
        onMouseLeave={handleUsersWithEmailsMouseLeave}
        style={{
          ...usersWithEmailsTiltStyle,
          cursor: 'pointer',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d',
          position: 'relative'
        }}
        className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pt-5 pb-12 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-white/10 sm:px-6 sm:pt-6"
      >
        {/* Ripple effect overlay */}
        {usersWithEmailsRipplePosition.active && (
          <div
            className="glass-ripple"
            style={{
              position: 'absolute',
              left: usersWithEmailsRipplePosition.x,
              top: usersWithEmailsRipplePosition.y,
              width: '0',
              height: '0',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(99, 102, 241, 0.2) 40%, transparent 70%)',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              animation: 'rippleExpand 0.6s ease-out',
              zIndex: 10
            }}
          />
        )}
        <dt>
          <div className="absolute rounded-md bg-indigo-500 p-3">
            <Mail aria-hidden="true" className="h-6 w-6 text-white" />
          </div>
          <p className="ml-16 truncate text-sm font-medium text-slate-500 dark:text-slate-400">Users with Emails</p>
        </dt>
        <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {statistics.loadingUsersWithEmails ? '...' : (statistics.usersWithEmailsCount !== null && statistics.usersWithEmailsCount !== undefined ? statistics.usersWithEmailsCount : '-')}
          </p>
          <div className="absolute inset-x-0 bottom-0 bg-slate-50 dark:bg-slate-700/20 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <a href="#" onClick={(e) => e.preventDefault()} className="font-medium text-indigo-400 hover:text-indigo-300">
                View all<span className="sr-only"> Users with Emails stats</span>
              </a>
            </div>
          </div>
        </dd>
      </div>

      {/* Row 2: Total Tasks, Completed Tasks, Running Tasks */}
      <div 
        ref={totalTasksBoxRef}
        onClick={handleTotalTasksClick}
        onMouseMove={handleTotalTasksMouseMove}
        onMouseLeave={handleTotalTasksMouseLeave}
        style={{
          ...tiltStyle,
          cursor: 'pointer',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d',
          position: 'relative'
        }}
        className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pt-5 pb-12 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-white/10 sm:px-6 sm:pt-6"
      >
        {/* Ripple effect overlay */}
        {ripplePosition.active && (
          <div
            className="glass-ripple"
            style={{
              position: 'absolute',
              left: ripplePosition.x,
              top: ripplePosition.y,
              width: '0',
              height: '0',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(99, 102, 241, 0.2) 40%, transparent 70%)',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              animation: 'rippleExpand 0.6s ease-out',
              zIndex: 10
            }}
          />
        )}
        <dt>
          <div className="absolute rounded-md bg-indigo-500 p-3">
            <ClipboardList aria-hidden="true" className="h-6 w-6 text-white" />
          </div>
          <p className="ml-16 truncate text-sm font-medium text-slate-500 dark:text-slate-400">Total Tasks</p>
        </dt>
        <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {loading ? '...' : overallStats.totalTasks}
          </p>
          <div className="absolute inset-x-0 bottom-0 bg-slate-50 dark:bg-slate-700/20 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300">
                View all<span className="sr-only"> Total Tasks stats</span>
              </a>
            </div>
          </div>
        </dd>
      </div>

      <div className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pt-5 pb-12 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-white/10 sm:px-6 sm:pt-6">
        <dt>
          <div className="absolute rounded-md bg-green-500 p-3">
            <CheckCircle aria-hidden="true" className="h-6 w-6 text-white" />
          </div>
          <p className="ml-16 truncate text-sm font-medium text-slate-500 dark:text-slate-400">Completed Tasks</p>
        </dt>
        <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {loading ? '...' : overallStats.completedTasks}
          </p>
          <p className="ml-2 flex items-baseline text-sm font-semibold text-green-400">
            <ArrowUp aria-hidden="true" className="h-5 w-5 shrink-0 self-center text-green-400" />
            <span className="sr-only">Increased by</span>
            {!loading ? Math.round(overallStats.completedTasks * 0.12) : '0'}
          </p>
          <div className="absolute inset-x-0 bottom-0 bg-slate-50 dark:bg-slate-700/20 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300">
                View all<span className="sr-only"> Completed Tasks stats</span>
              </a>
            </div>
          </div>
        </dd>
      </div>

      <div 
        ref={runningTasksBoxRef}
        onClick={handleRunningTasksClick}
        onMouseMove={handleRunningTasksMouseMove}
        onMouseLeave={handleRunningTasksMouseLeave}
        style={{
          ...runningTiltStyle,
          cursor: 'pointer',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d',
          position: 'relative'
        }}
        className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pt-5 pb-12 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-white/10 sm:px-6 sm:pt-6"
      >
        {/* Running ripple effect overlay (emerald-themed) */}
        {runningRipplePosition.active && (
          <div
            className="glass-ripple"
            style={{
              position: 'absolute',
              left: runningRipplePosition.x,
              top: runningRipplePosition.y,
              width: '0',
              height: '0',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.45) 0%, rgba(16, 185, 129, 0.25) 40%, transparent 70%)',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              animation: 'rippleExpand 0.55s ease-out',
              zIndex: 10
            }}
          />
        )}
        <dt>
          <div className="absolute rounded-md bg-emerald-500 p-3">
            <PlayCircle aria-hidden="true" className="h-6 w-6 text-white" />
          </div>
          <p className="ml-16 truncate text-sm font-medium text-slate-400 dark:text-gray-400 flex items-center gap-2">
            <span>Running Tasks</span>
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-700/80">
              Live
            </span>
          </p>
        </dt>
        <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
          <p className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            {loading ? '...' : overallStats.runningTasks}
            {!loading && overallStats.runningTasks > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </p>
          <p className="ml-2 flex items-baseline text-sm font-semibold text-green-400">
            <ArrowUp aria-hidden="true" className="h-5 w-5 shrink-0 self-center text-green-400" />
            <span className="sr-only">Increased by</span>
            {!loading && overallStats.runningTasks > 0 ? overallStats.runningTasks : '0'}
          </p>
          <div className="absolute inset-x-0 bottom-0 bg-slate-50 dark:bg-slate-700/20 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300">
                View all<span className="sr-only"> Running Tasks stats</span>
              </a>
            </div>
          </div>
        </dd>
      </div>
    </dl>
  );
}

