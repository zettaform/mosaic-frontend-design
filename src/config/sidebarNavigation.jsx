// Navigation configuration for the sidebar
// This consolidates all navigation items into a data-driven structure
import { Icon } from '../assets/icons';

export const sidebarNavigation = [
  {
    id: 'ecommerce',
    title: 'E-commerce',
    section: 'Ecommerce',
    items: [
      {
        id: 'ecommerce-users',
        route: '/ecommerce/users',
        label: 'Users',
        page: 'Users',
        end: false,
        icon: <Icon name="users" />
      },
      {
        id: 'ecommerce-admin-console',
        route: '/ecommerce/admin-console',
        label: 'Admin Console',
        page: 'Admin Console',
        end: false,
        icon: <Icon name="settings" />
      }
    ]
  },
  {
    id: 'crypto',
    title: 'Crypto',
    section: 'Crypto',
    items: [
      {
        id: 'crypto-payment-links',
        route: '/crypto/payment-links-luxury',
        label: 'Payment Links',
        page: 'Payment Links',
        end: false,
        icon: <Icon name="payment-links" />
      },
      {
        id: 'crypto-creem-payment-links',
        route: '/crypto/creem-payment-links',
        label: 'Payment Links (Creem)',
        page: 'Payment Links (Creem)',
        end: false,
        icon: <Icon name="payment-links" />
      },
      {
        id: 'crypto-logs',
        route: '/crypto/logs',
        label: 'Logs',
        page: 'Logs',
        end: false,
        icon: <Icon name="logs" />
      },
      {
        id: 'crypto-btc-xpub-generator',
        route: '/crypto/btc-xpub-generator',
        label: 'BTC Xpub Generator',
        page: 'BTC Xpub Generator',
        end: false,
        icon: <Icon name="btc-xpub-generator" />
      },
      {
        id: 'crypto-generated-addresses',
        route: '/crypto/generated-addresses',
        label: 'Generated Addresses',
        page: 'Generated Addresses',
        end: false,
        icon: <Icon name="generated-addresses" />
      }
    ]
  },
  {
    id: 'settings',
    title: 'Settings',
    section: 'Settings',
    items: [
      {
        id: 'settings',
        route: '/settings/account',
        label: 'Settings',
        page: 'Account',
        end: false,
        icon: <Icon name="account" />
      },
      {
        id: 'settings-byok',
        route: '/settings/byok',
        label: 'BYOK (API keys)',
        page: 'BYOK Keys',
        end: false,
        icon: <Icon name="key" />
      }
    ]
  },
  {
    id: 'email',
    title: 'Email',
    section: 'Email',
    items: [
      {
        id: 'email-tags',
        route: '/email/tags',
        label: 'Tags',
        page: 'Tags',
        end: false,
        icon: <Icon name="admin-feedback" />
      },
      {
        id: 'email-reply',
        route: '/email/reply',
        label: 'Reply Simulator',
        page: 'Reply Simulator',
        end: false,
        icon: <Icon name="instagram-api-keys" />
      },
      {
        id: 'email-manual-replies',
        route: '/email/manual-replies',
        label: 'Manual Replies',
        page: 'Manual Replies',
        end: false,
        icon: <Icon name="chat" />
      },
      {
        id: 'email-manual-sends',
        route: '/email/manual-sends',
        label: 'Manual Sends',
        page: 'Manual Sends',
        end: false,
        icon: <Icon name="templates" />
      },
      {
        id: 'email-conversations',
        route: '/email/conversations',
        label: 'Gmail Conversations',
        page: 'Gmail Conversations',
        end: false,
        icon: <Icon name="admin-logs" />
      },
      {
        id: 'email-smtp',
        route: '/email/smtp',
        label: 'SMTP',
        page: 'SMTP',
        end: false,
        icon: <Icon name="smtp" />
      }
    ]
  },
  {
    id: 'admin',
    title: 'Admin',
    section: 'Admin',
    items: [
      {
        id: 'admin-feedback',
        route: '/admin/feedback',
        label: 'Feedback',
        page: 'Feedback',
        end: false,
        icon: <Icon name="cost-estimator" />
      },
      {
        id: 'admin-instagram-api-keys',
        route: '/admin/instagram-api-keys',
        label: 'Instagram API Keys',
        page: 'Instagram API Keys',
        end: false,
        icon: <Icon name="ai-models" />
      },
      {
        id: 'admin-mediafy-api-keys',
        route: '/admin/mediafy-api-keys',
        label: 'Mediafy API Keys',
        page: 'MediafyApiKeys',
        end: false,
        icon: <Icon name="mediafy-api-keys" />
      },
      {
        id: 'admin-logs',
        route: '/admin/logs',
        label: 'Logs',
        page: 'Logs',
        end: false,
        icon: <Icon name="tasks" />
      },
      {
        id: 'user-creation-demo',
        route: '/user-creation-demo',
        label: 'User Creation Demo',
        page: 'User Creation Demo',
        end: false,
        icon: <Icon name="statistics" />
      },
      {
        id: 'admin-cost-estimator',
        route: '/admin/cost-estimator',
        label: 'Cost Estimator',
        page: 'Cost Estimator',
        end: false,
        icon: <Icon name="active-durable-functions" />
      },
      {
        id: 'admin-ai-models',
        route: '/admin/ai-models',
        label: 'AI Models',
        page: 'AIModels',
        end: false,
        icon: <Icon name="task-settings" />
      },
      {
        id: 'admin-tasks',
        route: '/admin/tasks',
        label: 'Tasks',
        page: 'Tasks',
        end: false,
        icon: <Icon name="mediafy-api" />
      },
      {
        id: 'admin-email-templates',
        route: '/admin/email-templates',
        label: 'Email Templates',
        page: 'EmailTemplates',
        end: false,
        icon: <Icon name="templates" />
      },
      {
        id: 'admin-followers-scraping',
        route: '/admin/followers-scraping',
        label: 'Followers Scraping',
        page: 'FollowersScraping',
        end: false,
        icon: <Icon name="users" />
      },
      {
        id: 'admin-single-email-send',
        route: '/admin/single-email-send',
        label: 'Single Email Send',
        page: 'SingleEmailSend',
        end: false,
        icon: <Icon name="templates" />
      },
      {
        id: 'admin-sendgrid-email-send',
        route: '/admin/sendgrid-email-send',
        label: 'SendGrid Email Send',
        page: 'SendGridEmailSend',
        end: false,
        icon: <Icon name="smtp" />
      },
      {
        id: 'admin-mautic-campaign-send',
        route: '/admin/mautic-campaign-send',
        label: 'Campaign Send (Mautic)',
        page: 'MauticCampaignSend',
        end: false,
        icon: <Icon name="campaigns" />
      },
      {
        id: 'admin-durable-sendgrid',
        route: '/admin/durable-sendgrid',
        label: 'Durable SendGrid',
        page: 'DurableSendgrid',
        end: false,
        icon: <Icon name="smtp" />
      },
      {
        id: 'admin-durable-sendgrid-runs',
        route: '/admin/durable-sendgrid-runs',
        label: 'Durable SendGrid Runs',
        page: 'DurableSendgridRuns',
        end: false,
        icon: <Icon name="active-durable-functions" />
      },
      {
        id: 'admin-mailgun-test',
        route: '/admin/mailgun-test',
        label: 'Mailgun Test',
        page: 'MailgunTest',
        end: false,
        icon: <Icon name="smtp" />
      },
      {
        id: 'admin-mailgun-domains',
        route: '/admin/mailgun-domains',
        label: 'Mailgun Domains',
        page: 'MailgunDomains',
        end: false,
        icon: <Icon name="mailgun-domains" />
      },
      {
        id: 'admin-mailgun-snowflakesend',
        route: '/admin/mailgun-snowflakesend',
        label: 'Mailgun Snowflake Send',
        page: 'MailgunSnowflakeSend',
        end: false,
        icon: <Icon name="smtp" />
      },
      {
        id: 'admin-mailgun-campaigns',
        route: '/admin/mailgun-campaigns',
        label: 'Mailgun Campaigns',
        page: 'MailgunCampaigns',
        end: false,
        icon: <Icon name="campaigns" />
      },
      {
        id: 'admin-mailgun-campaign-operations',
        route: '/admin/mailgun-campaign-operations',
        label: 'Mailgun Campaign Operations',
        page: 'MailgunCampaignOperations',
        end: false,
        icon: <Icon name="active-durable-functions" />
      },
      {
        id: 'admin-mailgun-campaign-logs',
        route: '/admin/mailgun-campaign-logs',
        label: 'Campaign Logs',
        page: 'MailgunCampaignLogs',
        end: false,
        icon: <Icon name="logs" />
      },
      {
        id: 'admin-statistics',
        route: '/admin/statistics',
        label: 'Statistics',
        page: 'Statistics',
        end: false,
        icon: <Icon name="chat" />
      },
      {
        id: 'admin-active-durable-functions',
        route: '/admin/active-durable-functions',
        label: 'Active Durable Functions',
        page: 'ActiveDurableFunctions',
        end: false,
        icon: <Icon name="nextgen" />
      },
      {
        id: 'admin-task-settings',
        route: '/admin/task-settings',
        label: 'Task Settings',
        page: 'TaskSettings',
        end: false,
        icon: <Icon name="onboarding-records" />
      },
      {
        id: 'admin-mediafy-api',
        route: '/admin/mediafy-api',
        label: 'Mediafy API',
        page: 'MediafyAPI',
        end: false,
        icon: <Icon name="credits" />
      },
      {
        id: 'admin-onboarding-records',
        route: '/admin/onboarding-records',
        label: 'Onboarding Records',
        page: 'OnboardingRecords',
        end: false,
        icon: <Icon name="azure-openai-documentation" />
      },
      {
        id: 'admin-credits',
        route: '/admin/credits',
        label: 'Credits',
        page: 'Credits',
        end: false,
        icon: <Icon name="task-metadata" />
      },
      {
        id: 'admin-credit-logs',
        route: '/admin/credits/logs',
        label: 'Credit Logs',
        page: 'CreditLogs',
        end: false,
        icon: <Icon name="knowledge-base-guided-tours" />
      },
      {
        id: 'admin-prompt-templates',
        route: '/admin/prompt-templates',
        label: 'Prompt Templates',
        page: 'PromptTemplates',
        end: false,
        icon: <Icon name="campaigns" />
      },
      {
        id: 'admin-task-metadata',
        route: '/admin/task-metadata',
        label: 'Task Metadata',
        page: 'TaskMetadata',
        end: false,
        icon: <Icon name="templates" />
      },
      {
        id: 'admin-knowledge-base-guided-tours',
        route: '/admin/knowledge-base/guided-tours',
        label: 'Knowledge Base Guided Tours',
        page: 'Knowledge Base Guided Tours',
        end: false,
        icon: <Icon name="changelog" />
      },
      {
        id: 'admin-campaigns',
        route: '/admin/campaigns',
        label: 'Campaigns',
        page: 'Campaigns',
        end: false,
        icon: <Icon name="roadmap" />
      },
      {
        id: 'admin-campaign-stats',
        route: '/admin/campaignstats',
        label: 'Campaign Stats',
        page: 'CampaignStats',
        end: false,
        icon: <Icon name="faqs" />
      },
      {
        id: 'admin-secrets-vault',
        route: '/admin/secrets-vault',
        label: 'Secrets Vault',
        page: 'Secrets Vault',
        end: false,
        icon: <Icon name="key" />
      },
      {
        id: 'admin-openai-admin-keys',
        route: '/admin/openai-admin-keys',
        label: 'OpenAI Admin Keys',
        page: 'OpenAI Admin Keys',
        end: false,
        icon: <Icon name="ai-models" />
      }
    ]
  },
  {
    id: 'rbac',
    title: 'RBAC',
    section: 'RBAC',
    items: [
      {
        id: 'rbac-templates',
        route: '/rbac/templates',
        label: 'Templates',
        page: 'Templates',
        end: false,
        icon: <Icon name="knowledge-base" />
      }
    ]
  },
  {
    id: 'utility',
    title: 'Utility',
    section: 'Utility',
    items: [
      {
        id: 'utility-changelog',
        route: '/utility/changelog',
        label: 'Changelog',
        page: 'Changelog',
        end: false,
        icon: <Icon name="button" />
      },
      {
        id: 'utility-roadmap',
        route: '/utility/roadmap',
        label: 'Roadmap',
        page: 'Roadmap',
        end: false,
        icon: <Icon name="input-form" />
      },
      {
        id: 'utility-faqs',
        route: '/utility/faqs',
        label: 'FAQs',
        page: 'FAQs',
        end: false,
        icon: <Icon name="dropdown" />
      },
      {
        id: 'utility-knowledge-base',
        route: '/utility/knowledge-base',
        label: 'Knowledge Base',
        page: 'Knowledge Base',
        end: false,
        icon: <Icon name="modal" />
      },
      {
        id: 'utility-unauthorized',
        route: '/unauthorized',
        label: 'Unauthorized',
        page: 'Unauthorized',
        end: false,
        icon: <Icon name="alert-banner" />
      }
    ]
  },
  {
    id: 'luxury',
    title: 'LUXURY',
    section: 'LUXURY',
    items: [
      {
        id: 'luxury-admin-keys',
        route: '/admin/keys-luxury',
        label: 'Admin Keys Luxury',
        page: 'Admin Keys Luxury',
        end: false,
        icon: <Icon name="users-tabs" />
      },
      {
        id: 'luxury-admin-logs',
        route: '/admin/logs-luxury',
        label: 'Admin Logs Luxury',
        page: 'Admin Logs Luxury',
        end: false,
        icon: <Icon name="users-tiles" />
      },
      {
        id: 'luxury-user-creation-doc',
        route: '/admin/user-creation-doc',
        label: 'User Creation Doc',
        page: 'User Creation Doc',
        end: false,
        icon: <Icon name="profile" />
      }
    ]
  },
  {
    id: 'tables',
    title: 'TABLES',
    section: 'TABLES',
    items: [
      {
        id: 'tables-ats',
        route: '/admin/azure-tables-storage',
        label: 'ATS',
        page: 'ATS',
        end: false,
        icon: <Icon name="feed" />
      },
      {
        id: 'tables-snowflake-query',
        route: '/snowflake-query',
        label: 'Snowflake Query',
        page: 'Snowflake Query',
        end: false,
        icon: <Icon name="feed" />
      },
      {
        id: 'tables-snowflake-query-legacy',
        route: '/snowflake-query-legacy',
        label: 'Snowflake Query Legacy',
        page: 'Snowflake Query Legacy',
        end: false,
        icon: <Icon name="feed" />
      },
      {
        id: 'tables-snowflake-exports',
        route: '/snowflake-exports',
        label: 'Snowflake Exports',
        page: 'Snowflake Exports',
        end: false,
        icon: <Icon name="feed" />
      },
      {
        id: 'tables-saved-tables',
        route: '/saved-tables',
        label: 'Saved Tables',
        page: 'Saved Tables',
        end: false,
        icon: <Icon name="feed" />
      },
      {
        id: 'tables-ai-tables',
        route: '/ai-table',
        label: 'AI Tables',
        page: 'AI Tables',
        end: false,
        icon: <Icon name="feed" />
      }
    ]
  },
  {
    id: 'oauth',
    title: 'OAuth',
    section: 'OAuth',
    items: [
      {
        id: 'oauth-authentication',
        route: '/oauth',
        label: 'Authentication',
        page: 'Authentication',
        end: true,
        icon: <Icon name="key" />
      },
      {
        id: 'oauth-direct-google',
        route: '/oauth/direct-google',
        label: 'Direct Google OAuth',
        page: 'Direct Google OAuth',
        end: false,
        icon: <Icon name="key" />
      }
    ]
  },
  {
    id: 'ai-tools',
    title: 'AI Tools',
    section: 'AI Tools',
    items: [
      {
        id: 'openai-tts',
        route: '/openai-tts',
        label: 'OpenAI TTS',
        page: 'OpenAI TTS',
        end: true,
        icon: <Icon name="chat" />
      }
    ]
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp API',
    section: 'WhatsApp API',
    items: [
      {
        id: 'whatsapp-dashboard',
        route: '/whatsapp/dashboard',
        label: 'Dashboard',
        page: 'Dashboard',
        end: true,
        icon: <Icon name="dashboard" />
      },
      {
        id: 'whatsapp-campaigns',
        route: '/whatsapp/campaigns',
        label: 'Campaigns',
        page: 'Campaigns',
        end: false,
        icon: <Icon name="campaigns" />
      },
      {
        id: 'whatsapp-contacts',
        route: '/whatsapp/contacts',
        label: 'Contacts',
        page: 'Contacts',
        end: false,
        icon: <Icon name="users" />
      },
      {
        id: 'whatsapp-conversations',
        route: '/whatsapp/conversations',
        label: 'Conversations',
        page: 'Conversations',
        end: false,
        icon: <Icon name="chat" />
      },
      {
        id: 'whatsapp-templates',
        route: '/whatsapp/templates',
        label: 'Templates',
        page: 'Templates',
        end: false,
        icon: <Icon name="templates" />
      },
      {
        id: 'whatsapp-send-single-template',
        route: '/whatsapp/send-template',
        label: 'Send Single Template Message',
        page: 'Send Single Template Message',
        end: false,
        icon: <Icon name="templates" />
      },
      {
        id: 'whatsapp-template-12-proposal-campaign',
        route: '/whatsapp/template-12-proposal-campaign',
        label: 'Template 12 Proposal Campaign',
        page: 'Template 12 Proposal Campaign',
        end: false,
        icon: <Icon name="campaigns" />
      },
      {
        id: 'whatsapp-analytics',
        route: '/whatsapp/analytics',
        label: 'Analytics',
        page: 'Analytics',
        end: false,
        icon: <Icon name="analytics" />
      },
      {
        id: 'whatsapp-settings',
        route: '/whatsapp/settings',
        label: 'Settings',
        page: 'Settings',
        end: false,
        icon: <Icon name="settings" />
      },
      {
        id: 'whatsapp-thread-watcher',
        route: '/whatsapp/thread-watcher',
        label: 'Thread Watcher',
        page: 'Thread Watcher',
        end: false,
        icon: <Icon name="chat" />
      },
      {
        id: 'whatsapp-deepinfra-prompts',
        route: '/whatsapp/deepinfra-prompts',
        label: 'DeepInfra Prompts',
        page: 'DeepInfra Prompts',
        end: false,
        icon: <Icon name="templates" />
      }
    ]
  }
];

// Helper function to get navigation sections that user has access to
export const getAccessibleSections = (canAccessSection, canAccessRoute) => {
  return sidebarNavigation.filter(section =>
    section.items.some(item => canAccessRoute(section.section, item.page))
  );
};