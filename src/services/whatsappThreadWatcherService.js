// Mock WhatsApp Thread Watcher Service for Frontend Design Preview

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const whatsappThreadWatcherService = {
  getThreads: async () => {
    await delay();
    return [];
  },
  startWatching: async () => {
    await delay();
    return { success: true };
  }
};

export default whatsappThreadWatcherService;
