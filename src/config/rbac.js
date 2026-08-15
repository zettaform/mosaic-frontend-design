// RBAC Configuration
// Defines roles, sections, and pages for Role-Based Access Control

/**
 * RBAC Configuration Structure
 * 
 * Each role defines:
 * - canAccessAll: boolean - if true, user has access to all sections/pages
 * - sections: object - mapping of section names to allowed pages
 * 
 * Sections available:
 * - Ecommerce: Users, Shop, Admin Console
 * - Crypto: Payment Links, Logs, BTC XPUB Generator, Generated Addresses
 * - Settings: Account, Notifications, Apps, Plans, Billing, Feedback
 * - Email: Prompt Tags, Reply Simulator, Gmail Conversations
 * - Admin: Various admin pages (Feedback, Tasks, MediafyAPI, Chat, NextGen, Payments, OnboardingRecords, Credits, CreditLogs, CostEstimator, AIModels, PromptTemplates, Logs, UserCreationDemo, RBACTemplates)
 * - LUXURY: Admin Keys Luxury, Admin Logs Luxury
 * - TABLES: ATS (Azure Tables Storage)
 * - Utility: Changelog, Roadmap, FAQs, Knowledge Base
 * - OAuth: Authentication
 */

export const RBAC_CONFIG = {
  admin: {
    canAccessAll: true,
    sections: {} // Empty because canAccessAll is true
  },
  dev: {
    canAccessAll: false,
    sections: {
      Ecommerce: ["Users"],
      Crypto: ["Payment Links", "Payment Links (Creem)", "Logs", "BTC XPUB Generator", "Generated Addresses"],
      Settings: ["Account", "Notifications", "BYOK Keys", "BYOK OpenAI Keys"],
      Admin: ["Tasks", "DevPhases", "EmailTemplates", "SingleEmailSend", "SendGridEmailSend", "MauticCampaignSend", "MailgunTest", "MailgunDomains", "MailgunSnowflakeSend", "MailgunCampaigns", "MailgunCampaignOperations", "MailgunCampaignLogs"],
      OAuth: ["Authentication"],
      TABLES: ["ATS", "Snowflake Query", "Snowflake Query Legacy", "Snowflake Exports", "Saved Tables", "AI Tables"],
      "WhatsApp API": ["Dashboard", "Campaigns", "Send Single Template Message", "Template 12 Proposal Campaign"],
      akshcat: ["akshcat"]
    }
  },
  user: {
    canAccessAll: false,
    sections: {
      Crypto: ["Payment Links", "Payment Links (Creem)", "Logs", "BTC XPUB Generator", "Generated Addresses"],
      Settings: ["Account", "BYOK Keys", "BYOK OpenAI Keys"],
      OAuth: ["Authentication"],
      akshcat: ["akshcat"]
    }
  }
};

/**
 * Section to route mapping
 * Maps sidebar sections to their corresponding routes
 */
