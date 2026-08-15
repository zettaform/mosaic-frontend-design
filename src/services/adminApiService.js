// Clean Mock Admin API Service for Frontend Design Preview

export const API_BASE_URL = '';

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

const mockUsersList = [
  {
    id: 1,
    username: 'demo_user',
    email: 'designer@demo.com',
    full_name: 'UI/UX Designer',
    role: 'admin',
    avatar: 'avatar1.png',
    disabled: false,
    onboarding_completed: true,
  },
  {
    id: 2,
    username: 'alex_designer',
    email: 'alex@example.com',
    full_name: 'Alex Morgan',
    role: 'user',
    avatar: 'avatar2.png',
    disabled: false,
    onboarding_completed: true,
  },
  {
    id: 3,
    username: 'sarah_dev',
    email: 'sarah@example.com',
    full_name: 'Sarah Connor',
    role: 'user',
    avatar: 'avatar3.png',
    disabled: false,
    onboarding_completed: true,
  },
];

class AdminApiService {
  constructor() {
    this.baseUrl = '';
  }

  async makeRequest(endpoint, options = {}) {
    await delay();
    return { success: true, data: [] };
  }

  async getUsers() {
    await delay();
    return mockUsersList;
  }

  async createUser(userData) {
    await delay();
    const newUser = { id: Date.now(), ...userData, role: 'user' };
    mockUsersList.push(newUser);
    return newUser;
  }

  async updateUser(userId, userData) {
    await delay();
    return { success: true, userId, ...userData };
  }

  async deleteUser(userId) {
    await delay();
    return { success: true };
  }

  async getLogs() {
    await delay();
    return [
      { id: 1, timestamp: new Date().toISOString(), action: 'LOGIN', user: 'designer@demo.com', status: 'SUCCESS' },
      { id: 2, timestamp: new Date().toISOString(), action: 'UPDATE_PROFILE', user: 'designer@demo.com', status: 'SUCCESS' },
    ];
  }

  async getSystemStats() {
    await delay();
    return {
      activeUsers: 142,
      totalRequests: 18920,
      cpuLoad: '12%',
      memoryUsage: '44%',
    };
  }

  async getApiKeys() {
    await delay();
    return [
      { id: 'key_1', name: 'Frontend Design Token', created: '2026-01-01', status: 'Active' },
    ];
  }
}

export const adminApiService = new AdminApiService();
export default adminApiService;
