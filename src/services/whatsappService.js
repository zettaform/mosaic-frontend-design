// Mock WhatsApp Service for Frontend Design Preview

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const whatsappService = {
  getMessages: async () => {
    await delay();
    return [
      { id: 'wa_1', sender: '+1 555 019 2831', text: 'Hello! Checking layout feedback.', timestamp: '10:42 AM' },
    ];
  },
  sendMessage: async (to, text) => {
    await delay();
    return { success: true };
  }
};

export default whatsappService;
