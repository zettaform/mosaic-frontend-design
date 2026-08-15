import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { SparklesIcon, UserIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

function formatTs(ts) {
  const n = Number(ts);
  if (Number.isNaN(n)) return String(ts || '');
  const ms = n > 1e12 ? n : n * 1000;
  return new Date(ms).toISOString();
}

export default function TrialConcept() {
  const [input, setInput] = useState('');
  const [captionLimit, setCaptionLimit] = useState('12');
  const [prompts, setPrompts] = useState([]);
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [captions, setCaptions] = useState([]);
  const [resolvedUserId, setResolvedUserId] = useState('');
  const [fetchingCaptions, setFetchingCaptions] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const loadPrompts = async () => {
      try {
        const response = await fetch('/api/trial-concept/prompts');
        const data = await response.json();
        if (!response.ok || data.success === false) {
          throw new Error(data.error || 'Failed to load prompts');
        }
        setPrompts(data.prompts || []);
      } catch (error) {
        toast.error(error.message || 'Failed to load prompts');
      }
    };
    loadPrompts();
  }, []);

  const handleFetchCaptions = async () => {
    if (!input.trim()) {
      toast.error('Enter an Instagram username, profile URL, or user ID');
      return;
    }
    setFetchingCaptions(true);
    setCaptions([]);
    setResolvedUserId('');
    try {
      const params = new URLSearchParams({ input: input.trim(), limit: captionLimit });
      const response = await fetch(`/api/trial-concept/captions?${params.toString()}`);
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Failed to fetch captions');
      }
      setCaptions(data.captions || []);
      setResolvedUserId(String(data.resolvedUserId || ''));
      toast.success(`Fetched ${(data.captions || []).length} captions`);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch captions');
    } finally {
      setFetchingCaptions(false);
    }
  };

  const handleGenerate = async () => {
    if (!input.trim()) {
      toast.error('Enter an Instagram username, profile URL, or user ID');
      return;
    }
    if (!selectedPromptId && !customPrompt.trim()) {
      toast.error('Pick a prompt or enter a custom prompt');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/trial-concept/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: input.trim(),
          limit: Number(captionLimit),
          promptId: selectedPromptId || undefined,
          customPrompt: customPrompt.trim() || undefined
        })
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Failed to generate email');
      }
      setEmail(data.email || '');
      if (!captions.length && Array.isArray(data.captions)) {
        setCaptions(data.captions);
      }
      if (!resolvedUserId && data.resolvedUserId) {
        setResolvedUserId(String(data.resolvedUserId));
      }
      toast.success('Personalized email generated');
    } catch (error) {
      toast.error(error.message || 'Failed to generate email');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Trial Concept</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Enter an Instagram username, profile link, or user ID, fetch captions, choose a prompt, and generate a personalized trial email.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-3">
                <UserIcon className="h-5 w-5 text-indigo-500" />
                Prospect Input
              </h2>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Username, instagram.com/username, or numeric user ID"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100"
              />
              <div className="mt-3">
                <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Captions to retrieve</label>
                <select
                  value={captionLimit}
                  onChange={(e) => setCaptionLimit(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100"
                >
                  <option value="12">12 captions</option>
                  <option value="24">24 captions</option>
                  <option value="36">36 captions</option>
                  <option value="48">48 captions</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleFetchCaptions}
                disabled={fetchingCaptions}
                className="mt-3 w-full rounded-lg bg-indigo-600 text-white py-2.5 font-medium disabled:opacity-60"
              >
                {fetchingCaptions ? 'Fetching captions...' : 'Fetch captions'}
              </button>
              {resolvedUserId && (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Resolved user ID: {resolvedUserId}</p>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-3">
                <SparklesIcon className="h-5 w-5 text-purple-500" />
                Prompt Selection
              </h2>
              <select
                value={selectedPromptId}
                onChange={(e) => {
                  setSelectedPromptId(e.target.value);
                  if (e.target.value) setCustomPrompt('');
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100"
              >
                <option value="">Choose seeded prompt...</option>
                {prompts.map((prompt) => (
                  <option key={prompt.id} value={prompt.id}>
                    {prompt.name}
                  </option>
                ))}
              </select>
              <textarea
                rows={4}
                value={customPrompt}
                onChange={(e) => {
                  setCustomPrompt(e.target.value);
                  if (e.target.value) setSelectedPromptId('');
                }}
                placeholder="Or write a custom prompt"
                className="mt-3 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="mt-3 w-full rounded-lg bg-emerald-600 text-white py-2.5 font-medium disabled:opacity-60"
              >
                {generating ? 'Generating email...' : 'Generate personalized email'}
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-3">
                <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                Captions Preview
              </h2>
              {!captions.length ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No captions loaded yet.</p>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2">
                  {captions.map((caption, idx) => (
                    <div
                      key={caption.id || idx}
                      className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3"
                    >
                      <div className="text-xs text-slate-500 mb-1">{formatTs(caption.timestamp)}</div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {caption.caption || '(no caption)'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Personalized Trial Email</h2>
            <textarea
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              rows={32}
              placeholder="Generated email appears here."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
