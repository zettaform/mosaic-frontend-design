import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  EnvelopeIcon,
  DocumentTextIcon,
  UserIcon,
  ArrowRightIcon,
  SparklesIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import adminApiService from '../../services/adminApiService';
import promptTemplatesService from '../../services/promptTemplatesService';

async function fetchInstagramCaptionsForUser(usernameOrId, limit = 12) {
  const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const params = new URLSearchParams();
  params.set('username', usernameOrId);
  params.set('limit', String(limit));
  const response = await fetch(`/api/instagram/captions?${params}`, { headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  return data.captions || [];
}

/** Extract Instagram handle from plain text or profile URL. */
export function parseInstagramUsername(input) {
  const raw = String(input || '').trim();
  if (!raw) return '';
  const lower = raw.toLowerCase();
  if (lower.includes('instagram.com')) {
    try {
      const url = raw.includes('://') ? new URL(raw) : new URL(`https://${raw}`);
      if (!url.hostname.replace(/^www\./, '').endsWith('instagram.com')) {
        return raw.replace(/^@/, '').split('/')[0].split('?')[0];
      }
      const segments = url.pathname.split('/').filter(Boolean);
      const first = segments[0];
      if (!first) return '';
      if (['p', 'reel', 'reels', 'stories', 'explore', 'tv'].includes(first)) return '';
      return first.split('?')[0];
    } catch {
      return raw.replace(/^@/, '').split('/')[0].split('?')[0];
    }
  }
  return raw.replace(/^@/, '').split('/')[0].split('?')[0].trim();
}

function toTimestampIso(ts) {
  if (ts == null || ts === '') return 'unknown time';
  const n = Number(ts);
  if (Number.isNaN(n)) return String(ts);
  const ms = n > 1e12 ? n : n * 1000;
  try {
    return new Date(ms).toISOString();
  } catch {
    return String(ts);
  }
}

function sortCaptionTs(a, b) {
  const ta = Number(a.timestamp) || 0;
  const tb = Number(b.timestamp) || 0;
  const sa = ta > 1e12 ? ta / 1000 : ta;
  const sb = tb > 1e12 ? tb / 1000 : tb;
  return sa - sb;
}

/** Build paragraph for OpenAI: chronological, separated by blank lines, labeled with timestamps. */
export function buildCaptionParagraph(captions) {
  if (!Array.isArray(captions) || captions.length === 0) return '';
  const sorted = [...captions].sort(sortCaptionTs);
  return sorted
    .map((c) => {
      const ts = toTimestampIso(c.timestamp);
      const text = (c.caption || '').trim() || '(no caption)';
      return `[${ts}] ${text}`;
    })
    .join('\n\n');
}

function ManualSends() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [captions, setCaptions] = useState([]);
  const [fetchingCaptions, setFetchingCaptions] = useState(false);
  const [captionParagraph, setCaptionParagraph] = useState('');
  const [resolvedLabel, setResolvedLabel] = useState('');

  const [promptTemplates, setPromptTemplates] = useState([]);
  const [selectedTemplateContent, setSelectedTemplateContent] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  const [openaiModels, setOpenaiModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsLoadError, setModelsLoadError] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');

  const [draftEmail, setDraftEmail] = useState('');
  const [writing, setWriting] = useState(false);

  const loadModelsAndTemplates = useCallback(async () => {
    setModelsLoading(true);
    setModelsLoadError('');
    try {
      const [modelsRes, tplRes] = await Promise.all([
        adminApiService.getOpenAIModels(),
        promptTemplatesService.getTemplates(user?.email)
      ]);

      const rawModels = modelsRes?.models ?? modelsRes?.data;
      if (modelsRes.success && Array.isArray(rawModels)) {
        setOpenaiModels(rawModels);
        if (rawModels.length === 0) {
          setModelsLoadError('No models returned from OpenAI (check server OPENAI_API_KEY and model filters).');
        }
      } else {
        const err = modelsRes?.error || 'Failed to load OpenAI models';
        setModelsLoadError(err);
        toast.error(err);
      }

      if (tplRes.success && Array.isArray(tplRes.templates)) {
        setPromptTemplates((tplRes.templates || []).filter((t) => t && t.isActive !== false));
      }
    } catch (e) {
      const msg = e.message || 'Failed to load models or templates';
      setModelsLoadError(msg);
      toast.error(msg);
    } finally {
      setModelsLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (user) loadModelsAndTemplates();
  }, [user, loadModelsAndTemplates]);

  const paragraphPreview = useMemo(() => captionParagraph, [captionParagraph]);

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  const handleFetchCaptions = async () => {
    const parsed = parseInstagramUsername(usernameInput);
    if (!parsed) {
      toast.error('Enter an Instagram username or profile URL');
      return;
    }

    setFetchingCaptions(true);
    setCaptions([]);
    setCaptionParagraph('');
    setResolvedLabel('');
    try {
      const isNumericId = /^\d+$/.test(parsed);
      const list = await fetchInstagramCaptionsForUser(parsed, 12);
      setCaptions(list);
      const para = buildCaptionParagraph(list);
      setCaptionParagraph(para);
      setResolvedLabel(isNumericId ? `User ID ${parsed}` : `@${parsed}`);
      toast.success(`Fetched ${list.length} caption(s)`);
    } catch (e) {
      toast.error(e.message || 'Failed to fetch captions');
    } finally {
      setFetchingCaptions(false);
    }
  };

  const handleWriteEmail = async () => {
    const hasTemplate = (selectedTemplateContent || '').trim().length > 0;
    const hasCustom = customPrompt.trim().length > 0;
    if (!hasTemplate && !hasCustom) {
      toast.error('Choose a prompt template or enter a custom prompt');
      return;
    }
    if (!captionParagraph.trim()) {
      toast.error('Fetch captions first');
      return;
    }
    if (!selectedModelId) {
      toast.error('Select an OpenAI model');
      return;
    }

    setWriting(true);
    try {
      const payload = {
        manualEmailMode: true,
        preformattedCaptions: captionParagraph,
        modelId: selectedModelId
      };
      if (hasCustom) {
        payload.customPrompt = customPrompt.trim();
      } else {
        payload.promptTemplate = selectedTemplateContent.trim();
      }

      const result = await adminApiService.analyzeInstagramCaptions(payload);

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate email');
      }

      setDraftEmail(result.analysis || '');
      toast.success('Draft ready — edit below');
    } catch (e) {
      toast.error(e.message || 'Failed to write email');
    } finally {
      setWriting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                  <EnvelopeIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Manual Sends</h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Load a prospect’s Instagram captions, pick a prompt and OpenAI model, then generate an editable email draft.
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-blue-500" />
                    Instagram username or URL
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                    Examples: <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 rounded">loczidesign</code>,{' '}
                    <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 rounded">instagram.com/loczidesign/</code>
                  </p>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Username or https://www.instagram.com/…"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 mb-4"
                  />
                  <button
                    type="button"
                    onClick={handleFetchCaptions}
                    disabled={fetchingCaptions || !usernameInput.trim()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {fetchingCaptions ? (
                      'Loading…'
                    ) : (
                      <>
                        <ListBulletIcon className="h-5 w-5" />
                        Fetch last 12 captions
                        <ArrowRightIcon className="h-5 w-5" />
                      </>
                    )}
                  </button>
                  {resolvedLabel && (
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                      Resolved: {resolvedLabel} · {captions.length} post(s)
                    </p>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5 text-green-500" />
                    Captions (for model context)
                  </h3>
                  {captions.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-sm">No captions yet.</p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto text-sm">
                      {captions.map((c, i) => (
                        <div
                          key={c.id || i}
                          className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                        >
                          <div className="text-xs text-slate-500 mb-1">{toTimestampIso(c.timestamp)}</div>
                          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{c.caption || '—'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <SparklesIcon className="h-5 w-5 text-purple-500" />
                    Prompt template (from Prompt Templates)
                  </h3>
                  <select
                    value={selectedTemplateContent}
                    onChange={(e) => {
                      setSelectedTemplateContent(e.target.value);
                      if (e.target.value) setCustomPrompt('');
                    }}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl mb-4 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Choose a template…</option>
                    {promptTemplates.map((t) => (
                      <option key={t.id} value={t.content}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Or custom prompt
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => {
                      setCustomPrompt(e.target.value);
                      if (e.target.value) setSelectedTemplateContent('');
                    }}
                    rows={3}
                    placeholder="Overrides template when filled"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                    OpenAI model (same list as AI Models page)
                  </h3>
                  <select
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    disabled={modelsLoading}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Select model…</option>
                    {openaiModels.map((m) => {
                      const id = m?.id ?? m?.model ?? '';
                      const label = m?.name ?? m?.id ?? String(id);
                      if (!id) return null;
                      return (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  {modelsLoading && <p className="text-sm text-slate-500 mt-2">Loading models…</p>}
                  {!modelsLoading && modelsLoadError && (
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">{modelsLoadError}</p>
                  )}
                  {!modelsLoading && !modelsLoadError && openaiModels.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      No models in the list. Ensure OPENAI_API_KEY is set on the API server.
                    </p>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Caption paragraph (sent to OpenAI with your prompt)
                  </h3>
                  <textarea
                    readOnly
                    value={paragraphPreview}
                    rows={8}
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleWriteEmail}
                  disabled={writing}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {writing ? 'Writing…' : 'Write email (OpenAI)'}
                </button>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
                    Editable draft
                  </h3>
                  <textarea
                    value={draftEmail}
                    onChange={(e) => setDraftEmail(e.target.value)}
                    rows={14}
                    placeholder="Generated email appears here — edit as needed."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ManualSends;
