import React, { useEffect } from 'react';
import {
  Routes,
  Route,
  useLocation,
  Navigate,
  Outlet
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { GuidedTourProvider } from './contexts/GuidedTourContext';
import ErrorBoundary from './components/ErrorBoundary';

import './css/style.css';

import './charts/ChartjsConfig';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Import pages
import Homepage from './pages/Homepage';
import Dashboard from './pages/Dashboard';
import HomepageDebug from './pages/HomepageDebug';
import AboutUs from './pages/AboutUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Marketing from './pages/Marketing';
import AnalyticsPage from './pages/AnalyticsPage';
import AutomationPage from './pages/AutomationPage';
import InsightsPage from './pages/InsightsPage';
import SubmitTicketPage from './pages/SubmitTicketPage';
import Documentation from './pages/Documentation';
import Guides from './pages/Guides';
import Blog from './pages/Blog';
import FundingAnnouncement from './pages/FundingAnnouncement';
import Jobs from './pages/Jobs';
import TermsOfService from './pages/TermsOfService';
import License from './pages/License';
import Features from './pages/Features';
import Contact from './pages/Contact';
import Pricing from './pages/Pricing';
import BillingSuccess from './pages/BillingSuccess';
import Customers from './pages/ecommerce/Customers';
import Shop from './pages/ecommerce/Shop';
import Shop2 from './pages/ecommerce/Shop2';
import AdminConsole from './pages/ecommerce/AdminConsole';
import Campaigns from './pages/Campaigns';
import UsersTabs from './pages/community/UsersTabs';
import UsersTiles from './pages/community/UsersTiles';
import Profile from './pages/community/Profile';
import Feed from './pages/community/Feed';
import Forum from './pages/community/Forum';
import ForumPost from './pages/community/ForumPost';
import Meetups from './pages/community/Meetups';
import MeetupsPost from './pages/community/MeetupsPost';
import CreditCards from './pages/finance/CreditCards';
import Transactions from './pages/finance/Transactions';
import TransactionDetails from './pages/finance/TransactionDetails';
import JobListing from './pages/job/JobListing';
import JobPost from './pages/job/JobPost';
import CompanyProfile from './pages/job/CompanyProfile';
import Messages from './pages/Messages';
import TasksKanban from './pages/tasks/TasksKanban';
import TasksList from './pages/tasks/TasksList';
import Inbox from './pages/Inbox';
import Calendar from './pages/Calendar';
import Account from './pages/settings/Account';
import Notifications from './pages/settings/Notifications';
import Apps from './pages/settings/Apps';
import Plans from './pages/settings/Plans';
import Billing from './pages/settings/Billing';
import Feedback from './pages/settings/Feedback';
import ByokKeys from './pages/settings/ByokKeys';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminKeysLuxury from './pages/admin/AdminKeysLuxury';
import AdminInstagramApiKeys from './pages/admin/AdminInstagramApiKeys';
import AdminMediafyApiKeys from './pages/admin/AdminMediafyApiKeys';
import ExternalUserLogs from './pages/admin/ExternalUserLogs';
import AdminLogsLuxury from './pages/admin/AdminLogsLuxury';
import AIModels from './pages/admin/AIModels';
import PromptTemplates from './pages/admin/PromptTemplates';
import Tasks from './pages/admin/Tasks';
import ActiveDurableFunctions from './pages/admin/ActiveDurableFunctions';
import TaskSettings from './pages/admin/TaskSettings';
import MediafyAPI from './pages/admin/MediafyAPI';
import FollowersScraping from './pages/admin/FollowersScraping';
import AdminChat from './pages/admin/AdminChat';
import AdminChatEnhanced from './pages/admin/AdminChatEnhanced';
import NextGenDashboard from './pages/admin/NextGenDashboard';
import AdminStatistics from './pages/admin/AdminStatistics';
import CampaignStats from './pages/admin/CampaignStats';
import SecretsVault from './pages/admin/SecretsVault';
import OpenAIAdminKeys from './pages/admin/OpenAIAdminKeys';
import TaskMetadata from './pages/admin/TaskMetadata';
import OnboardingRecords from './pages/admin/OnboardingRecords';
import Credits from './pages/admin/Credits';
import CreditLogs from './pages/admin/CreditLogs';
import AdminKnowledgeBaseGuidedTours from './pages/admin/AdminKnowledgeBaseGuidedTours';
import CostEstimator from './pages/CostEstimator';
import UserCreationDemo from './pages/UserCreationDemo';
import AzureTablesStorage from './pages/admin/AzureTablesStorage';
import EmailTemplates from './pages/admin/EmailTemplates';
import SingleEmailSend from './pages/admin/SingleEmailSend';
import SendGridEmailSend from './pages/admin/SendGridEmailSend';
import MauticCampaignSend from './pages/admin/MauticCampaignSend';
import DurableSendgrid from './pages/admin/DurableSendgrid';
import DurableSendgridRuns from './pages/admin/DurableSendgridRuns';
import MailgunTest from './pages/admin/MailgunTest';
import MailgunDomains from './pages/admin/MailgunDomains';
import MailgunSnowflakeSend from './pages/admin/MailgunSnowflakeSend';
import MailgunCampaigns from './pages/admin/MailgunCampaigns';
import MailgunCampaignOperations from './pages/admin/MailgunCampaignOperations';
import MailgunCampaignLogs from './pages/admin/MailgunCampaignLogs';
import RBACTemplates from './pages/rbac/RBACTemplates';
import Changelog from './pages/utility/Changelog';
import Roadmap from './pages/utility/Roadmap';
import Faqs from './pages/utility/Faqs';
import PageNotFound from './pages/utility/PageNotFound';
import NotFound from './pages/NotFound';
import KnowledgeBase from './pages/utility/KnowledgeBase';
import Unauthorized from './pages/Unauthorized';
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import Onboarding01 from './pages/Onboarding01';
import Onboarding02 from './pages/Onboarding02';
import Onboarding03 from './pages/Onboarding03';
import Onboarding04 from './pages/Onboarding04';
import Onboarding05 from './pages/Onboarding05';
import OnboardingComplete from './pages/OnboardingComplete';
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import Simulation from './pages/Simulation';
import DesignPage1 from './pages/design/Page1';
import DesignPage2 from './pages/design/Page2';
import DesignPage3 from './pages/design/Page3';
import DesignPage4 from './pages/design/Page4';
import DesignPage5 from './pages/design/Page5';
import DynamoDBTables from './pages/design/DynamoDBTables';
import DynamoDBTablesNew from './pages/design/DynamoDBTablesNew';
import SnowflakeQuery from './pages/data/SnowflakeQuery';
import SnowflakeQueryLegacy from './pages/data/SnowflakeQueryLegacy';
import SnowflakeExports from './pages/data/SnowflakeExports';
import SavedTables from './pages/data/SavedTables';
import AiTable from './pages/data/AiTable';

// Import email pages
import PromptTagsManagement from './pages/email/PromptTagsManagement';
import EmailReplySimulator from './pages/email/EmailReplySimulator';
import ManualReplies from './pages/email/ManualReplies';
import ManualSends from './pages/email/ManualSends';
import GmailConversations from './pages/email/GmailConversations';
import SMTP from './pages/email/SMTP';

// Import crypto pages
import PaymentGatewayLinks from './pages/crypto/PaymentGatewayLinks';
import PaymentLinksLuxury from './pages/crypto/PaymentLinksLuxury';
import CreemPaymentLinks from './pages/crypto/CreemPaymentLinks';
import PaymentPage from './pages/crypto/PaymentPage';
import CryptoLogs from './pages/crypto/CryptoLogs';
import TestCrypto from './pages/crypto/TestCrypto';
import SimpleTest from './pages/crypto/SimpleTest';
import BTCXpubGenerator from './pages/crypto/BTCXpubGenerator';
import BTCXpubGeneratorLuxury from './pages/crypto/BTCXpubGeneratorLuxury';
import GeneratedAddressesLuxury from './pages/crypto/GeneratedAddressesLuxury';
import Walrus from './pages/Walrus';
import OAuth from './pages/OAuth';
import DirectGoogleOAuth from './pages/DirectGoogleOAuth';
import OpenAITTS from './pages/OpenAITTS';
import Akshcat from './pages/Akshcat';
import AkshcatEmbed from './pages/AkshcatEmbed';
import TrialConcept from './pages/TrialConcept';
import EbiroyFollowings from './pages/EbiroyFollowings';

// WhatsApp pages
import WhatsAppDashboard from './pages/whatsapp/Dashboard';
import WhatsAppCampaigns from './pages/whatsapp/Campaigns';
import WhatsAppContacts from './pages/whatsapp/Contacts';
import WhatsAppConversations from './pages/whatsapp/Conversations';
import WhatsAppTemplates from './pages/whatsapp/Templates';
import WhatsAppSendSingleTemplateMessage from './pages/whatsapp/SendSingleTemplateMessage';
import WhatsAppAnalytics from './pages/whatsapp/Analytics';
import WhatsAppSettings from './pages/whatsapp/Settings';
import WhatsAppThreadWatcher from './pages/whatsapp/ThreadWatcher';
import WhatsAppDeepInfraPrompts from './pages/whatsapp/DeepInfraPrompts';
import WhatsAppTemplate12ProposalCampaign from './pages/whatsapp/Template12ProposalCampaign';

// Import ProtectedRoute component
import ProtectedRoute from './components/ProtectedRoute';

// Layout component for protected routes that require authentication
const ProtectedLayout = () => {
  return (
    <ProtectedRoute requireAuth>
      <Outlet />
    </ProtectedRoute>
  );
};

// Layout for routes that require both authentication and completed onboarding
const OnboardingLayout = () => {
  return (
    <ProtectedRoute requireAuth requireOnboarding>
      <Outlet />
    </ProtectedRoute>
  );
};

// Layout for public routes (signin, signup, etc.)
const PublicLayout = () => {
  return (
    <ProtectedRoute requireAuth={false}>
      <Outlet />
    </ProtectedRoute>
  );
};

function App() {
  const location = useLocation();

  useEffect(() => {
    // Only scroll to top for main page changes, not sidebar navigation
    // Check if this is a major route change (not just admin sub-routes)
    const isMajorRouteChange = !location.pathname.includes('/admin/') &&
                              !location.pathname.includes('/ecommerce/') &&
                              !location.pathname.includes('/settings/') &&
                              !location.pathname.includes('/crypto/') &&
                              !location.pathname.includes('/oauth');
    
    if (isMajorRouteChange) {
      // Smooth scroll to top only for major route changes
      document.querySelector('html').style.scrollBehavior = 'smooth';
      window.scroll({ top: 0 });
      // Reset scroll behavior after a short delay
      setTimeout(() => {
        document.querySelector('html').style.scrollBehavior = '';
      }, 100);
    } else {
      // For sub-routes, prevent any scrolling to avoid flashing
      document.querySelector('html').style.scrollBehavior = 'auto';
    }
  }, [location.pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <ThemeProvider>
          <ToastProvider>
            <div className="min-h-screen flex flex-col">
              <AuthProvider>
              <GuidedTourProvider>
              <Routes>
        {/* Public routes - accessible without authentication */}
        <Route element={<PublicLayout />}>
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          {/* OAuth must be public so unauthenticated users can complete Google signup */}
          <Route path="/oauth" element={<OAuth />} />
          <Route path="/oauth/direct-google" element={<DirectGoogleOAuth />} />
          <Route path="/ebiroy.com/followings" element={<EbiroyFollowings />} />
          <Route path="/ebiroy/followings" element={<EbiroyFollowings />} />
        </Route>

        {/* Onboarding routes - requires authentication but not completed onboarding */}
        <Route element={<OnboardingLayout />}>
          <Route path="/onboarding" element={<OnboardingWizard />} />
          <Route path="/onboarding/1" element={<Onboarding01 />} />
          <Route path="/onboarding/2" element={<Onboarding02 />} />
          <Route path="/onboarding/3" element={<Onboarding03 />} />
          <Route path="/onboarding/4" element={<Onboarding04 />} />
          <Route path="/onboarding/5" element={<Onboarding05 />} />
          <Route path="/onboarding/complete" element={<OnboardingComplete />} />
        </Route>

        {/* Public homepage route */}
        <Route path="/" element={<Homepage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/marketing" element={<Marketing />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/automation" element={<AutomationPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/submit-ticket" element={<SubmitTicketPage />} />
        <Route path="/documentation" element={<Documentation />} />
        <Route path="/guides" element={<Guides />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/funding-announcement" element={<FundingAnnouncement />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/license" element={<License />} />
        <Route path="/features" element={<Features />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/billing/success" element={<BillingSuccess />} />
        <Route path="/walrus" element={<Walrus />} />
        <Route path="/akshcat/embed" element={<AkshcatEmbed />} />
        <Route path="/akshcat" element={<Akshcat />} />
        <Route path="/trial-concept" element={<TrialConcept />} />
        
        {/* Public payment page - accessible without authentication */}
        <Route path="/crypto/pay/:linkId" element={<PaymentPage />} />

        {/* Protected routes - requires authentication and completed onboarding */}
        <Route element={<ProtectedLayout />}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* E-commerce */}
          <Route path="/ecommerce/users" element={<Customers />} />
          <Route path="/ecommerce/shop" element={<Shop />} />
          <Route path="/ecommerce/shop-2" element={<Shop2 />} />
          <Route path="/ecommerce/admin-console" element={<AdminConsole />} />
          
          {/* Community */}
          <Route path="/community/users-tabs" element={<UsersTabs />} />
          <Route path="/community/users-tiles" element={<UsersTiles />} />
          <Route path="/community/profile" element={<Profile />} />
          <Route path="/community/feed" element={<Feed />} />
          <Route path="/community/forum" element={<Forum />} />
          <Route path="/community/forum-post" element={<ForumPost />} />
          <Route path="/community/meetups" element={<Meetups />} />
          <Route path="/community/meetups-post" element={<MeetupsPost />} />
          
          {/* Finance */}
          <Route path="/finance/cards" element={<CreditCards />} />
          <Route path="/finance/transactions" element={<Transactions />} />
          <Route path="/finance/transaction-details" element={<TransactionDetails />} />

          {/* AI Tools */}
          <Route path="/openai-tts" element={<OpenAITTS />} />

          {/* Crypto */}
          <Route path="/crypto/payment-links" element={<PaymentGatewayLinks />} />
          <Route path="/crypto/payment-links-luxury" element={<PaymentLinksLuxury />} />
          <Route path="/crypto/creem-payment-links" element={<CreemPaymentLinks />} />
          <Route path="/crypto/logs" element={<CryptoLogs />} />
          <Route path="/crypto/test" element={<TestCrypto />} />
          <Route path="/crypto/simple" element={<SimpleTest />} />
          <Route path="/crypto/btc-xpub-generator" element={<BTCXpubGeneratorLuxury />} />
          <Route path="/crypto/generated-addresses" element={<GeneratedAddressesLuxury />} />
          
          {/* Jobs */}
          <Route path="/job/job-listing" element={<JobListing />} />
          <Route path="/job/job-post" element={<JobPost />} />
          <Route path="/job/company-profile" element={<CompanyProfile />} />
          
          {/* Apps */}
          <Route path="/messages" element={<Messages />} />
          <Route path="/tasks/kanban" element={<TasksKanban />} />
          <Route path="/tasks/list" element={<TasksList />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/calendar" element={<Calendar />} />
          
          {/* Settings */}
          <Route path="/settings/account" element={<Account />} />
          <Route path="/settings/notifications" element={<Notifications />} />
          <Route path="/settings/apps" element={<Apps />} />
          <Route path="/settings/plans" element={<Plans />} />
          <Route path="/settings/billing" element={<Billing />} />
          <Route path="/settings/feedback" element={<Feedback />} />
          <Route path="/settings/byok" element={<ByokKeys />} />
          <Route path="/settings/byok-openai" element={<Navigate to="/settings/byok" replace />} />
          
          {/* Admin */}
          <Route path="/admin/feedback" element={<AdminFeedback />} />
          <Route path="/admin/keys-luxury" element={<AdminKeysLuxury />} />
          <Route path="/admin/instagram-api-keys" element={<AdminInstagramApiKeys />} />
          <Route path="/admin/mediafy-api-keys" element={<AdminMediafyApiKeys />} />
          <Route path="/admin/logs" element={<ExternalUserLogs />} />
          <Route path="/admin/logs-luxury" element={<AdminLogsLuxury />} />
          <Route path="/admin/cost-estimator" element={<CostEstimator />} />
          <Route path="/admin/ai-models" element={<AIModels />} />
          <Route path="/admin/prompt-templates" element={<PromptTemplates />} />
          <Route path="/admin/tasks" element={<Tasks />} />
          <Route path="/admin/email-templates" element={<EmailTemplates />} />
          <Route path="/admin/single-email-send" element={<SingleEmailSend />} />
          <Route path="/admin/sendgrid-email-send" element={<SendGridEmailSend />} />
          <Route path="/admin/mautic-campaign-send" element={<MauticCampaignSend />} />
          <Route path="/admin/durable-sendgrid" element={<DurableSendgrid />} />
          <Route path="/admin/durable-sendgrid-runs" element={<DurableSendgridRuns />} />
          <Route path="/admin/mailgun-test" element={<MailgunTest />} />
          <Route path="/admin/mailgun-domains" element={<MailgunDomains />} />
          <Route path="/admin/mailgun-snowflakesend" element={<MailgunSnowflakeSend />} />
          <Route path="/admin/mailgun-campaigns" element={<MailgunCampaigns />} />
          <Route path="/admin/mailgun-campaign-operations" element={<MailgunCampaignOperations />} />
          <Route path="/admin/mailgun-campaign-logs" element={<MailgunCampaignLogs />} />
          <Route path="/admin/active-durable-functions" element={<ActiveDurableFunctions />} />
          <Route path="/admin/task-settings" element={<TaskSettings />} />
          <Route path="/admin/mediafy-api" element={<MediafyAPI />} />
          <Route path="/admin/followers-scraping" element={<FollowersScraping />} />
          <Route path="/admin/chat" element={<AdminChatEnhanced />} />
          <Route path="/admin/nextgen" element={<NextGenDashboard />} />
          <Route path="/admin/statistics" element={<AdminStatistics />} />
          <Route path="/admin/campaignstats" element={<CampaignStats />} />
          <Route path="/admin/secrets-vault" element={<SecretsVault />} />
          <Route path="/admin/openai-admin-keys" element={<OpenAIAdminKeys />} />
          <Route path="/admin/task-metadata" element={<TaskMetadata />} />
          <Route path="/admin/onboarding-records" element={<OnboardingRecords />} />
          <Route path="/admin/azure-tables-storage" element={<AzureTablesStorage />} />
          <Route path="/admin/credits" element={<Credits />} />
          <Route path="/admin/credits/logs" element={<CreditLogs />} />
          <Route path="/admin/knowledge-base/guided-tours" element={<AdminKnowledgeBaseGuidedTours />} />
          <Route path="/admin/campaigns" element={<Campaigns />} />
          <Route path="/user-creation-demo" element={<UserCreationDemo />} />
          
          {/* RBAC */}
          <Route path="/rbac/templates" element={<RBACTemplates />} />
          
          {/* Utility */}
          <Route path="/utility/changelog" element={<Changelog />} />
          <Route path="/utility/roadmap" element={<Roadmap />} />
          <Route path="/utility/faqs" element={<Faqs />} />
          <Route path="/utility/knowledge-base" element={<KnowledgeBase />} />
          
          {/* Design */}
          <Route path="/design/page-1" element={<DesignPage1 />} />
          <Route path="/design/page-2" element={<DesignPage2 />} />
          <Route path="/design/page-3" element={<DesignPage3 />} />
          <Route path="/design/page-4" element={<DesignPage4 />} />
          <Route path="/design/page-5" element={<DesignPage5 />} />
          <Route path="/design/dynamodb-tables" element={<DynamoDBTables />} />
          <Route path="/design/dynamodb-tables-new" element={<DynamoDBTablesNew />} />
          <Route path="/snowflake-query" element={<SnowflakeQuery />} />
          <Route path="/snowflake-query-legacy" element={<SnowflakeQueryLegacy />} />
          <Route path="/snowflake-exports" element={<SnowflakeExports />} />
          <Route path="/ai-table" element={<SavedTables />} />
          <Route path="/ai-table/:tableId" element={<AiTable />} />
          <Route path="/saved-tables" element={<SavedTables />} />
          
          {/* Email */}
          <Route path="/email/tags" element={<PromptTagsManagement />} />
          <Route path="/email/reply" element={<EmailReplySimulator />} />
          <Route path="/email/manual-replies" element={<ManualReplies />} />
          <Route path="/email/manual-sends" element={<ManualSends />} />
          <Route path="/email/conversations" element={<GmailConversations />} />
          <Route path="/email/smtp" element={<SMTP />} />
          
          {/* Cost Estimator */}
          <Route path="/cost-estimator" element={<CostEstimator />} />
          
          {/* Simulation */}
          <Route path="/simulation" element={<Simulation />} />
          
          {/* WhatsApp API */}
          <Route path="/whatsapp/dashboard" element={<WhatsAppDashboard />} />
          <Route path="/whatsapp/campaigns" element={<WhatsAppCampaigns />} />
          <Route path="/whatsapp/contacts" element={<WhatsAppContacts />} />
          <Route path="/whatsapp/conversations" element={<WhatsAppConversations />} />
          <Route path="/whatsapp/templates" element={<WhatsAppTemplates />} />
          <Route path="/whatsapp/send-template" element={<WhatsAppSendSingleTemplateMessage />} />
          <Route path="/whatsapp/analytics" element={<WhatsAppAnalytics />} />
          <Route path="/whatsapp/settings" element={<WhatsAppSettings />} />
          <Route path="/whatsapp/thread-watcher" element={<WhatsAppThreadWatcher />} />
          <Route path="/whatsapp/deepinfra-prompts" element={<WhatsAppDeepInfraPrompts />} />
          <Route path="/whatsapp/template-12-proposal-campaign" element={<WhatsAppTemplate12ProposalCampaign />} />
        </Route>

        {/* 404 - Keep at the bottom */}
        <Route path="*" element={<PageNotFound />} />
              </Routes>
              </GuidedTourProvider>
            </AuthProvider>
          </div>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
