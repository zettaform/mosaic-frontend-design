// Mock DB Service for Frontend Design Preview

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const dbService = {
  query: async () => {
    await delay();
    return { rows: [], count: 0 };
  },
  getStatus: async () => {
    await delay();
    return { status: 'mock_connected' };
  }
};

export default dbService;
