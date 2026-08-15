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

// Animated Credit Balance Card with Glassmorphism and Particle Effects
const CreditBalanceCard = ({ balance, updatedAt, onRefresh }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState([]);
  const cardRef = useRef(null);

  // Generate floating particles effect
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.6 + 0.2
      }));
      setParticles(newParticles);
    };

    generateParticles();
    const interval = setInterval(generateParticles, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsAnimating(true);
    onRefresh();
    setTimeout(() => setIsAnimating(false), 1000);
  };

  return (
    <div 
      ref={cardRef}
      className="relative overflow-hidden bg-gradient-to-br from-white/90 via-blue-50/80 to-purple-50/90 dark:from-slate-800/90 dark:via-blue-900/20 dark:to-purple-900/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/30 p-8 group hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]"
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              animation: `float ${3 + particle.speed}s ease-in-out infinite`
            }}
          />
        ))}
      </div>

      {/* Gradient Border Animation */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                Credit Balance
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Real-time balance tracking
              </p>
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            className={`p-3 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 ${
              isAnimating ? 'animate-spin' : ''
            }`}
            title="Refresh balance"
          >
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Animated Balance Display */}
        <div className="relative">
          <div className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2 animate-pulse">
            {balance.toLocaleString()}
          </div>
          <div className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-4">
            credits available
          </div>
          
          {/* Animated Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-4 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min((balance / 1000) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Last updated: {new Date(updatedAt).toLocaleString()}</span>
          </span>
          <span className="font-medium">
            {balance > 1000 ? 'High Balance' : balance > 100 ? 'Good Balance' : 'Low Balance'}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
};

// Futuristic Add Credits Form with Morphing Animations
const AddCreditsForm = ({ onAddCredits, isLoading }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [morphingShape, setMorphingShape] = useState(0);
  const formRef = useRef(null);

  // Morphing background shape animation
  useEffect(() => {
    const interval = setInterval(() => {
      setMorphingShape(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !reason.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddCredits(parseInt(amount), reason.trim());
      setAmount('');
      setReason('');
    } catch (error) {
      console.error('Error adding credits:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const morphingShapes = [
    'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
    'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
    'polygon(40% 0%, 60% 0%, 100% 40%, 100% 60%, 60% 100%, 40% 100%, 0% 60%, 0% 40%)'
  ];

  return (
    <div 
      ref={formRef}
      className="relative overflow-hidden bg-gradient-to-br from-emerald-50/90 via-cyan-50/80 to-blue-50/90 dark:from-slate-800/90 dark:via-emerald-900/20 dark:to-cyan-900/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-emerald-200/30 dark:border-slate-700/30 p-8 group hover:shadow-3xl transition-all duration-500"
    >
      {/* Morphing Background Shape */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 via-cyan-400/20 to-blue-400/20 transition-all duration-3000 ease-in-out"
        style={{ clipPath: morphingShapes[morphingShape] }}
      />
      
      {/* Animated Border */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 dark:from-emerald-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
              Add Credits
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Instant credit top-up system
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label htmlFor="amount" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Credit Amount
            </label>
            <div className="relative">
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                min="1"
                step="1"
                className={`w-full px-4 py-4 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border-2 rounded-xl text-slate-900 dark:text-white transition-all duration-300 focus:outline-none ${
                  isFocused 
                    ? 'border-emerald-400 shadow-lg shadow-emerald-400/25' 
                    : 'border-slate-300 dark:border-slate-600 hover:border-emerald-300'
                }`}
                placeholder="Enter amount to add"
                required
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <span className="text-slate-400 font-medium">credits</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <label htmlFor="reason" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Transaction Reason
            </label>
            <div className="relative">
              <input
                type="text"
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={`w-full px-4 py-4 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border-2 rounded-xl text-slate-900 dark:text-white transition-all duration-300 focus:outline-none ${
                  isFocused 
                    ? 'border-cyan-400 shadow-lg shadow-cyan-400/25' 
                    : 'border-slate-300 dark:border-slate-600 hover:border-cyan-300'
                }`}
                placeholder="e.g., Top-up, Bonus, Refund, Payment"
                required
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !amount || !reason.trim()}
            className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 transform ${
              isSubmitting || !amount || !reason.trim()
                ? 'bg-slate-400 cursor-not-allowed scale-95'
                : 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-600 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Credits</span>
                </>
              )}
            </div>
          </button>
        </form>
      </div>
    </div>
  );
};

