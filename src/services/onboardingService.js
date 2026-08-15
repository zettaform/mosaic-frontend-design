// Mock Onboarding Service for Frontend Design Preview

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const onboardingService = {
  getStep: async () => {
    await delay();
    return { currentStep: 1, completed: false };
  },
  saveStep: async (stepData) => {
    await delay();
    return { success: true, stepData };
  },
  complete: async () => {
    await delay();
    return { success: true };
  }
};

export default onboardingService;
