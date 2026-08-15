// Mock Postmark Template Service for Frontend Design Preview

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const postmarkTemplateService = {
  getTemplates: async () => {
    await delay();
    return [
      { id: 'tpl_welcome', name: 'Welcome Email', alias: 'welcome-user' },
      { id: 'tpl_reset', name: 'Password Reset', alias: 'password-reset' }
    ];
  }
};

export default postmarkTemplateService;