export const SECTION_ROUTES = {
  Ecommerce: {
    Users: "/ecommerce/users",
    Shop: "/ecommerce/shop",
    "Admin Console": "/ecommerce/admin-console"
  },
  Crypto: {
    "Payment Links": "/crypto/payment-links-luxury",
    "Payment Links (Creem)": "/crypto/creem-payment-links",
    Logs: "/crypto/logs",
    "BTC XPUB Generator": "/crypto/btc-xpub-generator",
    "Generated Addresses": "/crypto/generated-addresses"
  },
  Settings: {
    Account: "/settings/account",
    Notifications: "/settings/notifications",
    Apps: "/settings/apps",
    Plans: "/settings/plans",
    Billing: "/settings/billing",
    Feedback: "/settings/feedback",
    "BYOK OpenAI Keys": "/settings/byok",
    "BYOK Keys": "/settings/byok"
  },
  Email: {
    "Prompt Tags": "/email/tags",
    "Reply Simulator": "/email/reply",
    "Manual Replies": "/email/manual-replies",
    "Manual Sends": "/email/manual-sends",
    "Gmail Conversations": "/email/conversations",
    "SMTP": "/email/smtp"
  },
  Admin: {
    Feedback: "/admin/feedback",
    Tasks: "/admin/tasks",
    EmailTemplates: "/admin/email-templates",
    SingleEmailSend: "/admin/single-email-send",
    SendGridEmailSend: "/admin/sendgrid-email-send",
    MauticCampaignSend: "/admin/mautic-campaign-send",
    DurableSendgrid: "/admin/durable-sendgrid",
    DurableSendgridRuns: "/admin/durable-sendgrid-runs",
    MailgunTest: "/admin/mailgun-test",
    MailgunDomains: "/admin/mailgun-domains",
    MailgunSnowflakeSend: "/admin/mailgun-snowflakesend",
    MailgunCampaigns: "/admin/mailgun-campaigns",
    MailgunCampaignOperations: "/admin/mailgun-campaign-operations",
    MailgunCampaignLogs: "/admin/mailgun-campaign-logs",
    ActiveDurableFunctions: "/admin/active-durable-functions",
    TaskSettings: "/admin/task-settings",
    MediafyAPI: "/admin/mediafy-api",
    Chat: "/admin/chat",
    NextGen: "/admin/nextgen",
    OnboardingRecords: "/admin/onboarding-records",
    Credits: "/admin/credits",
    CreditLogs: "/admin/credits/logs",
    CostEstimator: "/admin/cost-estimator",
    AIModels: "/admin/ai-models",
    PromptTemplates: "/admin/prompt-templates",
    AzureOpenAIDocumentation: "/admin/azure-openai-documentation",
    InstagramApiKeys: "/admin/instagram-api-keys",
    MediafyApiKeys: "/admin/mediafy-api-keys",
    FollowersScraping: "/admin/followers-scraping",
    Logs: "/admin/logs",
    UserCreationDemo: "/user-creation-demo",
    Statistics: "/admin/statistics",
    TaskMetadata: "/admin/task-metadata",
    "Knowledge Base Guided Tours": "/admin/knowledge-base/guided-tours",
    Campaigns: "/admin/campaigns",
    CampaignStats: "/admin/campaignstats",
    "Secrets Vault": "/admin/secrets-vault",
    "OpenAI Admin Keys": "/admin/openai-admin-keys"
  },
  RBAC: {
    "RBAC Templates": "/rbac/templates"
  },
  LUXURY: {
    "Admin Keys Luxury": "/admin/keys-luxury",
    "Admin Logs Luxury": "/admin/logs-luxury",
    "User Creation Doc": "/admin/user-creation-doc"
  },
  TABLES: {
    ATS: '/admin/azure-tables-storage',
    'Snowflake Query': '/snowflake-query',
    'Snowflake Query Legacy': '/snowflake-query-legacy',
    'Snowflake Exports': '/snowflake-exports',
    'Saved Tables': '/saved-tables',
    'AI Tables': '/ai-table'
  },
  Utility: {
    Changelog: "/utility/changelog",
    Roadmap: "/utility/roadmap",
    FAQs: "/utility/faqs",
    "Knowledge Base": "/utility/knowledge-base",
    "Unauthorized": "/unauthorized"
  },
  OAuth: {
    Authentication: "/oauth",
    "Direct Google OAuth": "/oauth/direct-google"
  },
  "AI Tools": {
    "OpenAI TTS": "/openai-tts"
  },
  "WhatsApp API": {
    "Dashboard": "/whatsapp/dashboard",
    "Campaigns": "/whatsapp/campaigns",
    "Contacts": "/whatsapp/contacts",
    "Conversations": "/whatsapp/conversations",
    "Templates": "/whatsapp/templates",
    "Send Single Template Message": "/whatsapp/send-template",
    "Template 12 Proposal Campaign": "/whatsapp/template-12-proposal-campaign",
    "Analytics": "/whatsapp/analytics",
    "Settings": "/whatsapp/settings"
  },
  akshcat: {
    akshcat: "/akshcat"
  }
};

