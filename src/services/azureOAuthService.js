// Mock Azure OAuth Service for Frontend Design Preview

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const azureOAuthService = {
  getAuthUrl: async () => {
    await delay();
    return '#';
  },
  handleCallback: async (code) => {
    await delay();
    return { success: true, user: { name: 'Azure Mock User', email: 'azure@demo.com' } };
  },
  getStatus: async () => {
    await delay();
    return { connected: true, provider: 'Azure OAuth (Mock)' };
  },
};

export default azureOAuthService;