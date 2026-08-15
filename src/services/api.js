// Clean Frontend Mock API Service

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const API_BASE = '';

export const buildAvatarUrl = (filename) => {
  return `/avatars/${filename || 'avatar1.png'}`;
};

const mockUser = {
  id: 1,
  username: 'demo_user',
  email: 'designer@demo.com',
  full_name: 'UI/UX Designer',
  role: 'admin',
  avatar: 'avatar1.png',
  disabled: false,
  onboarding_completed: true,
};

export const authApi = {
  signup: async (userData) => {
    await delay();
    return { success: true, user: { ...mockUser, ...userData } };
  },

  login: async (email, password) => {
    await delay();
    const token = 'mock_jwt_token_for_designer_session';
    localStorage.setItem('token', token);
    localStorage.setItem('sessionToken', token);
    return { success: true, data: { access_token: token, user: mockUser } };
  },

  getCurrentUser: async () => {
    await delay();
    return mockUser;
  },

  getAvatars: async () => {
    await delay();
    return ['avatar1.png', 'avatar2.png', 'avatar3.png', 'avatar4.png', 'avatar5.png'];
  },

  uploadAvatar: async (file) => {
    await delay();
    return 'avatar1.png';
  },

  updateAvatar: async (userId, avatar, customAvatar) => {
    await delay();
    mockUser.avatar = avatar;
    return mockUser;
  },

  changePassword: async (currentPassword, newPassword) => {
    await delay();
    return { success: true, message: 'Password updated successfully' };
  },

  completeOnboarding: async () => {
    await delay();
    mockUser.onboarding_completed = true;
    return { success: true };
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('sessionToken');
    return Promise.resolve({ success: true });
  },

  isAuthenticated: () => {
    return true; // Always return true in demo design mode for seamless navigation
  },
};

export const adminApi = {
  listUsers: async () => {
    await delay();
    return [
      mockUser,
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
  },
  createUser: async (userData) => {
    await delay();
    return {
      id: Date.now(),
      ...userData,
      avatar: userData.avatar || 'avatar1.png',
      onboarding_completed: true,
      role: 'user',
    };
  },
};

const api = {
  get: async () => ({ data: {} }),
  post: async () => ({ data: { success: true } }),
  put: async () => ({ data: { success: true } }),
  delete: async () => ({ data: { success: true } }),
  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} },
  },
};

export default api;
