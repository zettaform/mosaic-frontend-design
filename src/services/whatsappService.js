// Mock WhatsApp Service for Frontend Design Preview

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const whatsappService = {
  getMessages: async () => {
    await delay();
    return [
      { id: 'wa_1', sender: '+1 555 019 2831', text: 'Hello! Checking layout feedback.', timestamp: '10:42 AM' },
    ];
  },
  sendMessage: async (to, text) => {
    await delay();
    return { success: true };
  },
  getTemplates: async () => {
    await delay();
    return [
      { id: 1, name: 'welcome_template', language: 'en', category: 'MARKETING', components: [] },
      { id: 2, name: 'proposal_template', language: 'en', category: 'UTILITY', components: [] },
    ];
  },
  createTemplate: async (data) => {
    await delay();
    return { success: true, id: Date.now(), ...data };
  },
  sendCampaign: async (campaignData) => {
    await delay();
    return { success: true, campaignId: `cmp_${Date.now()}` };
  },
  testConnection: async () => {
    await delay();
    return { success: true, message: 'Connected to Mock WhatsApp Service' };
  }
};

export function normalizeTemplatesResponse(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.dataObj !== undefined) {
    return Array.isArray(data.dataObj) ? data.dataObj : data.dataObj ? [data.dataObj] : [];
  }
  if (Array.isArray(data.templates)) return data.templates;
  return [];
}

export function getTemplateNumericId(template) {
  if (!template || typeof template !== 'object') return null;
  const raw = template.id ?? template.templateId ?? template.TemplateId ?? template.tempId;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function extractCampaignSendResult(data) {
  if (data == null) return { campaignId: null, raw: data };
  if (typeof data === 'number' || typeof data === 'string') {
    return { campaignId: String(data).trim() || null, raw: data };
  }
  return { campaignId: 'cmp_mock_123', raw: data };
}

export default whatsappService;
