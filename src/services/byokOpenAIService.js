// Mock BYOK OpenAI Service for Frontend Design Preview

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const byokOpenAIService = {
  saveKey: async (key) => {
    await delay();
    return { success: true, message: 'Key saved (Mock)' };
  },
  getKeyStatus: async () => {
    await delay();
    return { configured: true, maskedKey: 'sk-proj-...demo' };
  },
  deleteKey: async () => {
    await delay();
    return { success: true };
  },
};

export default byokOpenAIService;