/**
 * Route to section/page mapping (reverse lookup)
 * Maps routes back to their section and page names
 */
export const ROUTE_TO_SECTION = {};
Object.keys(SECTION_ROUTES).forEach(section => {
  Object.keys(SECTION_ROUTES[section]).forEach(page => {
    const route = SECTION_ROUTES[section][page];
    ROUTE_TO_SECTION[route] = { section, page };
  });
});

  // Add dashboard route - accessible to all authenticated users
  ROUTE_TO_SECTION['/dashboard'] = { section: 'Dashboard', page: 'Dashboard' };
  
  // WhatsApp routes
  ROUTE_TO_SECTION['/whatsapp/dashboard'] = { section: 'WhatsApp API', page: 'Dashboard' };
  ROUTE_TO_SECTION['/whatsapp/campaigns'] = { section: 'WhatsApp API', page: 'Campaigns' };
  ROUTE_TO_SECTION['/whatsapp/contacts'] = { section: 'WhatsApp API', page: 'Contacts' };
  ROUTE_TO_SECTION['/whatsapp/conversations'] = { section: 'WhatsApp API', page: 'Conversations' };
  ROUTE_TO_SECTION['/whatsapp/templates'] = { section: 'WhatsApp API', page: 'Templates' };
  ROUTE_TO_SECTION['/whatsapp/send-template'] = { section: 'WhatsApp API', page: 'Send Single Template Message' };
  ROUTE_TO_SECTION['/whatsapp/template-12-proposal-campaign'] = { section: 'WhatsApp API', page: 'Template 12 Proposal Campaign' };
  ROUTE_TO_SECTION['/whatsapp/analytics'] = { section: 'WhatsApp API', page: 'Analytics' };
  ROUTE_TO_SECTION['/whatsapp/settings'] = { section: 'WhatsApp API', page: 'Settings' };

  ROUTE_TO_SECTION['/settings/byok'] = { section: 'Settings', page: 'BYOK Keys' };

// SECURITY/NOISE: Avoid logging RBAC internals in the browser console by default.

/**
 * Get all available sections and pages
 * Used for building the permissions UI
 */
export const getAllSectionsAndPages = () => {
  return Object.keys(SECTION_ROUTES).map(section => ({
    section,
    pages: Object.keys(SECTION_ROUTES[section])
  }));
};

function normalizeLookupKey(value) {
  return String(value || '').trim().toLowerCase();
}

function getCanonicalSectionName(sectionName) {
  const target = normalizeLookupKey(sectionName);
  if (!target) return null;
  return Object.keys(SECTION_ROUTES).find((name) => normalizeLookupKey(name) === target) || null;
}

function getCanonicalPageName(sectionName, pageName) {
  const canonicalSection = getCanonicalSectionName(sectionName);
  if (!canonicalSection) return null;
  const target = normalizeLookupKey(pageName);
  if (!target) return null;
  const match = Object.keys(SECTION_ROUTES[canonicalSection]).find(
    (name) => normalizeLookupKey(name) === target
  );
  if (match) return match;
  // Sidebar / legacy UIs used the label "AI Models"; SECTION_ROUTES key is "AIModels".
  if (canonicalSection === 'Admin' && target === 'ai models') {
    return SECTION_ROUTES.Admin.AIModels ? 'AIModels' : null;
  }
  return null;
}

