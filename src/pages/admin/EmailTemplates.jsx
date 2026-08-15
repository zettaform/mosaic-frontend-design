import React, { useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/ui/Modal';
import { getEmailTemplates } from '../../data/emailTemplates';
import postmarkTemplateService from '../../services/postmarkTemplateService';

function getAppBaseUrl() {
  // Always use the running mymailgram.com website as the canonical base URL.
  // (Env override is still allowed for emergency/QA, but default is production.)
  const envUrl = import.meta?.env?.VITE_APP_URL;
  const candidate = (typeof envUrl === 'string' && envUrl.trim()) || 'https://www.mymailgram.com';
  return String(candidate).replace(/\/+$/, '');
}

const buildMmgTransactionalEmail = ({
  appUrl,
  logoUrl,
  docTitle,
  h1,
  intro,
  cardEyebrow = 'Update',
  cardTitle,
  cardBody,
  ctaLabel,
  ctaHref,
  closingNote,
}) => `<!doctype html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${docTitle}</title>
    <style>
      /* Some clients strip <style>; keep critical styles inline too */
      @media (max-width: 620px) {
        .container { width: 100% !important; }
        .px { padding-left: 18px !important; padding-right: 18px !important; }
        .h1 { font-size: 24px !important; line-height: 30px !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background:#f5f7fb; -webkit-text-size-adjust:100%;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f7fb;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="width:600px; max-width:600px; background:#ffffff; border-radius:14px; overflow:hidden;">
            <!-- Header -->
            <tr>
              <td align="center" style="padding:22px 24px; background:#0b1220;">
                <a href="${appUrl}/" target="_blank" style="text-decoration:none;">
                  <img src="${logoUrl}" width="56" height="56" alt="My Mail Gram" style="display:block; border:0; outline:none; text-decoration:none;" />
                </a>
                <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:14px; line-height:20px; color:#cbd5e1; padding-top:10px;">
                  My Mail Gram (MMG)
                </div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td class="px" style="padding:28px 32px 10px;">
                <div class="h1" style="font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:28px; line-height:34px; font-weight:700; color:#0f172a;">
                  ${h1}
                </div>

                <div style="height:10px; line-height:10px; font-size:1px;">&nbsp;</div>

                <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:15px; line-height:22px; color:#334155;">
                  ${intro}
                </div>

                <div style="height:18px; line-height:18px; font-size:1px;">&nbsp;</div>

                <!-- Card -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px;">
                  <tr>
                    <td style="padding:16px 16px;">
                      <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:13px; line-height:18px; color:#64748b;">
                        ${cardEyebrow}
                      </div>
                      <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:16px; line-height:22px; font-weight:600; color:#0f172a;">
                        ${cardTitle}
                      </div>

                      <div style="height:8px; line-height:8px; font-size:1px;">&nbsp;</div>

                      <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:14px; line-height:20px; color:#334155;">
                        ${cardBody}
                      </div>
                    </td>
                  </tr>
                </table>

                <div style="height:18px; line-height:18px; font-size:1px;">&nbsp;</div>

                <!-- Button -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="left" style="padding:0;">
                      <a href="${ctaHref}" target="_blank"
                        style="display:inline-block; background:#1e40ff; color:#ffffff; font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:15px; line-height:18px; font-weight:600; text-decoration:none; padding:12px 18px; border-radius:10px;">
                        ${ctaLabel}
                      </a>
                    </td>
                  </tr>
                </table>

                <div style="height:18px; line-height:18px; font-size:1px;">&nbsp;</div>

                <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:13px; line-height:20px; color:#64748b;">
                  ${closingNote}
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td class="px" style="padding:18px 32px 26px;">
                <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:12px; line-height:18px; color:#94a3b8;">
                  © 2025 My Mail Gram (MMG). All rights reserved.<br />
                  <a href="https://www.mymailgram.com/preferences" target="_blank" style="color:#64748b; text-decoration:underline;">Manage preferences</a>
                  &nbsp;•&nbsp;
                  <a href="https://www.mymailgram.com/unsubscribe" target="_blank" style="color:#64748b; text-decoration:underline;">Unsubscribe</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const buildSubscriptionActivatedEmail = ({ appUrl, logoUrl }) => `<!doctype html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>MMG Subscription Activated</title>
    <style>
      /* Some clients strip <style>; keep critical styles inline too */
      @media (max-width: 620px) {
        .container { width: 100% !important; }
        .px { padding-left: 18px !important; padding-right: 18px !important; }
        .h1 { font-size: 24px !important; line-height: 30px !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background:#f5f7fb; -webkit-text-size-adjust:100%;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f7fb;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="width:600px; max-width:600px; background:#ffffff; border-radius:14px; overflow:hidden;">
            <!-- Header -->
            <tr>
              <td align="center" style="padding:22px 24px; background:#0b1220;">
                <a href="${appUrl}/" target="_blank" style="text-decoration:none;">
                  <img src="${logoUrl}" width="56" height="56" alt="My Mail Gram" style="display:block; border:0; outline:none; text-decoration:none;" />
                </a>
                <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:14px; line-height:20px; color:#cbd5e1; padding-top:10px;">
                  My Mail Gram (MMG)
                </div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td class="px" style="padding:28px 32px 10px;">
                <div class="h1" style="font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:28px; line-height:34px; font-weight:700; color:#0f172a;">
                  Welcome — your subscription is active
                </div>

                <div style="height:10px; line-height:10px; font-size:1px;">&nbsp;</div>

                <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:15px; line-height:22px; color:#334155;">
                  Thanks for choosing MMG. We’ve activated your subscription plan and your account is ready to use.
                </div>

                <div style="height:18px; line-height:18px; font-size:1px;">&nbsp;</div>

                <!-- Card -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px;">
                  <tr>
                    <td style="padding:16px 16px;">
                      <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:13px; line-height:18px; color:#64748b;">
                        Subscription
                      </div>
                      <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:16px; line-height:22px; font-weight:600; color:#0f172a;">
                        Plan activated
                      </div>

                      <div style="height:8px; line-height:8px; font-size:1px;">&nbsp;</div>

                      <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:14px; line-height:20px; color:#334155;">
                        You can manage billing, invoices, and plan changes anytime from your dashboard.
                      </div>
                    </td>
                  </tr>
                </table>

                <div style="height:18px; line-height:18px; font-size:1px;">&nbsp;</div>

                <!-- Button -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="left" style="padding:0;">
                      <a href="https://www.mymailgram.com/dashboard" target="_blank"
                        style="display:inline-block; background:#1e40ff; color:#ffffff; font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:15px; line-height:18px; font-weight:600; text-decoration:none; padding:12px 18px; border-radius:10px;">
                        Go to dashboard
                      </a>
                    </td>
                  </tr>
                </table>

                <div style="height:18px; line-height:18px; font-size:1px;">&nbsp;</div>

                <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:13px; line-height:20px; color:#64748b;">
                  If you didn’t request this subscription, please reply to this email and we’ll help right away.
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td class="px" style="padding:18px 32px 26px;">
                <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:12px; line-height:18px; color:#94a3b8;">
                  © 2025 My Mail Gram (MMG). All rights reserved.<br />
                  <a href="https://www.mymailgram.com/preferences" target="_blank" style="color:#64748b; text-decoration:underline;">Manage preferences</a>
                  &nbsp;•&nbsp;
                  <a href="https://www.mymailgram.com/unsubscribe" target="_blank" style="color:#64748b; text-decoration:underline;">Unsubscribe</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

function EmailTemplates() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const { success, error } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendTemplate, setSendTemplate] = useState(null);
  const [secretName, setSecretName] = useState('postmark-server-token');
  const [sendTo, setSendTo] = useState('ceo@myleadgram.com');
  const [sendFrom, setSendFrom] = useState('dan@mymailgram.com');

  const templates = useMemo(() => getEmailTemplates(), []);

  // Wait for auth to finish loading
  if (authLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="sidebar-shell-main-noscroll">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center justify-center h-full">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Auth + RBAC
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  const routeInfo = ROUTE_TO_SECTION[currentPath];
  if (routeInfo) {
    const { section, page } = routeInfo;
    if (!hasAccess(user, section, page)) {
      return <Navigate to="/unauthorized" replace />;
    }
  } else {
    return <Navigate to="/unauthorized" replace />;
  }

  const handleCopyHtml = async (tpl) => {
    try {
      await navigator.clipboard.writeText(tpl.html);
      success(`Copied HTML: ${tpl.name}`);
    } catch (e) {
      console.error('Copy failed', e);
      error('Failed to copy HTML to clipboard');
    }
  };

  const handleView = (tpl) => {
    setSelectedTemplate(tpl);
    setIsPreviewOpen(true);
  };

  const handleOpenSend = (tpl) => {
    setSendTemplate(tpl);
    setIsSendOpen(true);
  };

  const handleSendTemplate = async () => {
    if (!sendTemplate) return;
    try {
      setSending(true);
      await postmarkTemplateService.sendTemplateWithSecret({
        secretName: secretName.trim(),
        from: sendFrom.trim(),
        to: sendTo.trim(),
        subject: sendTemplate.subject,
        htmlBody: sendTemplate.html,
        messageStream: 'outbound',
      });
      success(`Email sent: ${sendTemplate.name}`);
      setIsSendOpen(false);
    } catch (e) {
      console.error('Postmark send failed', e);
      error(e?.message || 'Failed to send template');
    } finally {
      setSending(false);
    }
  };

  const grouped = templates.reduce((acc, tpl) => {
    const key = tpl.category || 'Other';
    acc[key] = acc[key] || [];
    acc[key].push(tpl);
    return acc;
  }, {});

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">
                Transactional Email Templates
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Copy raw HTML or preview each template (rendered) in a modal.
              </p>
            </div>

            <div className="space-y-8">
              {Object.keys(grouped).map((category) => (
                <section key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {category}
                    </h2>
                    <div className="text-xs text-slate-400">
                      {grouped[category].length} template{grouped[category].length === 1 ? '' : 's'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {grouped[category].map((tpl) => (
                      <div
                        key={tpl.id}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {tpl.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              <span className="font-medium">Subject:</span> {tpl.subject}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenSend(tpl)}
                              className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium"
                            >
                              Send
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyHtml(tpl)}
                              className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm font-medium"
                            >
                              Copy HTML
                            </button>
                            <button
                              type="button"
                              onClick={() => handleView(tpl)}
                              className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </main>
      </div>

      <Modal
        isOpen={isSendOpen}
        onClose={() => setIsSendOpen(false)}
        title={sendTemplate ? `Send: ${sendTemplate.name}` : 'Send template'}
        size="lg"
        className="dark:bg-slate-900"
      >
        {sendTemplate ? (
          <div className="space-y-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Uses a token stored in Secrets Vault to send through Postmark.
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Secret Name (stored in Secrets Vault)
              </label>
              <input
                type="text"
                value={secretName}
                onChange={(e) => setSecretName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                placeholder="postmark-server-token"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  From
                </label>
                <input
                  type="email"
                  value={sendFrom}
                  onChange={(e) => setSendFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  To
                </label>
                <input
                  type="email"
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium">Subject:</span> {sendTemplate.subject}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSendOpen(false)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendTemplate}
                disabled={sending}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send now'}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={selectedTemplate ? `Preview: ${selectedTemplate.name}` : 'Preview'}
        size="xl"
        className="dark:bg-slate-900"
      >
        {selectedTemplate ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium">Subject:</span> {selectedTemplate.subject}
              </div>
              <button
                type="button"
                onClick={() => handleCopyHtml(selectedTemplate)}
                className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium"
              >
                Copy HTML
              </button>
            </div>

            <iframe
              title="Email preview"
              className="w-full h-[70vh] rounded-lg border border-slate-200 dark:border-slate-700 bg-white"
              srcDoc={selectedTemplate.html}
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default EmailTemplates;



