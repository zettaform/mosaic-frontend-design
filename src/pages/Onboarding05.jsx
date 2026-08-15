import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import onboardingService from '../services/onboardingService';

import OnboardingImage from '../images/onboarding-image.jpg';
import OnboardingDecoration from '../images/auth-decoration.png';

function Onboarding05() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [preferences, setPreferences] = useState({
    timezone: 'UTC',
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    integrations: {
      slack: false,
      google: false,
      microsoft: false
    },
    privacy: {
      dataSharing: false,
      analytics: true
    }
  });

  // Guards and step alignment
  useEffect(() => {
    if (!user) {
      navigate('/signin', { state: { from: location.pathname } });
      return;
    }
    
    // Check onboarding status
    checkOnboardingStatus();
  }, [user, navigate, location.pathname]);

  const checkOnboardingStatus = async () => {
    if (!user) return;
    
    try {
      const response = await onboardingService.getOnboardingStatus(user.user_id);
      if (response.success && response.onboarding_completed) {
        navigate('/');
        return;
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handlePreferenceChange = (category, key, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleNext = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const formData = {
        ...preferences,
        step5Done: true
      };
      
      const response = await onboardingService.saveOnboardingStep(user.user_id, 5, formData);
      if (response.success) navigate('/onboarding/complete');
    } catch (error) {
      console.error('Error saving step 5:', error);
      setError('Failed to save preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-white dark:bg-slate-900">

      <div className="relative flex">

        {/* Content */}
        <div className="w-full md:w-1/2">

          <div className="min-h-screen h-full flex flex-col after:flex-1">

            <div className="flex-1">

              {/* Header */}
              <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link className="block" to="/signin">
                  <svg width="32" height="32" viewBox="0 0 32 32">
                    <defs>
                      <linearGradient x1="28.538%" y1="20.229%" x2="100%" y2="108.156%" id="logo-a">
                        <stop stopColor="#A5B4FC" stopOpacity="0" offset="0%" />
                        <stop stopColor="#A5B4FC" offset="100%" />
                      </linearGradient>
                      <linearGradient x1="88.638%" y1="29.267%" x2="22.42%" y2="100%" id="logo-b">
                        <stop stopColor="#38BDF8" stopOpacity="0" offset="0%" />
                        <stop stopColor="#38BDF8" offset="100%" />
                      </linearGradient>
                    </defs>
                    <rect fill="#6366F1" width="32" height="32" rx="16" />
                    <path d="M18.277.16C26.035 1.267 32 7.938 32 16c0 8.837-7.163 16-16 16a15.937 15.937 0 01-10.426-3.863L18.277.161z" fill="#4F46E5" />
                    <path d="M7.404 2.503l18.339 26.19A15.93 15.93 0 0116 32C7.163 32 0 24.837 0 16 0 10.327 2.952 5.344 7.404 2.503z" fill="url(#logo-a)" />
                    <path d="M2.223 24.14L29.777 7.86A15.926 15.926 0 0132 16c0 8.837-7.163 16-16 16-5.864 0-10.991-3.154-13.777-7.86z" fill="url(#logo-b)" />
                  </svg>
                </Link>
                <div className="text-sm">
                  Have an account? <Link className="font-medium text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400" to="/signin">Sign In</Link>
                </div>
              </div>

              {/* Progress bar */}
              <div className="px-4 pt-12 pb-8">
                <div className="max-w-md mx-auto w-full">
                  <div className="relative">
                    <div className="absolute left-0 top-1/2 -mt-px w-full h-0.5 bg-slate-200 dark:bg-slate-700" aria-hidden="true"></div>
                    <ul className="relative flex justify-between w-full">
                      <li>
                        <Link className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold bg-indigo-500 text-white" to="/onboarding/1">1</Link>
                      </li>
                      <li>
                        <Link className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold bg-indigo-500 text-white" to="/onboarding/2">2</Link>
                      </li>
                      <li>
                        <Link className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold bg-indigo-500 text-white" to="/onboarding/3">3</Link>
                      </li>
                      <li>
                        <Link className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold bg-indigo-500 text-white" to="/onboarding/4">4</Link>
                      </li>
                      <li>
                        <Link className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold bg-indigo-500 text-white" to="/onboarding/5">5</Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-8">
              <div className="max-w-md mx-auto">

                <h1 className="text-3xl text-slate-800 dark:text-slate-100 font-bold mb-6">Set your preferences ✨</h1>
                
                {error && (
                  <div className="mb-6 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm p-4 rounded">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleNext}>
                  <div className="space-y-6 mb-8">
                    
                    {/* Timezone */}
                    <div>
                      <label className="block text-sm font-medium mb-2" htmlFor="timezone">Timezone</label>
                      <select 
                        id="timezone" 
                        className="form-select w-full"
                        value={preferences.timezone}
                        onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                      >
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="Europe/Paris">Paris (CET)</option>
                        <option value="Asia/Tokyo">Tokyo (JST)</option>
                        <option value="Asia/Shanghai">Shanghai (CST)</option>
                      </select>
                    </div>

                    {/* Notifications */}
                    <div>
                      <h3 className="text-sm font-medium mb-3">Notification Preferences</h3>
                      <div className="space-y-3">
                        {Object.entries(preferences.notifications).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                              {key === 'email' ? 'Email notifications' : 
                               key === 'push' ? 'Push notifications' : 
                               'SMS notifications'}
                            </span>
                            <div className="form-switch">
                              <input 
                                type="checkbox" 
                                id={`notify-${key}`}
                                checked={value}
                                onChange={(e) => handlePreferenceChange('notifications', key, e.target.checked)}
                                className="sr-only" 
                              />
                              <label className="bg-slate-400 dark:bg-slate-700" htmlFor={`notify-${key}`}>
                                <span className="bg-white shadow-sm" aria-hidden="true"></span>
                                <span className="sr-only">Toggle {key} notifications</span>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Integrations */}
                    <div>
                      <h3 className="text-sm font-medium mb-3">API Integrations</h3>
                      <div className="space-y-3">
                        {Object.entries(preferences.integrations).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                              {key === 'slack' ? 'Slack Integration' : 
                               key === 'google' ? 'Google Workspace' : 
                               'Microsoft 365'}
                            </span>
                            <div className="form-switch">
                              <input 
                                type="checkbox" 
                                id={`integrate-${key}`}
                                checked={value}
                                onChange={(e) => handlePreferenceChange('integrations', key, e.target.checked)}
                                className="sr-only" 
                              />
                              <label className="bg-slate-400 dark:bg-slate-700" htmlFor={`integrate-${key}`}>
                                <span className="bg-white shadow-sm" aria-hidden="true"></span>
                                <span className="sr-only">Toggle {key} integration</span>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Privacy */}
                    <div>
                      <h3 className="text-sm font-medium mb-3">Privacy Settings</h3>
                      <div className="space-y-3">
                        {Object.entries(preferences.privacy).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {key === 'dataSharing' ? 'Allow data sharing for product improvement' : 
                               'Enable analytics and usage tracking'}
                            </span>
                            <div className="form-switch">
                              <input 
                                type="checkbox" 
                                id={`privacy-${key}`}
                                checked={value}
                                onChange={(e) => handlePreferenceChange('privacy', key, e.target.checked)}
                                className="sr-only" 
                              />
                              <label className="bg-slate-400 dark:bg-slate-700" htmlFor={`privacy-${key}`}>
                                <span className="bg-white shadow-sm" aria-hidden="true"></span>
                                <span className="sr-only">Toggle {key} privacy setting</span>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Link className="text-sm underline hover:no-underline" to="/onboarding/4">&lt;- Back</Link>
                    <button 
                      type="submit" 
                      className="btn bg-indigo-500 hover:bg-indigo-600 text-white ml-auto disabled:opacity-50" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Next Step ->'}
                    </button>
                  </div>
                </form>

              </div>
            </div>

          </div>

        </div>

        {/* Image */}
        <div className="hidden md:block absolute top-0 bottom-0 right-0 md:w-1/2" aria-hidden="true">
          <img className="object-cover object-center w-full h-full" src={OnboardingImage} width="760" height="1024" alt="Onboarding" />
          <img className="absolute top-1/4 left-0 -translate-x-1/2 ml-8 hidden lg:block" src={OnboardingDecoration} width="218" height="224" alt="Authentication decoration" />
        </div>

      </div>

    </main>
  );
}

export default Onboarding05;
