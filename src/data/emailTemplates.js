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

export function getEmailTemplates() {
  const APP_URL = getAppBaseUrl();
  const LOGO_URL = `${APP_URL}/fav3-logo-512x512.png`;

  return [
    {
      id: 'subscription-activated',
      category: 'Billing & Subscription',
      name: 'Subscription Activated',
      subject: 'Welcome — your subscription is active',
      html: buildSubscriptionActivatedEmail({ appUrl: APP_URL, logoUrl: LOGO_URL }),
    },

    // Marketing & Newsletters
    {
      id: 'newsletter-subscription-confirmed',
      category: 'Marketing & Newsletters',
      name: 'Newsletter Subscriber Confirmation (footer signup)',
      subject: "You're subscribed to the MyMailGram newsletter",
      html: buildMmgTransactionalEmail({
        appUrl: APP_URL,
        logoUrl: LOGO_URL,
        docTitle: 'MyMailGram Newsletter — subscription confirmed',
        h1: "You're on the list",
        intro:
          "Thanks for subscribing. We've added you as a subscriber to the MyMailGram newsletter — you'll get product updates, outreach tips, and occasional announcements from the MMG team.",
        cardEyebrow: 'Newsletter',
        cardTitle: 'Subscription confirmed',
        cardBody:
          'This email address is now subscribed: <strong>{{subscriber_email}}</strong>. If that is not your address, use the links below to unsubscribe or contact us.',
        ctaLabel: 'Visit MyMailGram',
        ctaHref: `${APP_URL}/`,
        closingNote:
          "Didn't sign up? You can safely ignore this email, or unsubscribe using the link in the footer.",
      }),
    },
    {
      id: 'sendgrid-newsletter-template',
      category: 'Marketing & Newsletters',
      name: 'SendGrid Template for Newsletters',
      subject: 'MyMailGram Newsletter',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MyMailGram Newsletter</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body style="margin:0; padding:0; background-color:#f4f6f8;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f5f7fb;">
    <tr>
      <td align="center" style="padding:30px 10px;">

        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#ffffff; border-radius:14px; overflow:hidden;">

          <!-- Header / Logo -->
          <tr>
            <td align="center" valign="middle" style="padding:30px 24px 22px; text-align:center; vertical-align:middle; background:#0b1220;">
              <img src="${LOGO_URL}" alt="MyMailGram" width="56" height="56" style="display:block; margin:0 auto; border:0; outline:none; text-decoration:none;">
              <div style="font-family: Arial, Helvetica, sans-serif; font-size:13px; line-height:18px; color:#cbd5e1; padding-top:10px;">
                My Mail Gram (MMG)
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px 40px; font-family:Arial, Helvetica, sans-serif; color:#111111;">

              <h1 style="margin:0 0 15px; font-size:26px; line-height:1.3; text-align:center;">
                Looking Ahead to Growth in 2026
              </h1>

              <p style="margin:0 0 15px; font-size:15px; line-height:1.6; text-align:center; color:#444444;">
                2025 pushed outreach and personalization forward in a big way.
                With smarter targeting, deeper context, and AI-powered personalization,
                outreach is no longer just volume — it’s strategy.
              </p>

              <p style="margin:0 0 25px; font-size:15px; line-height:1.6; text-align:center; color:#444444;">
                As the year comes to a close, we’re here to help you start the next one
                stronger than ever.
              </p>

              <!-- CTA Button -->
              <table align="center" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" bgcolor="#1e40ff" style="border-radius:10px;">
                    <a href="${APP_URL}"
                       target="_blank"
                       style="display:inline-block; padding:14px 26px; font-size:15px;
                              font-family:Arial, Helvetica, sans-serif; color:#ffffff;
                              text-decoration:none; font-weight:bold;">
                      Get outreach guidance
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 30px; background-color:#f8fafc; font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#64748b; text-align:center;">
              © 2026 MyMailGram · Smarter Outreach, Better Conversations
              <br><br>
              <a href="{{unsubscribe}}" style="color:#64748b; text-decoration:underline;">Unsubscribe</a>
            </td>
          </tr>

        </table>
        <!-- End Container -->

      </td>
    </tr>
  </table>
</body>
</html>
`,
    },

    // 1) Account & Access
    {
      id: 'welcome-account-created',
      category: 'Account & Access',
      name: 'Welcome / Account Created',
      subject: 'Welcome to MMG — let’s enrich your first leads',
      html: buildMmgTransactionalEmail({
        appUrl: APP_URL,
        logoUrl: LOGO_URL,
        docTitle: 'MMG Account Created',
        h1: 'Welcome to MMG',
        intro: 'Thanks for signing up. Your account is ready — start by uploading a lead list to enrich and generate outbound emails in minutes.',
        cardEyebrow: 'Account',
        cardTitle: 'Your account is created',
        cardBody: 'Log in to your dashboard to upload leads, run enrichment, and generate AI-written emails.',
        ctaLabel: 'Go to dashboard',
        ctaHref: `${APP_URL}/dashboard`,
        closingNote: 'If you didn’t create this account, please reply to this email and we’ll help right away.',
      }),
    },
    {
      id: 'email-verification-required',
      category: 'Account & Access',
      name: 'Email Verification Required',
      subject: 'Verify your email to activate your MMG account',
      html: buildMmgTransactionalEmail({
        appUrl: APP_URL,
        logoUrl: LOGO_URL,
        docTitle: 'MMG Email Verification',
        h1: 'Verify your email',
        intro: 'Please confirm this email address to secure your account and improve deliverability for your campaigns.',
        cardEyebrow: 'Security',
        cardTitle: 'Verification required',
        cardBody: 'Click the button below to verify your email address. This link may expire for security.',
        ctaLabel: 'Verify email',
        ctaHref: '{{verification_url}}',
        closingNote: 'If you didn’t request this, you can safely ignore this message.',
      }),
    },
    {
      id: 'password-reset-request',
      category: 'Account & Access',
      name: 'Password Reset Request',
      subject: 'Reset your MMG password',
      html: buildMmgTransactionalEmail({
        appUrl: APP_URL,
        logoUrl: LOGO_URL,
        docTitle: 'MMG Password Reset',
        h1: 'Password reset request',
        intro: 'We received a request to reset the password for your MMG account.',
        cardEyebrow: 'Security',
        cardTitle: 'Reset your password',
        cardBody: 'Use the button below to choose a new password. If you did not request this, you can ignore this email.',
        ctaLabel: 'Reset password',
        ctaHref: '{{reset_password_url}}',
        closingNote: 'For your security, this reset link may expire.',
      }),
    },

    // 2) Trial & Activation
    {
      id: 'trial-activated',
      category: 'Trial & Activation',
      name: 'Trial Activated',
      subject: 'Your MMG trial is active — here’s what’s unlocked',
      html: buildMmgTransactionalEmail({
        appUrl: APP_URL,
        logoUrl: LOGO_URL,
        docTitle: 'MMG Trial Activated',
        h1: 'Your trial is active',
        intro: 'Welcome aboard — your trial is now active. You can enrich leads and generate AI emails right away.',
        cardEyebrow: 'Trial',
        cardTitle: 'Start getting value fast',
        cardBody: 'Upload leads → enrich data → generate emails → export and send. Your “first win” is just a few clicks away.',
        ctaLabel: 'Start your first upload',
        ctaHref: `${APP_URL}/dashboard`,
        closingNote: 'Questions? Reply to this email and we’ll help you get set up.',
      }),
    },
    {
      id: 'getting-started-first-steps',
      category: 'Trial & Activation',
      name: 'Getting Started / First Steps',
      subject: 'First steps: upload leads → enrich → generate emails',
      html: buildMmgTransactionalEmail({
        appUrl: APP_URL,
        logoUrl: LOGO_URL,
        docTitle: 'Getting Started with MMG',
        h1: 'Your first steps',
        intro: 'Here’s the fastest way to get your first “aha moment” with MMG.',
        cardEyebrow: 'Checklist',
        cardTitle: 'Upload → enrich → generate',
        cardBody: 'Upload your lead list, run enrichment to fill in missing data, then generate personalized AI emails and export your campaign file.',
        ctaLabel: 'Open dashboard',
        ctaHref: `${APP_URL}/dashboard`,
        closingNote: 'If you get stuck at any step, reply here and we’ll guide you.',
      }),
    },
    {
      id: 'first-enrichment-completed',
      category: 'Trial & Activation',
      name: 'First Data Enrichment Completed',
      subject: 'Nice — your first enrichment is complete',
      html: buildMmgTransactionalEmail({
        appUrl: APP_URL,
        logoUrl: LOGO_URL,
        docTitle: 'MMG Enrichment Completed',
        h1: 'Your first enrichment is complete',
        intro: 'Great progress — we finished enriching your uploaded leads.',
        cardEyebrow: 'Enrichment',
        cardTitle: 'Data is ready',
        cardBody: 'Review results and export the enriched file when you’re ready.',
        ctaLabel: 'View results',
        ctaHref: `${APP_URL}/dashboard`,
        closingNote: 'If anything looks off, reply to this email and we’ll help troubleshoot.',
      }),
    },
    {
      id: 'first-ai-email-generated',
      category: 'Trial & Activation',
      name: 'First AI Email Generated',
      subject: 'Your first AI email is ready',
      html: buildMmgTransactionalEmail({
        appUrl: APP_URL,
        logoUrl: LOGO_URL,
        docTitle: 'MMG AI Email Generated',
        h1: 'Your first AI email is ready',
        intro: 'You’ve generated your first AI-written email — now it’s time to review, tweak, and export.',
        cardEyebrow: 'AI',
        cardTitle: 'Draft generated',
        cardBody: 'Open your draft to edit tone, add your CTA, and export for sending.',
        ctaLabel: 'Review draft',
        ctaHref: `${APP_URL}/dashboard`,
        closingNote: 'Reply to this email if you want help improving replies or deliverability.',
      }),
    },
    {
      id: 'trial-expiring-soon',
      category: 'Trial & Activation',
      name: 'Trial Expiring Soon',
      subject: 'Your MMG trial ends soon',
      html: buildMmgTransactionalEmail({
        appUrl: APP_URL,
        logoUrl: LOGO_URL,
        docTitle: 'MMG Trial Expiring',
        h1: 'Your trial ends soon',
        intro: 'Just a heads-up — your trial is ending soon. Keep your workflows running by upgrading your plan.',
        cardEyebrow: 'Trial',
        cardTitle: 'Avoid interruption',
        cardBody: 'Upgrade now to keep enrichment and AI email generation available for your team.',
        ctaLabel: 'Upgrade plan',
        ctaHref: `${APP_URL}/pricing`,
        closingNote: 'Need a hand choosing a plan? Reply to this email and we’ll recommend the right fit.',
      }),
    },
    {
      id: 'trial-ended-upgrade-required',
      category: 'Trial & Activation',
      name: 'Trial Ended – Upgrade Required',
      subject: 'Your trial ended — upgrade to continue',
      html: buildMmgTransactionalEmail({
        appUrl: APP_URL,
        logoUrl: LOGO_URL,
        docTitle: 'MMG Trial Ended',
        h1: 'Your trial has ended',
        intro: 'Your trial period is over, so enrichment and generation features are paused until you upgrade.',
        cardEyebrow: 'Access',
        cardTitle: 'Upgrade required',
        cardBody: 'Upgrade your plan to resume processing, exports, and campaign creation.',
        ctaLabel: 'Choose a plan',
        ctaHref: `${APP_URL}/pricing`,
        closingNote: 'If you believe this is an error, reply to this email and we’ll help.',
      }),
    },

    // 3) Credits, Usage & Limits
    {
      id: 'credits-allocated-reset',
      category: 'Credits, Usage & Limits',
      name: 'Credits Allocated / Reset',
      subject: 'Your MMG credits are available',
      html: buildMmgTransactionalEmail({
        appUrl: APP_URL,
        logoUrl: LOGO_URL,
        docTitle: 'MMG Credits Available',
        h1: 'Credits are available',
        intro: 'Your credits have been allocated/reset and you’re ready to run more enrichment and generation.',
        cardEyebrow: 'Usage',
        cardTitle: 'Credits updated',
        cardBody: 'Check your dashboard to see your current balance and usage for this cycle.',
        ctaLabel: 'View credits',
        ctaHref: `${APP_URL}/dashboard`,
        closingNote: 'If you have questions about how credits are counted, reply to this email.',
      }),
    },
    {
      id: 'credits-80-90-used',
      category: 'Credits, Usage & Limits',
      name: 'Credits 80–90% Used',
      subject: 'You’re close to your credit limit',
      html: buildMmgTransactionalEmail({
        appUrl: APP_URL,
        logoUrl: LOGO_URL,
        docTitle: 'MMG Credits Running Low',
        h1: 'Credits running low',
        intro: 'You’ve used most of your credits. To avoid jobs pausing, consider upgrading or adjusting what you process.',
        cardEyebrow: 'Usage',
        cardTitle: '80–90% used',
        cardBody: 'Review your current usage and upgrade if you need higher throughput.',
        ctaLabel: 'View usage',
        ctaHref: `${APP_URL}/dashboard`,
        closingNote: 'If you need help forecasting usage, reply to this email.',
      }),
    },
    {
      id: 'credit-limit-reached-paused',
      category: 'Credits, Usage & Limits',
      name: 'Credit Limit Reached – Processing Paused',
      subject: 'Credit limit reached — processing paused',
      html: buildMmgTransactionalEmail({
        appUrl: APP_URL,
        logoUrl: LOGO_URL,
        docTitle: 'MMG Processing Paused',
        h1: 'Processing paused',
        intro: 'You’ve reached your credit limit, so new enrichment jobs are paused until credits reset or you upgrade.',
        cardEyebrow: 'Usage',
        cardTitle: 'Limit reached',
        cardBody: 'Upgrade your plan to resume processing immediately, or wait for your next reset.',
        ctaLabel: 'Upgrade plan',
        ctaHref: `${APP_URL}/pricing`,
        closingNote: 'If you believe your balance is incorrect, reply to this email and we’ll investigate.',
      }),
    },

    // 4) Core Product Events
    {
      id: 'enrichment-job-completed',
      category: 'Core Product Events',
      name: 'Enrichment Job Completed',
      subject: 'Your enrichment job is complete',
      html: buildMmgTransactionalEmail({
        appUrl: APP_URL,
        logoUrl: LOGO_URL,
        docTitle: 'MMG Job Completed',
        h1: 'Job completed',
        intro: 'Good news — your enrichment job finished successfully.',
        cardEyebrow: 'Job',
        cardTitle: 'Results ready to download',
        cardBody: 'Open your dashboard to review the output and export the enriched file.',
        ctaLabel: 'Open results',
        ctaHref: `${APP_URL}/dashboard`,
        closingNote: 'If you want to optimize match rates, reply to this email and we’ll share best practices.',
      }),
    },
    {
      id: 'ai-campaign-ready',
      category: 'Core Product Events',
      name: 'AI Campaign Ready',
      subject: 'Your AI campaign file is ready',
      html: buildMmgTransactionalEmail({
        appUrl: APP_URL,
        logoUrl: LOGO_URL,
        docTitle: 'MMG Campaign Ready',
        h1: 'Your campaign is ready',
        intro: 'Your AI campaign output is ready for review and export.',
        cardEyebrow: 'Campaign',
        cardTitle: 'Export available',
        cardBody: 'Download your campaign file and send with your preferred provider.',
        ctaLabel: 'View campaign',
        ctaHref: `${APP_URL}/dashboard`,
        closingNote: 'If you want help improving subject lines, reply to this email.',
      }),
    },
    {
      id: 'job-failed-partial',
      category: 'Core Product Events',
      name: 'Job Failed / Partial Completion',
      subject: 'Your job needs attention',
      html: buildMmgTransactionalEmail({
        appUrl: APP_URL,
        logoUrl: LOGO_URL,
        docTitle: 'MMG Job Issue',
        h1: 'Your job needs attention',
        intro: 'We hit an issue while processing your job. Some records may have completed successfully.',
        cardEyebrow: 'Job',
        cardTitle: 'Failed or partially completed',
        cardBody: 'Open your dashboard to review errors and retry or adjust inputs.',
        ctaLabel: 'Review job',
        ctaHref: `${APP_URL}/dashboard`,
        closingNote: 'Reply to this email with your job ID ({{job_id}}) and we’ll help troubleshoot.',
      }),
    },

    // 5) Billing & Subscription
    {
      id: 'plan-upgraded-successfully',
      category: 'Billing & Subscription',
      name: 'Plan Upgraded Successfully',
      subject: 'Your plan upgrade is confirmed',
      html: buildMmgTransactionalEmail({
        appUrl: APP_URL,
        logoUrl: LOGO_URL,
        docTitle: 'MMG Plan Upgraded',
        h1: 'Your plan upgrade is confirmed',
        intro: 'Thanks — your plan was upgraded and new limits are now active.',
        cardEyebrow: 'Subscription',
        cardTitle: 'Upgrade successful',
        cardBody: 'Your updated credits and feature access are available in your dashboard.',
        ctaLabel: 'View billing',
        ctaHref: `${APP_URL}/dashboard`,
        closingNote: 'If you didn’t request this change, please reply to this email right away.',
      }),
    },
    {
      id: 'payment-success-invoice-generated',
      category: 'Billing & Subscription',
      name: 'Payment Successful / Invoice Generated',
      subject: 'Payment received — invoice available',
      html: buildMmgTransactionalEmail({
        appUrl: APP_URL,
        logoUrl: LOGO_URL,
        docTitle: 'MMG Payment Received',
        h1: 'Payment received',
        intro: 'Your payment was successful and your invoice is ready.',
        cardEyebrow: 'Billing',
        cardTitle: 'Invoice generated',
        cardBody: 'You can download invoices and manage billing settings from your dashboard.',
        ctaLabel: 'View invoices',
        ctaHref: `${APP_URL}/dashboard`,
        closingNote: 'If you have billing questions, reply to this email and we’ll help.',
      }),
    },
    {
      id: 'payment-failed-action-required',
      category: 'Billing & Subscription',
      name: 'Payment Failed – Action Required',
      subject: 'Payment failed — update your billing to avoid interruption',
      html: buildMmgTransactionalEmail({
        appUrl: APP_URL,
        logoUrl: LOGO_URL,
        docTitle: 'MMG Payment Failed',
        h1: 'Payment failed',
        intro: 'We couldn’t process your latest payment. Please update your billing method to avoid any interruption.',
        cardEyebrow: 'Billing',
        cardTitle: 'Action required',
        cardBody: 'Update your payment method to keep your subscription active.',
        ctaLabel: 'Update billing',
        ctaHref: `${APP_URL}/dashboard`,
        closingNote: 'If you believe this is a mistake, reply to this email and we’ll investigate.',
      }),
    },

    // 6) Trust & Compliance
    {
      id: 'api-key-created',
      category: 'Trust & Compliance',
      name: 'API Key Created / Access Granted (if applicable)',
      subject: 'A new API key was created for your account',
      html: buildMmgTransactionalEmail({
        appUrl: APP_URL,
        logoUrl: LOGO_URL,
        docTitle: 'MMG API Key Created',
        h1: 'API key created',
        intro: 'A new API key was created for your account. If this wasn’t you, act immediately.',
        cardEyebrow: 'Security',
        cardTitle: 'New API access',
        cardBody: 'You can rotate or revoke keys anytime from your dashboard/security settings.',
        ctaLabel: 'Manage API keys',
        ctaHref: `${APP_URL}/dashboard`,
        closingNote: 'If you didn’t create this key, reply to this email right away.',
      }),
    },
    {
      id: 'account-suspended',
      category: 'Trust & Compliance',
      name: 'Account Suspended / Access Restricted',
      subject: 'Your account access is restricted',
      html: buildMmgTransactionalEmail({
        appUrl: APP_URL,
        logoUrl: LOGO_URL,
        docTitle: 'MMG Account Restricted',
        h1: 'Account access restricted',
        intro: 'Your account has been restricted. This may be due to policy, security, or billing issues.',
        cardEyebrow: 'Notice',
        cardTitle: 'Access restricted',
        cardBody: 'Open your dashboard for details, or contact support if you believe this is an error.',
        ctaLabel: 'Open dashboard',
        ctaHref: `${APP_URL}/dashboard`,
        closingNote: 'Reply to this email and we’ll help resolve this as quickly as possible.',
      }),
    },
  ];
}


