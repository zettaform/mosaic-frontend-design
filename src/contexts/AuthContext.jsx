import React, { createContext, useState, useContext, useEffect } from 'react';
import backendAuthService from '../services/backendAuthService';
import onboardingService from '../services/onboardingService';
import { useNavigate } from 'react-router-dom';
import { ONBOARDING_CONFIG } from '../config/onboarding';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for authentication on initial load
    const checkAuth = async () => {
      try {
        if (backendAuthService.isAuthenticated()) {
          const currentUser = await backendAuthService.getCurrentUser();
          if (currentUser) {
            // Check onboarding status - controlled by configuration
            if (ONBOARDING_CONFIG.checkOnboardingStatus) {
              try {
                const onboardingStatus = await onboardingService.getOnboardingStatus(currentUser.user_id);
                if (onboardingStatus.success) {
                  currentUser.onboarding_completed = onboardingStatus.onboarding_completed;
                }
              } catch (error) {
                console.error('Error checking onboarding status:', error);
                // Don't fail auth if onboarding check fails
              }
            } else {
              // Set default onboarding status to true when onboarding is disabled
              currentUser.onboarding_completed = true;
            }

            console.log('🔍 AuthContext: Setting user:', {
              email: currentUser.email,
              user_id: currentUser.user_id,
              role: currentUser.role,
              permissions: currentUser.permissions
            });
            setUser(currentUser);
          } else {
            // Invalid token - clear auth silently
            backendAuthService.clearSessionToken();
          }
        }
      } catch (error) {
        // Silently handle all auth check errors - don't break the app
        console.warn('⚠️  Auth check failed (this is normal if tables are missing):', error.message || error);
        // Don't sign out - just continue without auth
        // This prevents 500 errors when tables don't exist
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signup = async (userData) => {
    try {
      // Use backend authentication service
      const result = await backendAuthService.signup({
        email: userData.email,
        password: userData.password,
        name: userData.name
      });
      
      if (result.success) {
        setUser(result.user);
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error || 'Signup failed' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Signup failed' };
    }
  };

  const signin = async ({ email, password }) => {
    try {
      // Try backend authentication first
      const result = await backendAuthService.signin(email, password);

      if (result.success) {
        // Set onboarding status - only check if actually enabled (to avoid unnecessary API calls)
        if (ONBOARDING_CONFIG.checkOnboardingStatus && ONBOARDING_CONFIG.enabled) {
          // Only check onboarding if it's enabled - but don't block login if it fails
          onboardingService.getOnboardingStatus(result.user.user_id || result.user.userId)
            .then(onboardingStatus => {
              if (onboardingStatus.success) {
                result.user.onboarding_completed = onboardingStatus.status?.isCompleted || false;
              } else {
                result.user.onboarding_completed = true; // Default to true on error
              }
            })
            .catch(error => {
              console.error('❌ AuthContext: Error checking onboarding status (non-blocking):', error);
              result.user.onboarding_completed = true; // Set default to true on error
            });
        } else {
          // Set default onboarding status to true when onboarding is disabled - no API call needed
          result.user.onboarding_completed = true;
        }

        // Set user immediately without waiting for onboarding check
        setUser(result.user);
        return { success: true, user: result.user };
      }

      // Backend auth failed
      return { success: false, error: result.error || 'Invalid credentials' };
    } catch (err) {
      console.error('❌ AuthContext: Signin failed:', err);
      return { success: false, error: err.message || 'Signin failed' };
    }
  };

  const signout = async () => {
    await backendAuthService.signout();
    setUser(null);
    navigate('/');
  };

  const updateUser = async (userData) => {
    try {
      // Mock update - just update local state
      const updated = { ...user, ...userData };
      setUser(updated);
      return updated;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  // Mock refresh user
  const refreshUser = async () => {
    try {
      // Just return current user
      return user;
    } catch (e) {
      console.error('Failed to refresh user', e);
      throw e;
    }
  };

  // Mock change avatar
  const changeAvatar = async (avatar) => {
    const updated = { ...user, avatar };
    setUser(updated);
    return updated;
  };

  const updateOnboardingStep = async (stepData) => {
    try {
      const nextStep = stepData.step ? stepData.step + 1 : (user?.onboarding_step || 1) + 1;
      const updated = { 
        ...user, 
        onboarding: {
          ...user?.onboarding,
          ...stepData.data
        },
        onboarding_step: nextStep
      };
      setUser(updated);
      return { success: true, user: updated };
    } catch (error) {
      console.error('Update onboarding step error:', error);
      return { success: false, error: error.message };
    }
  };
  
  const completeOnboarding = async () => {
    try {
      const updated = { ...user, onboarding_completed: true };
      setUser(updated);
      return { success: true, user: updated };
    } catch (error) {
      console.error('Complete onboarding error:', error);
      return { success: false, error: error.message };
    }
  };

  const resetOnboarding = async () => {
    try {
      const updated = { 
        ...user, 
        onboarding_completed: false,
        onboarding_step: 1
      };
      setUser(updated);
      return { success: true, user: updated };
    } catch (error) {
      console.error('Reset onboarding error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    currentUser: user,
    loading,
    signup,
    signin,
    signout,
    updateUser,
    changeAvatar,
    refreshUser,
    updateOnboardingStep,
    completeOnboarding,
    resetOnboarding,
    isAuthenticated: !!user,
    onboardingComplete: !!user?.onboarding_completed,
    currentOnboardingStep: user?.onboarding_step || 1,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export AuthContext for direct access
export { AuthContext };
