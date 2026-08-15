// Application Configuration
// This file contains application configuration (AWS references removed)

export const ENVIRONMENT = process.env.REACT_APP_ENVIRONMENT || 'dev';

// Table/Container names (for backend API calls)
export const TABLE_NAMES = {
  users: `${ENVIRONMENT}-users`,
  customers: `${ENVIRONMENT}-customers`,
  feedback: `${ENVIRONMENT}-feedback`,
  orders: `${ENVIRONMENT}-orders`,
  analytics: `${ENVIRONMENT}-analytics`,
  promptTemplates: `${ENVIRONMENT}-prompt-templates`,
  aiModels: `${ENVIRONMENT}-ai-models`
};
