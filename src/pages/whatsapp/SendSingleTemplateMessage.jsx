import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import whatsappService, {
  normalizeTemplatesResponse,
  getTemplateNumericId,
  extractCampaignSendResult,
} from '../../services/whatsappService';
import { toast } from 'react-hot-toast';

const ATTR_KEYS = ['attribute1', 'attribute2', 'attribute3', 'attribute4', 'attribute5', 'attribute6', 'attribute7', 'attribute8'];

function normalizePhoneForApi(value) {
  return String(value || '')
    .replace(/\s+/g, '')
    .replace(/^\+/, '');
}

function templateLabel(t, index) {
  return t.templateName || t.name || t.TemplateName || `Template ${index + 1}`;
}

function WhatsAppSendSingleTemplateMessage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const [contactName, setContactName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [attributes, setAttributes] = useState(() =>
    Object.fromEntries(ATTR_KEYS.map((k) => [k, '']))
  );

  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    setLastResult(null);
    try {
      const response = await whatsappService.campaigns.getTemplates();
      const list = normalizeTemplatesResponse(response.data);
      setTemplates(list);
      setSelectedIndex(list.length ? 0 : -1);
      if (list.length) toast.success(`Loaded ${list.length} template(s)`);
      else toast('No templates returned from API', { icon: 'ℹ️' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load templates');
      setTemplates([]);
      setSelectedIndex(-1);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const selectedTemplate = selectedIndex >= 0 ? templates[selectedIndex] : null;
  const templateId = useMemo(() => (selectedTemplate ? getTemplateNumericId(selectedTemplate) : null), [selectedTemplate]);

  const setAttr = (key, value) => {
    setAttributes((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const phone = normalizePhoneForApi(contactNo);
    if (!phone) {
      toast.error('Enter a valid phone number');
      return;
    }
    if (templateId == null) {
      toast.error('Select a template with a valid ID');
      return;
    }

    setSending(true);
    setLastResult(null);
    try {
      // SendCampaign binds the body to List<CampaignContactListDto> — a JSON array at the root, not { contactDtos: [...] }.
      // Do not send mediaFile/mediaFileName here (those are IFormFile / multipart only).
      const contactDto = {
        contactNo: phone,
        contactName: contactName.trim() || 'Recipient',
      };
      for (let i = 1; i <= 8; i += 1) {
        contactDto[`attribute${i}`] = (attributes[`attribute${i}`] ?? '').trim();
      }

      const body = [contactDto];

      const response = await whatsappService.campaigns.sendCampaign(templateId, body);
      const { campaignId, raw } = extractCampaignSendResult(response.data);
      setLastResult({ campaignId, raw, ok: true });
      if (campaignId != null) {
        toast.success('Message queued — campaign created');
      } else {
        toast.success('Request completed — check response details for the campaign reference');
      }
    } catch (error) {
      const d = error.response?.data;
      const validation =
        d?.errors &&
        Object.values(d.errors)
          .flat()
          .filter(Boolean)[0];
      const msg =
        validation ||
        d?.title ||
        d?.message ||
        d?.error ||
        error.message ||
        'Send failed';
      toast.error(typeof msg === 'string' ? msg : 'Send failed');
      setLastResult({
        ok: false,
        campaignId: null,
        raw: error.response?.data ?? error.message,
      });
    } finally {
      setSending(false);
    }
  };

  const copyCampaignId = () => {
    if (lastResult?.campaignId == null) return;
    const text = String(lastResult.campaignId);
    navigator.clipboard.writeText(text).then(() => toast.success('Campaign ID copied')).catch(() => toast.error('Copy failed'));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="sidebar-shell-main bg-slate-50 dark:bg-slate-950">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Send single template message
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Choose an approved template, enter one recipient and optional variables — same catalog as{' '}
                  <Link to="/whatsapp/templates" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium underline underline-offset-4 decoration-indigo-500/30 hover:decoration-indigo-500 transition-colors">
                    Templates
                  </Link>
                  .
                </p>
              </div>
              <button
                type="button"
                onClick={fetchTemplates}
                disabled={loadingTemplates}
                className="shrink-0 px-4 py-2 bg-white hover:bg-slate-50 active:scale-[0.98] dark:bg-slate-900 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 shadow-sm transition-all duration-150 disabled:opacity-50"
              >
                {loadingTemplates ? 'Loading templates…' : 'Refresh templates'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left Column: Templates List */}
              <section className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col min-h-[320px]">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100 tracking-tight">Templates</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Select one — the Nosnia template ID is applied automatically.</p>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[480px]">
                  {loadingTemplates ? (
                    <div className="p-8 text-center text-slate-400 text-sm">Loading templates…</div>
                  ) : templates.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">No templates available.</div>
                  ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                      {templates.map((t, index) => {
                        const tid = getTemplateNumericId(t);
                        const active = index === selectedIndex;
                        return (
                          <li key={`${tid ?? 't'}-${index}`}>
                            <button
                              type="button"
                              onClick={() => setSelectedIndex(index)}
                              className={`w-full text-left px-5 py-4 transition-all duration-150 border-l-2 ${
                                active
                                  ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-600 text-indigo-950 dark:text-indigo-50'
                                  : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40 border-transparent text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
                                {templateLabel(t, index)}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1 font-medium">
                                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">ID: {tid != null ? tid : '—'}</span>
                                {t.mediaType && <span className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">{String(t.mediaType)}</span>}
                                {t.templateStatus && <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded">{String(t.templateStatus)}</span>}
                              </div>
                              {t.msgText && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2.5 line-clamp-2 font-mono bg-slate-50/50 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-100/50 dark:border-slate-800/30 leading-relaxed">
                                  {String(t.msgText)}
                                </p>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>

              {/* Right Column: Form */}
              <section className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Template ID display */}
                  <div className="rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/60 px-4 py-3 text-sm flex items-center justify-between shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                    <span className="font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Active template ID</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 px-2.5 py-1 rounded-lg shadow-sm">
                      {templateId != null ? templateId : '—'}
                    </span>
                  </div>

                  {/* Phone field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      value={contactNo}
                      onChange={(e) => setContactNo(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/40 dark:hover:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-150 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                      placeholder="e.g. 919876543210 (international, no +)"
                      autoComplete="tel"
                      required
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
                      Digits only; leading + is stripped automatically.
                    </p>
                  </div>

                  {/* Name field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Contact name (optional)
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/40 dark:hover:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-150 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                      placeholder="Recipient name"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal bg-slate-50/30 dark:bg-slate-900/10 p-2.5 rounded-lg border border-slate-100/50 dark:border-slate-800/30">
                    Header media for templates is sent as multipart (<code className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">IFormFile</code>), not JSON. This action sends text variables only.
                  </p>

                  {/* Variables */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3.5">
                      Template variables (attribute1–8)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {ATTR_KEYS.map((key) => (
                        <div key={key}>
                          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 capitalize">
                            {key}
                          </label>
                          <input
                            type="text"
                            value={attributes[key]}
                            onChange={(e) => setAttr(key, e.target.value)}
                            className="w-full px-3.5 py-2 text-sm bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/40 dark:hover:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-150 text-slate-900 dark:text-slate-100 placeholder-slate-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                            placeholder="—"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={sending || templateId == null || !normalizePhoneForApi(contactNo)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                  >
                    {sending ? 'Sending…' : 'Send template message'}
                  </button>
                </form>

                {/* Results/Feedback Banner */}
                {lastResult && (
                  <div
                    className={`mt-6 rounded-xl border p-4 shadow-sm ${
                      lastResult.ok
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/60'
                        : 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/60'
                    }`}
                  >
                    <div className={`text-sm font-bold tracking-tight mb-2 ${lastResult.ok ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}`}>
                      {lastResult.ok ? 'Result' : 'Error'}
                    </div>
                    {lastResult.ok && lastResult.campaignId != null && (
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Campaign ID</span>
                        <code className="text-sm font-mono font-bold text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/50 shadow-sm">
                          {String(lastResult.campaignId)}
                        </code>
                        <button
                          type="button"
                          onClick={copyCampaignId}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline underline-offset-2 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    )}
                    {lastResult.ok && lastResult.campaignId == null && (
                      <p className="text-xs text-amber-800 dark:text-amber-200 mb-2 leading-relaxed font-medium">
                        The API did not return a campaign ID in the expected shape. See raw response below.
                      </p>
                    )}
                    <details className="text-xs">
                      <summary className="cursor-pointer font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                        Raw API response
                      </summary>
                      <pre className="mt-2 p-3 rounded-lg bg-slate-950 text-slate-300 font-mono text-xs border border-slate-800 overflow-x-auto max-h-48 overflow-y-auto leading-relaxed shadow-inner">
                        {JSON.stringify(lastResult.raw, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default WhatsAppSendSingleTemplateMessage;
