import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';

function Simulation() {
  const navigate = useNavigate();
  const { resetOnboarding, completeOnboarding } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [simulating, setSimulating] = useState({});

  const simulationFunctions = [
    {
      id: 'onboarding',
      title: 'Onboarding Flow',
      description: 'Simulate the complete 4-step onboarding process',
      icon: '🎯',
      color: 'emerald',
      action: async () => {
        setSimulating(prev => ({ ...prev, onboarding: true }));
        try {
          await resetOnboarding();
          navigate('/onboarding/1');
        } finally {
          setSimulating(prev => ({ ...prev, onboarding: false }));
        }
      }
    },
    {
      id: 'auth',
      title: 'Authentication Flow',
      description: 'Test sign in, sign up, and authentication states',
      icon: '🔐',
      color: 'blue',
      action: async () => {
        setSimulating(prev => ({ ...prev, auth: true }));
        try {
          // Simulate auth flow
          navigate('/signin');
        } finally {
          setSimulating(prev => ({ ...prev, auth: false }));
        }
      }
    },
    {
      id: 'dashboard',
      title: 'Dashboard Features',
      description: 'Test dashboard components and functionality',
      icon: '📊',
      color: 'indigo',
      action: async () => {
        setSimulating(prev => ({ ...prev, dashboard: true }));
        try {
          navigate('/dashboard');
        } finally {
          setSimulating(prev => ({ ...prev, dashboard: false }));
        }
      }
    },
    {
      id: 'crypto',
      title: 'Crypto Features',
      description: 'Test Bitcoin address generation and crypto functionality',
      icon: '₿',
      color: 'orange',
      action: async () => {
        setSimulating(prev => ({ ...prev, crypto: true }));
        try {
          navigate('/crypto/btc-xpub-generator');
        } finally {
          setSimulating(prev => ({ ...prev, crypto: false }));
        }
      }
    },
    {
      id: 'admin',
      title: 'Admin Panel',
      description: 'Test admin features and management tools',
      icon: '⚙️',
      color: 'purple',
      action: async () => {
        setSimulating(prev => ({ ...prev, admin: true }));
        try {
          navigate('/admin/nextgen');
        } finally {
          setSimulating(prev => ({ ...prev, admin: false }));
        }
      }
    },
    {
      id: 'cost-estimator',
      title: 'Cost Estimator',
      description: 'Test the AI cost estimation functionality',
      icon: '💰',
      color: 'green',
      action: async () => {
        setSimulating(prev => ({ ...prev, costEstimator: true }));
        try {
          navigate('/cost-estimator');
        } finally {
          setSimulating(prev => ({ ...prev, costEstimator: false }));
        }
      }
    }
  ];

  const getButtonClass = (color, isSimulating) => {
    const baseClass = "btn text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
    const colorClasses = {
      emerald: "bg-emerald-500 hover:bg-emerald-600",
      blue: "bg-blue-500 hover:bg-blue-600",
      indigo: "bg-indigo-500 hover:bg-indigo-600",
      orange: "bg-orange-500 hover:bg-orange-600",
      purple: "bg-purple-500 hover:bg-purple-600",
      green: "bg-green-500 hover:bg-green-600"
    };
    return `${baseClass} ${colorClasses[color]}`;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="sidebar-shell-main">
        {/* Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                🧪 Simulation Center
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Test and simulate various application features and workflows
              </p>
            </div>

            {/* Simulation Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {simulationFunctions.map((func) => (
                <div
                  key={func.id}
                  className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{func.icon}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                          {func.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                    {func.description}
                  </p>
                  
                  <button
                    onClick={func.action}
                    disabled={simulating[func.id]}
                    className={getButtonClass(func.color, simulating[func.id])}
                  >
                    {simulating[func.id] ? (
                      <>
                        <svg className="w-4 h-4 fill-current opacity-50 shrink-0 mr-2 animate-spin" viewBox="0 0 16 16">
                          <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm4.5 6.5L7 12l-2.5-2.5L3 11l4 4 6-6-1.5-1.5z" />
                        </svg>
                        Simulating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 fill-current opacity-50 shrink-0 mr-2" viewBox="0 0 16 16">
                          <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm4.5 6.5L7 12l-2.5-2.5L3 11l4 4 6-6-1.5-1.5z" />
                        </svg>
                        Simulate
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-12 bg-slate-50 dark:bg-slate-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
                Quick Actions
              </h2>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn bg-slate-500 hover:bg-slate-600 text-white"
                >
                  ← Back to Dashboard
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="btn bg-slate-400 hover:bg-slate-500 text-white"
                >
                  🔄 Refresh Page
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

export default Simulation;
