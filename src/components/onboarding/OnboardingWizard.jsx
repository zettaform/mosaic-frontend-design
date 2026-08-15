import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const OnboardingWizard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }

    // Redirect to the first onboarding step
    navigate('/onboarding/1');
  }, [user, navigate]);

  // Show loading while redirecting
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
    </div>
  );
};

export default OnboardingWizard;