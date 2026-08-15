import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';

// Utility functions
const getApiBase = () => (import.meta.env.VITE_API_URL || '').trim();

const getAdminKey = () => {
  try {
    return (localStorage.getItem('admin_key') || window.ADMIN_KEY || '').trim();
  } catch {
    return String(window.ADMIN_KEY || '').trim();
  }
};

// Holographic Credit Log Entry with 3D Effects
const CreditLogEntry = ({ log, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState([]);
  const entryRef = useRef(null);
  
  const isPositive = log.change > 0;
  const isNegative = log.change < 0;
  const isNeutral = log.change === 0;

  const createRipple = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const newRipple = {
      id: Date.now(),
      x,
      y,
      size
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  const getStatusColor = () => {
    if (isPositive) return 'from-emerald-400 to-green-500';
    if (isNegative) return 'from-red-400 to-rose-500';
    return 'from-slate-400 to-gray-500';
  };

  const getStatusBg = () => {
    if (isPositive) return 'from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10';
    if (isNegative) return 'from-red-50 to-rose-50 dark:from-red-900/10 dark:to-rose-900/10';
    return 'from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50';
  };

  return (
    <div
      ref={entryRef}
      className={`relative overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group ${
        isHovered ? 'shadow-2xl' : 'shadow-sm'
      }`}
      style={{
        background: `linear-gradient(135deg, ${isPositive ? '#ecfdf5' : isNegative ? '#fef2f2' : '#f8fafc'}, ${isPositive ? '#d1fae5' : isNegative ? '#fee2e2' : '#f1f5f9'})`,
        borderColor: isPositive ? '#10b981' : isNegative ? '#ef4444' : '#64748b'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={createRipple}
    >
      {/* Animated Background */}
      <div className={`absolute inset-0 bg-gradient-to-r ${getStatusBg()} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      {/* Ripple Effects */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="absolute bg-white/30 rounded-full animate-ping"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            animation: 'ripple 0.6s ease-out'
          }}
        />
      ))}

      {/* Holographic Effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 transition-transform duration-500 ${
        isHovered ? 'translate-x-full' : '-translate-x-full'
      }`} />

      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Status Icon with Animation */}
            <div className={`relative p-3 rounded-xl bg-gradient-to-br ${getStatusColor()} shadow-lg ${
              isHovered ? 'animate-pulse' : ''
            }`}>
              {isPositive ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              ) : isNegative ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              
              {/* Pulsing Ring */}
              <div className={`absolute inset-0 rounded-xl border-2 border-white/50 animate-ping ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`} />
            </div>

            <div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {new Date(log.createdAt).toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-500">
                {new Date(log.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Amount Badge */}
          <div className={`relative px-4 py-2 rounded-full bg-gradient-to-r ${getStatusColor()} text-white font-bold text-lg shadow-lg ${
            isHovered ? 'scale-110' : 'scale-100'
          } transition-transform duration-300`}>
            <span className="relative z-10">
              {isPositive ? '+' : ''}{log.change.toLocaleString()}
            </span>
            <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse" />
          </div>
        </div>

        {/* Reason */}
        <div className="mb-4">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Transaction Reason</div>
          <div className="text-slate-900 dark:text-white font-medium">{log.reason}</div>
        </div>

        {/* Balance After */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Balance After</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {log.balanceAfter.toLocaleString()} credits
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${getStatusColor()} rounded-full transition-all duration-1000`}
            style={{ width: `${Math.min((Math.abs(log.change) / 100) * 100, 100)}%` }}
          />
        </div>
      </div>

      <style>{`
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Futuristic Filter Component with Morphing Effects
const LogFilters = ({ filters, onFilterChange }) => {
  const [isFocused, setIsFocused] = useState({ search: false, type: false, limit: false });
  const [morphingPattern, setMorphingPattern] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMorphingPattern(prev => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const morphingPatterns = [
    'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
    'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)',
    'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-amber-50/90 via-orange-50/80 to-red-50/90 dark:from-slate-800/90 dark:via-amber-900/20 dark:to-orange-900/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-amber-200/30 dark:border-slate-700/30 p-8 mb-8 group">
      {/* Morphing Background Pattern */}
      <div 
        className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-400/20 via-orange-400/20 to-red-400/20 transition-all duration-4000 ease-in-out"
        style={{ clipPath: morphingPatterns[morphingPattern] }}
      />
      
      {/* Animated Border */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 dark:from-amber-400 dark:via-orange-400 dark:to-red-400 bg-clip-text text-transparent">
              Advanced Filters
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Real-time transaction filtering
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Search Input */}
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Search Transactions
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
                onFocus={() => setIsFocused(prev => ({ ...prev, search: true }))}
                onBlur={() => setIsFocused(prev => ({ ...prev, search: false }))}
                className={`w-full px-4 py-4 pl-12 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border-2 rounded-xl text-slate-900 dark:text-white transition-all duration-300 focus:outline-none ${
                  isFocused.search 
                    ? 'border-amber-400 shadow-lg shadow-amber-400/25' 
                    : 'border-slate-300 dark:border-slate-600 hover:border-amber-300'
                }`}
                placeholder="Search by reason..."
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Type Filter */}
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Transaction Type
            </label>
            <div className="relative">
              <select
                value={filters.type}
                onChange={(e) => onFilterChange('type', e.target.value)}
                onFocus={() => setIsFocused(prev => ({ ...prev, type: true }))}
                onBlur={() => setIsFocused(prev => ({ ...prev, type: false }))}
                className={`w-full px-4 py-4 pr-12 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border-2 rounded-xl text-slate-900 dark:text-white transition-all duration-300 focus:outline-none appearance-none ${
                  isFocused.type 
                    ? 'border-orange-400 shadow-lg shadow-orange-400/25' 
                    : 'border-slate-300 dark:border-slate-600 hover:border-orange-300'
                }`}
              >
                <option value="all">All Transactions</option>
                <option value="positive">Credits Added</option>
                <option value="negative">Credits Deducted</option>
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Limit Filter */}
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Results Per Page
            </label>
            <div className="relative">
              <select
                value={filters.limit}
                onChange={(e) => onFilterChange('limit', parseInt(e.target.value))}
                onFocus={() => setIsFocused(prev => ({ ...prev, limit: true }))}
                onBlur={() => setIsFocused(prev => ({ ...prev, limit: false }))}
                className={`w-full px-4 py-4 pr-12 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border-2 rounded-xl text-slate-900 dark:text-white transition-all duration-300 focus:outline-none appearance-none ${
                  isFocused.limit 
                    ? 'border-red-400 shadow-lg shadow-red-400/25' 
                    : 'border-slate-300 dark:border-slate-600 hover:border-red-300'
                }`}
              >
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        <div className="mt-6 flex flex-wrap gap-2">
          {filters.search && (
            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-sm font-medium">
              Search: "{filters.search}"
            </span>
          )}
          {filters.type !== 'all' && (
            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm font-medium">
              Type: {filters.type === 'positive' ? 'Credits Added' : 'Credits Deducted'}
            </span>
          )}
          <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-sm font-medium">
            Limit: {filters.limit} per page
          </span>
        </div>
      </div>
    </div>
  );
};

// Interactive Summary Stats with Animated Charts
const SummaryStats = ({ logs }) => {
  const [animatedValues, setAnimatedValues] = useState({ totalAdded: 0, totalDeducted: 0, netChange: 0, transactionCount: 0 });
  const [isAnimating, setIsAnimating] = useState(false);

  const totalAdded = logs
    .filter(log => log.change > 0)
    .reduce((sum, log) => sum + log.change, 0);
  
  const totalDeducted = logs
    .filter(log => log.change < 0)
    .reduce((sum, log) => sum + Math.abs(log.change), 0);
  
  const netChange = totalAdded - totalDeducted;
  const transactionCount = logs.length;

  // Animate values on mount and when logs change
  useEffect(() => {
    setIsAnimating(true);
    const duration = 1500;
    const steps = 60;
    const stepDuration = duration / steps;
    
    const animateValue = (start, end, setter) => {
      const increment = (end - start) / steps;
      let current = start;
      let step = 0;
      
      const timer = setInterval(() => {
        current += increment;
        step++;
        setter(Math.round(current));
        
        if (step >= steps) {
          setter(end);
          clearInterval(timer);
        }
      }, stepDuration);
    };

    animateValue(0, totalAdded, (value) => setAnimatedValues(prev => ({ ...prev, totalAdded: value })));
    animateValue(0, totalDeducted, (value) => setAnimatedValues(prev => ({ ...prev, totalDeducted: value })));
    animateValue(0, netChange, (value) => setAnimatedValues(prev => ({ ...prev, netChange: value })));
    animateValue(0, transactionCount, (value) => setAnimatedValues(prev => ({ ...prev, transactionCount: value })));

    setTimeout(() => setIsAnimating(false), duration);
  }, [totalAdded, totalDeducted, netChange, transactionCount]);

  const stats = [
    {
      label: 'Total Added',
      value: animatedValues.totalAdded,
      color: 'from-emerald-400 to-green-500',
      bgColor: 'from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20',
      icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
      textColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      label: 'Total Deducted',
      value: animatedValues.totalDeducted,
      color: 'from-red-400 to-rose-500',
      bgColor: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
      icon: 'M18 12H6',
      textColor: 'text-red-600 dark:text-red-400'
    },
    {
      label: 'Net Change',
      value: animatedValues.netChange,
      color: netChange >= 0 ? 'from-blue-400 to-cyan-500' : 'from-orange-400 to-red-500',
      bgColor: netChange >= 0 ? 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20' : 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
      icon: netChange >= 0 ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6',
      textColor: netChange >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
    },
    {
      label: 'Transactions',
      value: animatedValues.transactionCount,
      color: 'from-purple-400 to-violet-500',
      bgColor: 'from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20',
      icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      textColor: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50/90 via-gray-50/80 to-zinc-50/90 dark:from-slate-800/90 dark:via-gray-900/20 dark:to-zinc-900/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/30 dark:border-slate-700/30 p-8 mb-8 group">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-400/20 via-gray-400/20 to-zinc-400/20 animate-pulse" />
        <div className="absolute top-4 left-4 w-6 h-6 bg-slate-400/30 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-8 right-8 w-4 h-4 bg-gray-400/30 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-8 left-8 w-8 h-8 bg-zinc-400/30 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-slate-500 to-gray-600 rounded-xl shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 dark:from-slate-400 dark:via-gray-400 dark:to-zinc-400 bg-clip-text text-transparent">
              Transaction Summary
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Real-time credit analytics
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`relative overflow-hidden bg-gradient-to-br ${stat.bgColor} backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-slate-600/30 group hover:scale-105 transition-all duration-300 hover:shadow-xl ${
                isAnimating ? 'animate-pulse' : ''
              }`}
            >
              {/* Animated Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              <div className="relative z-10 text-center">
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg mb-4 ${
                  isAnimating ? 'animate-bounce' : ''
                }`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </div>

                {/* Value */}
                <div className={`text-3xl font-black ${stat.textColor} mb-2 ${
                  isAnimating ? 'animate-pulse' : ''
                }`}>
                  {stat.value >= 0 ? '+' : ''}{stat.value.toLocaleString()}
                </div>

                {/* Label */}
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {stat.label}
                </div>

                {/* Progress Bar */}
                <div className="mt-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-1000`}
                    style={{ width: `${Math.min((Math.abs(stat.value) / Math.max(totalAdded, totalDeducted, Math.abs(netChange), transactionCount)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Stats Footer */}
        <div className="mt-6 p-4 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-slate-600/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Total Transactions:</span>
            <span className="text-slate-900 dark:text-white font-bold">{logs.length} records</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Credit Logs Component
const CreditLogs = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    limit: 50
  });
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // Fetch credit logs
  const fetchLogs = async (reset = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setLogs([]);
        setLastEvaluatedKey(null);
      }

      setError(null);

      const params = new URLSearchParams({
        limit: filters.limit.toString()
      });

      if (lastEvaluatedKey && !reset) {
        params.append('lastEvaluatedKey', JSON.stringify(lastEvaluatedKey));
      }

      const response = await fetch(`${getApiBase()}/api/credits/logs?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('sessionToken') || localStorage.getItem('token')
            ? { Authorization: `Bearer ${localStorage.getItem('sessionToken') || localStorage.getItem('token')}` }
            : {})
        }
      });

      const data = await response.json();

      if (data.success) {
        const newLogs = data.logs || [];
        setLogs(prev => reset ? newLogs : [...prev, ...newLogs]);
        setLastEvaluatedKey(data.lastEvaluatedKey);
        setHasMore(!!data.lastEvaluatedKey);
      } else {
        setError(data.error || 'Failed to fetch credit logs');
      }
    } catch (err) {
      console.error('Error fetching credit logs:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter logs based on current filters
  const filteredLogs = logs.filter(log => {
    const matchesSearch = !filters.search || 
      log.reason.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesType = filters.type === 'all' || 
      (filters.type === 'positive' && log.change > 0) ||
      (filters.type === 'negative' && log.change < 0);

    return matchesSearch && matchesType;
  });

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Load more logs
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchLogs(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      fetchLogs(true);
    }
  }, [isAuthenticated]);

  // Refetch when filters change (except search which is client-side)
  useEffect(() => {
    if (isAuthenticated && (filters.type !== 'all' || filters.limit !== 50)) {
      fetchLogs(true);
    }
  }, [filters.type, filters.limit]);

  // Show loading spinner while checking auth
  if (authLoading) {
    return <LoadingSpinner />;
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Credit Logs</h1>
              <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
                View your credit transaction history and usage patterns
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Stats */}
            {filteredLogs.length > 0 && (
              <SummaryStats logs={filteredLogs} />
            )}

            {/* Filters */}
            <LogFilters filters={filters} onFilterChange={handleFilterChange} />

            {/* Futuristic Logs List with Holographic Effects */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white/90 via-slate-50/80 to-gray-50/90 dark:from-slate-800/90 dark:via-slate-900/20 dark:to-gray-900/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/30 dark:border-slate-700/30 group">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 via-gray-500/5 to-zinc-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="px-8 py-6 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-800/50 dark:to-gray-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-slate-700 via-gray-700 to-zinc-700 dark:from-slate-300 dark:via-gray-300 dark:to-zinc-300 bg-clip-text text-transparent">
                          Transaction History
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                          Complete credit transaction log
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-sm font-medium text-slate-600 dark:text-slate-400">
                        {filteredLogs.length} transactions
                      </div>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {isLoading && logs.length === 0 ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-slate-200 to-gray-300 dark:from-slate-700 dark:to-gray-600 rounded-full flex items-center justify-center animate-spin">
                          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Loading transactions...</p>
                      </div>
                    </div>
                  ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-slate-200 to-gray-300 dark:from-slate-700 dark:to-gray-600 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No transactions found</h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        {filters.search || filters.type !== 'all' 
                          ? 'Try adjusting your filters to see more results.'
                          : 'Credit transactions will appear here once they occur.'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredLogs.map((log, index) => (
                        <CreditLogEntry key={log.logId} log={log} index={index} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Futuristic Load More Button */}
                {hasMore && (
                  <div className="px-8 py-6 border-t border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-800/50 dark:to-gray-800/50">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoading}
                      className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 transform ${
                        isLoading
                          ? 'bg-slate-400 cursor-not-allowed scale-95'
                          : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Loading more transactions...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            <span>Load More Transactions</span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreditLogs;
