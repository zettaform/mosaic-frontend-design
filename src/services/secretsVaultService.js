// Mock Secrets Vault Service for Frontend Design Preview

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const secretsVaultService = {
  getSecrets: async () => {
    await delay();
    return [
      { id: 'sec_1', name: 'DEMO_FRONTEND_TOKEN', value: '••••••••••••••••', created: '2026-01-01' },
    ];
  },
  storeSecret: async (name, value) => {
    await delay();
    return { success: true };
  }
};

export default secretsVaultService;
