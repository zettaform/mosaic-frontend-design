/**
 * Column Renderers
 * JSX render functions for data table columns
 * Separated from columnController to avoid JSX in .js files
 */

import { formatLastUpdated } from './utilsController.js';

// User ID column renderer
export const renderUserId = (value, row) => (
  <div className="flex flex-col leading-tight">
    <span className="font-mono text-[13px] text-slate-900 dark:text-slate-50">{value || '—'}</span>
    {row.instagram_id && row.instagram_id !== value ? (
      <span className="text-[11px] text-slate-500 dark:text-slate-400">
        IG: {row.instagram_id}
      </span>
    ) : null}
  </div>
);

// Handle column renderer
export const renderHandle = (value, row) => (
  <div className="flex flex-col leading-tight">
    <span className="font-semibold text-slate-900 dark:text-slate-50">
      @{value || 'unknown'}
    </span>
    {row.name ? (
      <span className="text-xs text-slate-500 dark:text-slate-400">{row.name}</span>
    ) : null}
  </div>
);

// Public email column renderer
export const renderPublicEmail = (value) => (
  <span className="font-medium text-indigo-600 dark:text-indigo-300">{value || '—'}</span>
);

// Hashtags column renderer
export const renderHashtags = (value, row) => (
  <span className="font-mono text-[13px] text-slate-900 dark:text-slate-50">
    {Number(row.hashtag_count || 0).toLocaleString()}
  </span>
);

// Tasks column renderer
export const renderTasks = (value, row) => (
  <span className="font-mono text-[13px] text-slate-900 dark:text-slate-50">
    {Number(row.task_count || 0).toLocaleString()}
  </span>
);

// Followers column renderer
export const renderFollowers = (value) => (
  <span className="font-mono text-[13px] text-slate-900 dark:text-slate-50">
    {Number(value || 0).toLocaleString()}
  </span>
);

// Posts column renderer
export const renderPosts = (value) => (
  <span className="font-mono text-[13px] text-slate-900 dark:text-slate-50">
    {Number(value || 0).toLocaleString()}
  </span>
);

// Subscribers column renderer
export const renderSubscribers = (value) => (
  <span className="font-mono text-[13px] text-slate-900 dark:text-slate-50">
    {Number(value || 0).toLocaleString()}
  </span>
);

// Last updated column renderer
export const renderLastUpdated = (value) => (
  <span className="text-[13px] text-slate-900 dark:text-slate-50">
    {formatLastUpdated(value) || '—'}
  </span>
);

// Profile name renderer
export const renderProfileName = (value) => (
  <span className="font-medium text-slate-900 dark:text-slate-50">{value || '—'}</span>
);

// Bio renderer
export const renderBio = (value) => (
  <span
    className="block max-w-[280px] truncate text-[13px]"
    title={value || undefined}
  >
    {value || '—'}
  </span>
);

// Last post renderer
export const renderLastPost = (value) => {
  const normalized =
    typeof value === 'number' ? new Date(value).toISOString() : value;
  return (
    <span className="text-[13px] text-slate-900 dark:text-slate-50">
      {normalized || '—'}
    </span>
  );
};

// Privacy renderer
export const renderPrivacy = (value) => (
  <span className="text-[13px] capitalize text-slate-900 dark:text-slate-50">
    {value || '—'}
  </span>
);

// Business renderer
export const renderBusiness = (value) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
      value === null
        ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
        : value
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
    }`}
  >
    {value === null ? '—' : value ? 'Business' : 'Personal'}
  </span>
);

// Verified renderer
export const renderVerified = (value) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
      value
        ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
    }`}
  >
    {value ? 'Verified' : 'Unverified'}
  </span>
);

// Public phone renderer
export const renderPublicPhone = (value, row) => {
  const composed = row.public_phone_number
    ? `${row.public_phone_country_code ? `+${row.public_phone_country_code} ` : ''}${
        row.public_phone_number
      }`
    : row.phone || value;
  return (
    <span className="text-[13px] text-slate-900 dark:text-slate-50">
      {composed || '—'}
    </span>
  );
};

// Profile link renderer
export const renderProfileLink = (value) => {
  if (!value) {
    return <span>—</span>;
  }
  const display = value.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  return (
    <a
      href={value}
      target="_blank"
      rel="noreferrer"
      className="text-indigo-600 hover:underline dark:text-indigo-300"
    >
      {display}
    </a>
  );
};

// Category renderer
export const renderCategory = (value) => (
  <span className="text-[13px] text-slate-900 dark:text-slate-50">{value || '—'}</span>
);

