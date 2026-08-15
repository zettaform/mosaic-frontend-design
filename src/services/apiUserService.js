// Mock ApiUserService for Frontend Design Preview

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

class ApiUserService {
  constructor() {
    this.baseUrl = '';
  }

  getSessionToken() {
    return localStorage.getItem('sessionToken') || localStorage.getItem('token') || '';
  }

  async makeRequest(endpoint, options = {}) {
    await delay();
    return { success: true };
  }

  async getUsers() {
    await delay();
    return [
      { id: 1, username: 'demo_user', email: 'designer@demo.com', full_name: 'UI/UX Designer', role: 'admin' },
      { id: 2, username: 'alex_designer', email: 'alex@example.com', full_name: 'Alex Morgan', role: 'user' },
    ];
  }

  async getUser(id) {
    await delay();
    return { id, username: 'demo_user', email: 'designer@demo.com', full_name: 'UI/UX Designer' };
  }

  async updateUser(id, data) {
    await delay();
    return { success: true, id, ...data };
  }
}

export const apiUserService = new ApiUserService();
export default apiUserService;
