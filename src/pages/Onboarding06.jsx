import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import onboardingService from '../services/onboardingService';

import OnboardingImage from '../images/onboarding-image.jpg';
import OnboardingDecoration from '../images/auth-decoration.png';

function Onboarding04() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamEmails, setTeamEmails] = useState(['']);
  const [error, setError] = useState('');

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

  const addTeamEmail = () => {
    setTeamEmails([...teamEmails, '']);
  };

  const removeTeamEmail = (index) => {
    if (teamEmails.length > 1) {
      setTeamEmails(teamEmails.filter((_, i) => i !== index));
    }
  };

  const updateTeamEmail = (index, value) => {
    const updated = [...teamEmails];
    updated[index] = value;
    setTeamEmails(updated);
  };

  const handleNext = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Filter out empty emails
      const validEmails = teamEmails.filter(email => email.trim() !== '');
      
      const formData = {
        teamEmails: validEmails,
        teamSize: validEmails.length,
        step4Done: true
      };
      
      const response = await onboardingService.saveOnboardingStep(user.user_id, 4, formData);
      if (response.success) navigate('/onboarding/5');
    } catch (error) {
      console.error('Error saving step 4:', error);
      setError('Failed to save team information. Please try again.');
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
                        <Link className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400" to="/onboarding/5">5</Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-8">
              <div className="max-w-md mx-auto">

                <h1 className="text-3xl text-slate-800 dark:text-slate-100 font-bold mb-6">Invite your team ✨</h1>
                
                {error && (
                  <div className="mb-6 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm p-4 rounded">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleNext}>
                  <div className="space-y-4 mb-8">
                    <div>
                      <label className="block text-sm font-medium mb-2">Team Member Emails</label>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Invite your colleagues to join your workspace. You can add more later.
                      </p>
                      
                      {teamEmails.map((email, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-3">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => updateTeamEmail(index, e.target.value)}
                            className="form-input flex-1"
                            placeholder="colleague@company.com"
                          />
                          {teamEmails.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTeamEmail(index)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={addTeamEmail}
                        className="text-sm text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        + Add another team member
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Link className="text-sm underline hover:no-underline" to="/onboarding/3">&lt;- Back</Link>
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

export default Onboarding04;