function normalizePermissionsForAccess(rawPermissions) {
  if (!rawPermissions || typeof rawPermissions !== 'object' || Array.isArray(rawPermissions)) {
    return { permissions: {}, hasRecognizedPermissions: false };
  }

  const normalizedPermissions = {};
  let hasRecognizedPermissions = false;

  for (const [sectionKey, sectionValue] of Object.entries(rawPermissions)) {
    const canonicalSection = getCanonicalSectionName(sectionKey);
    if (!canonicalSection || sectionValue === null || sectionValue === undefined) continue;

    if (Array.isArray(sectionValue)) {
      const canonicalPages = Array.from(
        new Set(
          sectionValue
            .map((page) => getCanonicalPageName(canonicalSection, page))
            .filter(Boolean)
        )
      );
      if (canonicalPages.length > 0) {
        normalizedPermissions[canonicalSection] = canonicalPages;
        hasRecognizedPermissions = true;
      }
      continue;
    }

    if (typeof sectionValue === 'object') {
      const enabledPages = Object.entries(sectionValue)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([page]) => getCanonicalPageName(canonicalSection, page))
        .filter(Boolean);

      if (enabledPages.length > 0) {
        normalizedPermissions[canonicalSection] = Array.from(new Set(enabledPages));
        hasRecognizedPermissions = true;
      }
      continue;
    }

    if (Boolean(sectionValue)) {
      normalizedPermissions[canonicalSection] = true;
      hasRecognizedPermissions = true;
    }
  }

  return { permissions: normalizedPermissions, hasRecognizedPermissions };
}

/**
 * Check if a user has access to a specific section/page
 * @param {Object} user - User object with role and permissions
 * @param {string} section - Section name
 * @param {string} page - Page name (optional, checks section access if not provided)
 * @returns {boolean} - Whether user has access
 */
export const hasAccess = (user, section, page = null) => {
  if (!user) {
    return false;
  }

  // Dashboard is the base landing page for any authenticated user.
  if (section === 'Dashboard') {
    return true;
  }

  // Normalize role so we don't accidentally deny valid users due to casing/whitespace.
  // (e.g. "Admin", " admin " should behave the same as "admin")
  const rawRole = String(user.role || 'user');
  const normalizedRole = rawRole.trim().toLowerCase();

  // Explicit admin-by-email override.
  // This prevents a misconfigured role value from accidentally locking the known admin account out.
  const normalizedEmail = String(user.email || '').trim().toLowerCase();
  if (normalizedEmail === 'admin@example.com') {
    return true;
  }

  // Explicit admin check - admin always has access
  if (normalizedRole === 'admin') {
    return true;
  }

  const roleConfig = RBAC_CONFIG[normalizedRole];

  if (!roleConfig) {
    // If role config not found, check if user is admin by email (fallback)
    if (user.email === 'admin@example.com') {
      console.warn('⚠️ User has admin email but role config not found, granting access');
      return true;
    }
    return false;
  }

  // Admin has access to everything - check this FIRST before any permission checks
  // This ensures admin users always have access regardless of permissions object
  if (roleConfig.canAccessAll) {
    return true;
  }
  
  const canonicalSection = getCanonicalSectionName(section) || section;
  const canonicalPage = page ? (getCanonicalPageName(canonicalSection, page) || page) : null;

  // Check user-specific permissions (if set)
  // If user.permissions exists AND has keys, ONLY use those permissions
  // Do NOT fall back to role defaults when explicit permissions are set
  // Empty object {} means "no permissions set" - fall back to role defaults
  // Note: permissions can be an array (legacy format) or an object (RBAC format)
  if (user.permissions) {
    // Handle array format (legacy) - if permissions is an array, ignore it and use role defaults
    if (Array.isArray(user.permissions)) {
      // Legacy array format - fall through to role-based defaults
    } else if (typeof user.permissions === 'object' && user.permissions !== null) {
      const { permissions: normalizedPermissions, hasRecognizedPermissions } =
        normalizePermissionsForAccess(user.permissions);

      // If explicit permissions are present but malformed/unrecognized, do not lock users out.
      // Fall back to role defaults rather than denying every protected route.
      if (hasRecognizedPermissions) {
        const hasSection = normalizedPermissions[canonicalSection];
        if (hasSection) {
          if (Array.isArray(hasSection)) {
            if (canonicalPage) {
              return hasSection.includes(canonicalPage);
            }
            return hasSection.length > 0;
          }
          if (hasSection) {
            return true;
          }
        }
        return false;
      }
    }
  }
  
  // Fall back to role-based default permissions ONLY if user.permissions is not set
  // Note: For admin users with canAccessAll, we should have already returned true above
  // This is a safety check in case canAccessAll wasn't checked properly
  if (roleConfig.canAccessAll) {
    return true;
  }
  
  const roleSections = roleConfig.sections || {};
  const rolePages = roleSections[canonicalSection] || [];
  
  if (canonicalPage) {
    return rolePages.includes(canonicalPage);
  }
  
  // If no page specified, check if section has any allowed pages
  return rolePages.length > 0;
};

