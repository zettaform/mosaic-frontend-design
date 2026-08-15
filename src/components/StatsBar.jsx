import React from 'react';

function classNames(...cls) { return cls.filter(Boolean).join(' '); }

export default function StatsBar({ title, stats = {}, color = 'indigo' }) {
  const { totalUsers = 0, processed = 0, successful = 0, failed = 0, currentUser = null } = stats;
  const pct = totalUsers ? Math.round((processed / totalUsers) * 100) : 0;
  const colorMap = {
    indigo: 'from-indigo-500 to-purple-500',
    blue: 'from-blue-500 to-sky-500',
    fuchsia: 'from-fuchsia-500 to-pink-500',
    green: 'from-emerald-500 to-lime-500'
  };
  const gradient = colorMap[color] || colorMap.indigo;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <div className="text-sm text-slate-500 dark:text-slate-400">Total Users</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalUsers}</div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <div className="text-sm text-slate-500 dark:text-slate-400">Processed</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{processed}</div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <div className="text-sm text-slate-500 dark:text-slate-400">Successful</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{successful}</div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <div className="text-sm text-slate-500 dark:text-slate-400">Failed</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{failed}</div>
        </div>
      </div>
      {currentUser && (
        <div className="mt-4 text-sm text-blue-600 dark:text-blue-400">🔄 Currently Processing: {currentUser}</div>
      )}
      <div className="mt-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div className={classNames('h-3 rounded-full transition-all duration-500', `bg-gradient-to-r ${gradient}`)} style={{ width: `${pct}%` }}></div>
        </div>
        <div className="text-right text-xs text-slate-500 dark:text-slate-400 mt-1">{pct}%</div>
      </div>
    </div>
  );
}
