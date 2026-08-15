// Mock Authentication Service for Frontend Design Preview

class BackendAuthService {
  constructor() {
    this.currentUser = {
      username: 'demo_user',
      email: 'designer@demo.com',
      full_name: 'UI/UX Designer',
      role: 'admin',
      avatar: 'avatar1.png',
      user_id: 'usr_demo_123',
    };
    this.sessionToken = 'mock_jwt_token_for_designer_session';
  }

  setSessionToken(token) {
    this.sessionToken = token;
    if (token) {
      localStorage.setItem('sessionToken', token);
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('token');
    }
  }

  getSessionToken() {
    return this.sessionToken || localStorage.getItem('sessionToken') || 'mock_jwt_token_for_designer_session';
  }

  getToken() {
    return this.getSessionToken();
  }

  clearSessionToken() {
    this.sessionToken = null;
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('token');
  }

  async login(username, password) {
    this.setSessionToken('mock_jwt_token_for_designer_session');
    return {
      success: true,
      token: 'mock_jwt_token_for_designer_session',
      user: this.currentUser,
    };
  }

  async logout() {
    this.clearSessionToken();
    return { success: true };
  }

  async getCurrentUser() {
    return this.currentUser;
  }

  async updateProfile(profileData) {
    this.currentUser = { ...this.currentUser, ...profileData };
    return { success: true, user: this.currentUser };
  }

  isAuthenticated() {
    return true;
  }
}

export const backendAuthService = new BackendAuthService();
export default backendAuthService;