/** BYOK settings: canonical page or legacy "BYOK OpenAI Keys" in permissions. */
export const canAccessByokSettings = (user) =>
  hasAccess(user, 'Settings', 'BYOK Keys') || hasAccess(user, 'Settings', 'BYOK OpenAI Keys');

/**
 * Saved Tables and AI Tables share the same hub UI (`/saved-tables` and `/ai-table`).
 * Either permission grants access to that hub (pick a table before opening `/ai-table/:tableId`).
 */
export const canAccessTablesSavedHub = (user) => {
  if (!user) return false;
  return (
    hasAccess(user, 'TABLES', 'Saved Tables') || hasAccess(user, 'TABLES', 'AI Tables')
  );
};

/** Matches backend `isAdminUser`: platform admins for saved-tables admin UI and tenant filters. */
export const isPlatformAdmin = (user) => {
  if (!user) return false;
  if (String(user.role || '').trim().toLowerCase() === 'admin') return true;
  const email = String(user.email || '').trim().toLowerCase();
  return email === 'admin@example.com';
};

/**
 * Get default permissions for a role
 * @param {string} role - Role name
 * @returns {Object} - Default permissions structure
 */
export const getDefaultPermissionsForRole = (role) => {
  const normalizedRole = String(role || 'user').trim().toLowerCase();
  const roleConfig = RBAC_CONFIG[normalizedRole];
  if (!roleConfig) return {};
  
  if (roleConfig.canAccessAll) {
    // Return all sections with all pages
    const allPermissions = {};
    Object.keys(SECTION_ROUTES).forEach(section => {
      allPermissions[section] = Object.keys(SECTION_ROUTES[section]);
    });
    return allPermissions;
  }
  
  // Return role's default sections
  return roleConfig.sections || {};
};

/**
 * Get the first accessible route for a user
 * Prioritizes /admin/tasks if user has access, otherwise returns first accessible route
 * @param {Object} user - User object with role and permissions
 * @returns {string} - First accessible route path
 */
export const getFirstAccessibleRoute = (user) => {
  if (!user) {
    console.log('⚠️ getFirstAccessibleRoute: No user provided');
    return '/dashboard';
  }
  
  console.log('🔍 getFirstAccessibleRoute called for user:', {
    email: user.email,
    role: user.role,
    permissions: user.permissions
  });
  
  // Priority routes (in order of preference)
  const priorityRoutes = [
    '/admin/tasks',  // Highest priority
    '/dashboard',
    '/settings/account'
  ];
  
  // Check priority routes first
  for (const route of priorityRoutes) {
    const routeInfo = ROUTE_TO_SECTION[route];
    console.log(`  Checking route ${route}:`, {
      routeInfo,
      hasRouteInfo: !!routeInfo
    });
    
    if (routeInfo) {
      const { section, page } = routeInfo;
      const access = hasAccess(user, section, page);
      console.log(`    Access check for ${section}/${page}:`, access);
      if (access) {
        console.log(`  ✅ Found accessible route: ${route}`);
        return route;
      }
    } else {
      console.log(`  ⚠️ Route ${route} not found in ROUTE_TO_SECTION`);
    }
  }
  
  // If no priority route is accessible, find first accessible route
  console.log('  Checking all routes in ROUTE_TO_SECTION...');
  for (const [route, routeInfo] of Object.entries(ROUTE_TO_SECTION)) {
    const { section, page } = routeInfo;
    const access = hasAccess(user, section, page);
    if (access) {
      console.log(`  ✅ Found accessible route: ${route}`);
      return route;
    }
  }
  
  // Fallback to dashboard
  console.log('  ⚠️ No accessible route found, falling back to /dashboard');
  return '/dashboard';
};

