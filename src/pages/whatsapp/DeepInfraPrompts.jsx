import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import Header from '../../partials/Header';
import Sidebar from '../../partials/Sidebar';
import whatsappThreadWatcherService from '../../services/whatsappThreadWatcherService';

const EMPTY_FORM = {
  rowKey: '',
  promptName: '',
  promptText: ''
};

function DeepInfraPrompts() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);

  const activePrompt = useMemo(() => prompts.find((p) => p.isActive), [prompts]);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const rows = await whatsappThreadWatcherService.listPrompts();
      setPrompts(rows);
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.promptName.trim() || !form.promptText.trim()) {
      toast.error('Prompt name and prompt text are required');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && form.rowKey) {
        await whatsappThreadWatcherService.updatePrompt(form.rowKey, {
          promptName: form.promptName.trim(),
          promptText: form.promptText
        });
        toast.success('Prompt updated');
      } else {
        await whatsappThreadWatcherService.createPrompt({
          promptName: form.promptName.trim(),
          promptText: form.promptText,
          makeActive: false
        });
        toast.success('Prompt created');
      }
      resetForm();
      await fetchPrompts();
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || 'Failed to save prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (prompt) => {
    setForm({
      rowKey: prompt.rowKey,
      promptName: prompt.promptName || '',
      promptText: prompt.promptText || ''
    });
    setIsEditing(true);
  };

  const handleActivate = async (rowKey) => {
    try {
      await whatsappThreadWatcherService.activatePrompt(rowKey);
      toast.success('Prompt activated');
      await fetchPrompts();
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || 'Failed to activate prompt');
    }
  };

  const handleDelete = async (rowKey) => {
    if (!window.confirm('Delete this prompt?')) return;
    try {
      await whatsappThreadWatcherService.deletePrompt(rowKey);
      toast.success('Prompt deleted');
      await fetchPrompts();
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || 'Failed to delete prompt');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="sidebar-shell-main-noscroll">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="p-6 space-y-5 overflow-y-auto">
          <div className="rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 p-5">
            <h1 className="text-xl font-semibold">DeepInfra Prompts</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage multiple orchestration prompts for autonomous WhatsApp replies.
            </p>
            <div className="mt-3 text-sm">
              Active prompt: <strong>{activePrompt?.promptName || 'None'}</strong>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 p-5">
            <h2 className="text-lg font-semibold">{isEditing ? 'Edit Prompt' : 'Create Prompt'}</h2>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <input
                value={form.promptName}
                onChange={(e) => setForm((prev) => ({ ...prev, promptName: e.target.value }))}
                placeholder="Prompt name"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5"
              />
              <textarea
                rows={8}
                value={form.promptText}
                onChange={(e) => setForm((prev) => ({ ...prev, promptText: e.target.value }))}
                placeholder="Prompt text used for orchestration"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : isEditing ? 'Update Prompt' : 'Create Prompt'}
                </button>
                {isEditing ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Prompt Library</h2>
              <button
                type="button"
                onClick={fetchPrompts}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-slate-500">Loading prompts...</div>
            ) : prompts.length === 0 ? (
              <div className="py-8 text-slate-500">No prompts found.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {prompts.map((prompt) => (
                  <div key={prompt.rowKey} className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium">{prompt.promptName}</div>
                        <div className="text-xs text-slate-500 mt-1">Key: {prompt.rowKey}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(prompt)}
                          className="px-3 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-600"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleActivate(prompt.rowKey)}
                          className="px-3 py-1.5 text-sm rounded bg-emerald-600 text-white"
                        >
                          {prompt.isActive ? 'Active' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(prompt.rowKey)}
                          className="px-3 py-1.5 text-sm rounded bg-rose-600 text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 text-sm whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300">
                      {prompt.promptText}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default DeepInfraPrompts;
