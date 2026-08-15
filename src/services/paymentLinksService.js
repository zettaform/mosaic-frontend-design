// Mock Payment Links Service for Frontend Design Preview

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const paymentLinksService = {
  getLinks: async () => {
    await delay();
    return [
      { id: 'link_1', title: 'Enterprise Subscription', amount: '$499.00', status: 'Active', url: 'https://pay.demo/link_1' },
      { id: 'link_2', title: 'Starter Plan', amount: '$49.00', status: 'Active', url: 'https://pay.demo/link_2' }
    ];
  },
  createLink: async (data) => {
    await delay();
    return { id: `link_${Date.now()}`, ...data, status: 'Active' };
  }
};

export default paymentLinksService;
