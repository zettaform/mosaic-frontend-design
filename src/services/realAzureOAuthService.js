// Mock Real Azure OAuth Service for Frontend Design Preview

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const realAzureOAuthService = {
  login: async () => {
    await delay();
    return { success: true, user: { name: 'Azure Mock User' } };
  },
  logout: async () => {
    await delay();
    return { success: true };
  },
};

export default realAzureOAuthService;