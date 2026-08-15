import React from 'react';
import * as PhosphorIcons from '@phosphor-icons/react';

// Icon mapping for consistent naming across the application
const ICON_MAP = {
  // Dashboard icons
  dashboard: PhosphorIcons.House,
  analytics: PhosphorIcons.ChartBar,
  fintech: PhosphorIcons.CurrencyDollar,

  // E-commerce icons
  users: PhosphorIcons.UserList,
  orders: PhosphorIcons.ShoppingCart,
  invoices: PhosphorIcons.FileText,
  shop: PhosphorIcons.BagSimple,
  product: PhosphorIcons.Package,
  cart: PhosphorIcons.ShoppingCart,
  pay: PhosphorIcons.CreditCard,

  // Design icons
  'users-management': PhosphorIcons.UserGear,

  // Crypto icons
  'payment-links': PhosphorIcons.Receipt,
  logs: PhosphorIcons.FileText,
  'btc-xpub-generator': PhosphorIcons.Coin,
  'generated-addresses': PhosphorIcons.Barcode,

  // Settings icons
  settings: PhosphorIcons.GearSix,
  account: PhosphorIcons.User,
  notifications: PhosphorIcons.BellSimple,
  apps: PhosphorIcons.AppWindow,
  plans: PhosphorIcons.ClipboardText,
  billing: PhosphorIcons.Bank,
  feedback: PhosphorIcons.ChatCenteredText,

  // Email icons
  tags: PhosphorIcons.Hash,
  reply: PhosphorIcons.ShareFat,
  conversations: PhosphorIcons.Chats,
  'postal-api': PhosphorIcons.Envelope,
  smtp: PhosphorIcons.Envelope,
  'mailgun-domains': PhosphorIcons.Globe,

  // Admin icons
  'admin-feedback': PhosphorIcons.ChatTeardropText,
  'instagram-api-keys': PhosphorIcons.Key,
  'mediafy-api-keys': PhosphorIcons.Key,
  'admin-logs': PhosphorIcons.FileText,
  'user-creation-demo': PhosphorIcons.UserPlus,
  'cost-estimator': PhosphorIcons.Calculator,
  'ai-models': PhosphorIcons.Cpu,
  tasks: PhosphorIcons.ListChecks,
  statistics: PhosphorIcons.ChartLine,
  'active-durable-functions': PhosphorIcons.GearSix,
  'task-settings': PhosphorIcons.Wrench,
  'mediafy-api': PhosphorIcons.FilmStrip,
  chat: PhosphorIcons.ChatText,
  nextgen: PhosphorIcons.Sparkle,
  'onboarding-records': PhosphorIcons.UserPlus,
  credits: PhosphorIcons.Coin,
  'credit-logs': PhosphorIcons.Scroll,
  'prompt-templates': PhosphorIcons.Feather,
  'azure-openai-documentation': PhosphorIcons.CloudArrowUp,
  'task-metadata': PhosphorIcons.ClipboardText,
  'knowledge-base-guided-tours': PhosphorIcons.MapTrifold,
  campaigns: PhosphorIcons.Target,
  'campaign-stats': PhosphorIcons.ChartPie,

  // RBAC icons
  templates: PhosphorIcons.Files,

  // Utility icons
  changelog: PhosphorIcons.ListDashes,
  roadmap: PhosphorIcons.RoadHorizon,
  faqs: PhosphorIcons.QuestionMark,
  'knowledge-base': PhosphorIcons.GraduationCap,

  // Components icons
  button: PhosphorIcons.Square,
  'input-form': PhosphorIcons.Article,
  dropdown: PhosphorIcons.List,
  modal: PhosphorIcons.Popcorn,
  pagination: PhosphorIcons.ArrowsLeftRight,
  tabs: PhosphorIcons.SquaresFour,
  'alert-banner': PhosphorIcons.WarningCircle,
  breadcrumb: PhosphorIcons.CaretRight,
  badge: PhosphorIcons.Tag,
  avatar: PhosphorIcons.User,
  tooltip: PhosphorIcons.Info,
  accordion: PhosphorIcons.CaretDown,
  icons: PhosphorIcons.Star,

  // Luxury icons
  'admin-keys': PhosphorIcons.Key,
  'admin-logs-luxury': PhosphorIcons.FileText,
  'user-creation-doc': PhosphorIcons.FileText,

  // Tables icons
  ats: PhosphorIcons.Table,

  // Community icons
  'users-tabs': PhosphorIcons.UserFocus,
  'users-tiles': PhosphorIcons.Layout,
  profile: PhosphorIcons.IdentificationCard,
  feed: PhosphorIcons.Rss,
  forum: PhosphorIcons.ChatCenteredDots,
  meetups: PhosphorIcons.Handshake,

  // Finance icons
  cards: PhosphorIcons.Cards,
  transactions: PhosphorIcons.Receipt,
  'transaction-details': PhosphorIcons.Scroll,

  // OAuth icons
  key: PhosphorIcons.LockKey,

  akshcat: PhosphorIcons.Cube,
};

/**
 * Enterprise-grade Icon component with unified theming
 * Supports consistent stroke width, corner radius, and theming across all sidebar icons
 */
const Icon = ({
  name,
  size = 20,
  className = '',
  'aria-label': ariaLabel,
  ...props
}) => {
  const IconComponent = ICON_MAP[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in icon map`);
    return null;
  }

  const iconClassName = `shrink-0 ${className}`.trim();

  return (
    <span
      role="img"
      aria-label={ariaLabel || name.replace(/-/g, ' ')}
      className="inline-flex items-center justify-center mr-3"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <IconComponent
        size={size}
        weight="regular"
        className={`sidebar-icon ${iconClassName}`.trim()}
        {...props}
      />
    </span>
  );
};

export default Icon;