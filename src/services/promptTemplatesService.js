// Mock Prompt Templates Service for Frontend Design Preview

import { mockPromptTemplates } from '../mock/mockData';

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const promptTemplatesService = {
  getTemplates: async () => {
    await delay();
    return mockPromptTemplates;
  },
  createTemplate: async (data) => {
    await delay();
    const newTpl = { id: `tpl-${Date.now()}`, ...data };
    mockPromptTemplates.push(newTpl);
    return newTpl;
  },
  updateTemplate: async (id, data) => {
    await delay();
    return { id, ...data };
  },
  deleteTemplate: async (id) => {
    await delay();
    return { success: true };
  }
};

export default promptTemplatesService;