// Holographic Quick Add Buttons with Ripple Effects
const QuickAddButtons = ({ onAddCredits, isLoading }) => {
  const quickAmounts = [10, 50, 100, 500, 1000];
  const [ripples, setRipples] = useState([]);
  const [hoveredButton, setHoveredButton] = useState(null);

  const handleQuickAdd = (amount) => {
    onAddCredits(amount, `Quick top-up: ${amount} credits`);
  };

  const createRipple = (event, amount) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const newRipple = {
      id: Date.now(),
      x,
      y,
      size,
      amount
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  const getButtonColor = (amount) => {
    if (amount <= 50) return 'from-green-400 to-emerald-500';
    if (amount <= 100) return 'from-blue-400 to-cyan-500';
    if (amount <= 500) return 'from-purple-400 to-pink-500';
    return 'from-orange-400 to-red-500';
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-violet-50/90 via-purple-50/80 to-pink-50/90 dark:from-slate-800/90 dark:via-violet-900/20 dark:to-purple-900/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-violet-200/30 dark:border-slate-700/30 p-8 group">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-violet-400/20 via-purple-400/20 to-pink-400/20 animate-pulse" />
        <div className="absolute top-4 left-4 w-8 h-8 bg-violet-400/30 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-8 right-8 w-6 h-6 bg-purple-400/30 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-8 left-8 w-4 h-4 bg-pink-400/30 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 dark:from-violet-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Quick Add
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              One-click credit top-ups
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {quickAmounts.map((amount) => (
            <div key={amount} className="relative">
              <button
                onClick={(e) => {
                  createRipple(e, amount);
                  handleQuickAdd(amount);
                }}
                onMouseEnter={() => setHoveredButton(amount)}
                onMouseLeave={() => setHoveredButton(null)}
                disabled={isLoading}
                className={`relative overflow-hidden w-full p-4 rounded-xl font-bold text-white transition-all duration-300 transform ${
                  isLoading
                    ? 'bg-slate-400 cursor-not-allowed scale-95'
                    : `bg-gradient-to-br ${getButtonColor(amount)} hover:scale-105 hover:shadow-2xl active:scale-95`
                }`}
              >
                {/* Ripple Effects */}
                {ripples
                  .filter(ripple => ripple.amount === amount)
                  .map(ripple => (
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
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 transition-transform duration-500 ${
                  hoveredButton === amount ? 'translate-x-full' : '-translate-x-full'
                }`} />
                
                <div className="relative z-10 flex items-center justify-center space-x-2">
                  <span className="text-lg">+{amount}</span>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" />
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* Usage Statistics */}
        <div className="mt-6 p-4 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-slate-600/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Most Popular:</span>
            <span className="text-violet-600 dark:text-violet-400 font-bold">100 credits</span>
          </div>
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

// Main Credits Component
const Credits = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [updatedAt, setUpdatedAt] = useState(new Date().toISOString());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch current balance
  const fetchBalance = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${getApiBase()}/api/credits/balance`, {
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
        setBalance(data.balance);
        setUpdatedAt(data.updatedAt);
      } else {
        setError(data.error || 'Failed to fetch balance');
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  // Add credits
  const handleAddCredits = async (amount, reason) => {
    try {
      setError(null);
      setSuccessMessage('');

      const response = await fetch(`${getApiBase()}/api/credits/modify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('sessionToken') || localStorage.getItem('token')
            ? { Authorization: `Bearer ${localStorage.getItem('sessionToken') || localStorage.getItem('token')}` }
            : {})
        },
        body: JSON.stringify({
          change: amount,
          reason: reason
        })
      });

      const data = await response.json();

      if (data.success) {
        setBalance(data.balance);
        setUpdatedAt(data.updatedAt);
        setSuccessMessage(`Successfully added ${amount} credits! New balance: ${data.balance.toLocaleString()}`);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError(data.error || 'Failed to add credits');
      }
    } catch (err) {
      console.error('Error adding credits:', err);
      setError('Failed to connect to server');
    }
  };

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance();
    }
  }, [isAuthenticated]);

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
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Credits & Billing</h1>
              <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
                Manage your credit balance and billing information
              </p>
            </div>

            {/* Error/Success Messages */}
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

            {successMessage && (
              <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Balance Card */}
                <div className="lg:col-span-2">
                  <CreditBalanceCard 
                    balance={balance} 
                    updatedAt={updatedAt} 
                    onRefresh={fetchBalance}
                  />
                </div>

                {/* Add Credits Form */}
                <div>
                  <AddCreditsForm 
                    onAddCredits={handleAddCredits} 
                    isLoading={isLoading}
                  />
                </div>

                {/* Quick Add Buttons */}
                <div>
                  <QuickAddButtons 
                    onAddCredits={handleAddCredits} 
                    isLoading={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Interactive Usage Information with 3D Cards */}
            <div className="mt-8 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl" />
              <div className="relative bg-gradient-to-br from-slate-50/90 via-indigo-50/80 to-purple-50/90 dark:from-slate-800/90 dark:via-indigo-900/20 dark:to-purple-900/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-indigo-200/30 dark:border-slate-700/30 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                      Credit Usage Guide
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                      Real-time pricing and consumption rates
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      service: 'Hashtag Processing',
                      rate: '1 credit per 100 posts',
                      icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
                      color: 'from-blue-500 to-cyan-500',
                      bgColor: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20'
                    },
                    {
                      service: 'AI Chat Messages',
                      rate: '1 credit per message',
                      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
                      color: 'from-purple-500 to-pink-500',
                      bgColor: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
                    },
                    {
                      service: 'Data Export',
                      rate: '1 credit per 1000 records',
                      icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
                      color: 'from-emerald-500 to-teal-500',
                      bgColor: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20'
                    }
                  ].map((item, index) => (
                    <div
                      key={index}
                      className={`relative overflow-hidden bg-gradient-to-br ${item.bgColor} backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-slate-600/30 group hover:scale-105 transition-all duration-300 hover:shadow-xl`}
                    >
                      {/* Animated Background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                      
                      <div className="relative z-10">
                        <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${item.color} shadow-lg mb-4`}>
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                          </svg>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-2">{item.service}</h4>
                        <p className={`text-sm font-semibold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                          {item.rate}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Usage Stats */}
                <div className="mt-6 p-4 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-slate-600/30">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Current Session Usage:</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">0 credits consumed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Credits;
