// Mock Cost Estimator Service for Frontend Design Preview

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const costEstimatorService = {
  getEstimates: async () => {
    await delay();
    return {
      monthlyEstimatedCost: 124.50,
      breakdown: [
        { service: 'Frontend Hosting (CDN)', cost: 15.00 },
        { service: 'Storage Assets', cost: 24.50 },
        { service: 'Database Multi-region', cost: 85.00 },
      ]
    };
  },
  calculateCost: (params) => {
    return { estimatedCost: 99.99 };
  }
};

export default costEstimatorService;
