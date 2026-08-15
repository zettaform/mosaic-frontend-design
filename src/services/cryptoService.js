// Mock Crypto Service for Frontend Design Preview

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const cryptoService = {
  generateAddresses: async () => {
    await delay();
    return [
      { currency: 'BTC', address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', balance: '0.45 BTC' },
      { currency: 'ETH', address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', balance: '3.2 ETH' },
    ];
  },
  getRates: async () => {
    await delay();
    return { BTC: 64200.00, ETH: 3450.00 };
  }
};

export default cryptoService;