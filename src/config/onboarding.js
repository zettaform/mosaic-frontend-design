// Onboarding Feature Configuration
// Set to true to enable onboarding flow, false to disable
export const ONBOARDING_ENABLED = false;

// Onboarding configuration
export const ONBOARDING_CONFIG = {
  enabled: ONBOARDING_ENABLED,
  steps: [
    { path: '/onboarding/1', step: 1, title: 'User Type Selection' },
    { path: '/onboarding/2', step: 2, title: 'Company Type Selection' },
    { path: '/onboarding/3', step: 3, title: 'Company Information' },
    { path: '/onboarding/4', step: 4, title: 'Team Setup' },
    { path: '/onboarding/5', step: 5, title: 'Preferences' },
    { path: '/onboarding/complete', step: 'complete', title: 'Complete' }
  ],
  redirectToOnboarding: ONBOARDING_ENABLED,
  checkOnboardingStatus: ONBOARDING_ENABLED
};

export default ONBOARDING_CONFIG;
