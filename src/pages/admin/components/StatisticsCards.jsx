import React from 'react';
import { Database, Users, Mail, ClipboardList, CheckCircle, PlayCircle, ArrowUp } from 'lucide-react';

export function StatisticsCards({ 
  stats, 
  loading, 
  usersWithEmailsCount, 
  showGreenEmail, 
  onEmailClick,
  onTotalUniqueUsersClick,
  onTotalTasksClick,
  onRunningTasksClick 
}) {
  return (
    <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-6">
      {/* Total Records */}
      <StatCard
        icon={<Database className="h-6 w-6 text-white" />}
        iconBg="bg-indigo-500"
        title="Total Records"
        value={loading ? '...' : (stats.totalRecords ?? '-')}
        increase={!loading ? Math.round(stats.totalRecords * 0.05) : '0'}
      />

      {/* Total Unique Users */}
      <StatCard
        icon={<Users className="h-6 w-6 text-white" />}
        iconBg="bg-purple-500"
        title="Total Unique Users"
        value={loading ? '...' : (stats.totalUniqueUsers ?? '-')}
        increase={!loading && stats.totalUniqueUsers ? Math.round(stats.totalUniqueUsers * 0.08) : '0'}
        onClick={onTotalUniqueUsersClick}
        clickable
      />

      {/* Users with Emails */}
      <StatCard
        icon={<Mail className="h-6 w-6 text-white" />}
        iconBg="bg-indigo-500"
        title="Users with Emails"
        value={loading ? '...' : (usersWithEmailsCount !== null ? usersWithEmailsCount : '-')}
        highlight={showGreenEmail}
        onClick={onEmailClick}
        clickable
      />

      {/* Total Tasks */}
      <StatCard
        icon={<ClipboardList className="h-6 w-6 text-white" />}
        iconBg="bg-indigo-500"
        title="Total Tasks"
        value={loading ? '...' : stats.totalTasks}
        onClick={onTotalTasksClick}
        clickable
      />

      {/* Completed Tasks */}
      <StatCard
        icon={<CheckCircle className="h-6 w-6 text-white" />}
        iconBg="bg-green-500"
        title="Completed Tasks"
        value={loading ? '...' : stats.completedTasks}
        increase={!loading ? Math.round(stats.completedTasks * 0.12) : '0'}
      />

      {/* Running Tasks */}
      <StatCard
        icon={<PlayCircle className="h-6 w-6 text-white" />}
        iconBg="bg-emerald-500"
        title="Running Tasks"
        value={loading ? '...' : stats.runningTasks}
        badge="Live"
        onClick={onRunningTasksClick}
        clickable
      />
    </dl>
  );
}

function StatCard({ icon, iconBg, title, value, increase, badge, highlight, onClick, clickable }) {
  const cardClass = `relative overflow-hidden rounded-lg bg-slate-800/75 dark:bg-gray-800/75 px-4 pt-5 pb-12 shadow-sm ring-1 ring-inset ring-white/10 sm:px-6 sm:pt-6 transition-transform ${
    clickable ? 'cursor-pointer hover:scale-105' : ''
  }`;

  return (
    <div 
      className={cardClass}
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <dt>
        <div className={`absolute rounded-md ${iconBg} p-3`}>
          {icon}
        </div>
        <p className="ml-16 truncate text-sm font-medium text-slate-400 dark:text-gray-400 flex items-center gap-2">
          <span>{title}</span>
          {badge && (
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200 border border-emerald-300/60">
              {badge}
            </span>
          )}
        </p>
      </dt>
      <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
        <p className={`text-2xl font-semibold transition-colors duration-200 ${
          highlight ? 'text-green-600 dark:text-green-400' : 'text-slate-100 dark:text-white'
        }`}>
          {value}
        </p>
        {increase && (
          <p className="ml-2 flex items-baseline text-sm font-semibold text-green-400">
            <ArrowUp className="h-5 w-5 shrink-0 self-center text-green-400" />
            <span className="sr-only">Increased by</span>
            {increase}
          </p>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-slate-700/20 dark:bg-gray-700/20 px-4 py-4 sm:px-6">
          <div className="text-sm">
            <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300" style={{ pointerEvents: clickable ? 'none' : undefined }}>
              View all<span className="sr-only"> {title} stats</span>
            </a>
          </div>
        </div>
      </dd>
    </div>
  );
}

