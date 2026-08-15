import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const OnboardingRedirect = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      // If user is authenticated but hasn't completed onboarding, redirect to onboarding
      if (!user.onboarding_completed) {
        navigate('/onboarding');
      }
    }
  }, [user, loading, navigate]);

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to signin
  if (!user) {
    navigate('/signin');
    return null;
  }

  // If user hasn't completed onboarding, redirect to onboarding
  if (!user.onboarding_completed) {
    navigate('/onboarding');
    return null;
  }

  // User is authenticated and has completed onboarding, render children
  return children;
};

export default OnboardingRedirect;
