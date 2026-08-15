// Mock S3 Avatar Service for Frontend Design Preview

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const s3AvatarService = {
  getAvatarUrl: (avatarName) => {
    return `/avatars/${avatarName || 'avatar1.png'}`;
  },
  uploadAvatar: async (file) => {
    await delay();
    return '/avatars/avatar1.png';
  }
};

export default s3AvatarService;
