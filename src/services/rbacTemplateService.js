// Mock RBAC Template Service for Frontend Design Preview

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const rbacTemplateService = {
  getRoles: async () => {
    await delay();
    return [
      { id: 'role_admin', name: 'Administrator', permissions: ['all'] },
      { id: 'role_designer', name: 'Designer', permissions: ['ui.read', 'ui.edit'] },
      { id: 'role_user', name: 'User', permissions: ['dashboard.view'] },
    ];
  }
};

export default rbacTemplateService;
