import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import Header from '../../partials/Header';
import Sidebar from '../../partials/Sidebar';
import whatsappThreadWatcherService from '../../services/whatsappThreadWatcherService';

const POLL_INTERVAL_MS = 5000;

function formatTime(value) {
  if (!value) return '--';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
}

function normalizeMessages(rawMessages) {
  return (rawMessages || []).map((m) => ({
    msgId: m.msgId,
    direction: m.direction,
    text: m.text || '',
    status: m.status,
    time: m.timeIso || m.time || '',
    channel: m.channel
  }));
}

/** Last chronologically incoming row — robust when msgId repeats or is 0 after several API pages. */
function getLastIncomingFingerprint(rawMessages) {
  const list = rawMessages || [];
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const m = list[i];
    if (m.direction === 'incoming') {
      const id = Number(m.msgId || 0);
      const t = String(m.time || '');
      const body = String(m.text || '');
      return `${id}|${t}|${body.slice(0, 200)}`;
    }
  }
  return '';
}

function playIncomingSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.value = 0.02;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      ctx.close();
    }, 180);
  } catch {
    // no-op
  }
}

function ThreadWatcher() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contactNoInput, setContactNoInput] = useState('');
  const [activeContactNo, setActiveContactNo] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyMode, setReplyMode] = useState('manual');
  const [isAiReplying, setIsAiReplying] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const [selectedPromptRowKey, setSelectedPromptRowKey] = useState('');
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  const lastSeenIncomingFingerprintRef = useRef('');
  const lastAiHandledIncomingFingerprintRef = useRef('');
  const lastIncomingCountRef = useRef(0);
  const isAiReplyingRef = useRef(false);
  const threadPollBootstrappedRef = useRef(false);
  const pollRef = useRef(null);

  const sanitizedInput = useMemo(
    () => whatsappThreadWatcherService.sanitizeNumber(contactNoInput),
    [contactNoInput]
  );

  const fetchThread = useCallback(
    async ({ silent = false } = {}) => {
      if (!activeContactNo) return;

      if (silent) setRefreshing(true);
      else setLoading(true);
      setError('');

      try {
        const thread = await whatsappThreadWatcherService.fetchThread(activeContactNo, true);
        const nextMessages = normalizeMessages(thread?.messages);

        const incomingFp = getLastIncomingFingerprint(nextMessages);
        const incomingCount = nextMessages.filter((m) => m.direction === 'incoming').length;

        if (!threadPollBootstrappedRef.current) {
          threadPollBootstrappedRef.current = true;
          setMessages(nextMessages);
          setLastRefreshedAt(new Date().toISOString());
          lastSeenIncomingFingerprintRef.current = incomingFp;
          lastIncomingCountRef.current = incomingCount;
        } else {
        const hadNewIncoming =
          incomingFp !== '' && incomingFp !== lastSeenIncomingFingerprintRef.current;

        if (hadNewIncoming) {
          const delta = Math.max(1, incomingCount - lastIncomingCountRef.current);
          setNewMessageCount((prev) => prev + delta);
          playIncomingSound();
          toast.success(`New incoming message${delta > 1 ? 's' : ''} received`);
        }

        setMessages(nextMessages);
        setLastRefreshedAt(new Date().toISOString());

        const shouldAutoAi =
          replyMode === 'ai' &&
          hadNewIncoming &&
          incomingFp !== '' &&
          incomingFp !== lastAiHandledIncomingFingerprintRef.current &&
          !isAiReplyingRef.current;

        let seenFpToStore = incomingFp;
        let incomingCountToStore = incomingCount;
        let autoAiSucceeded = false;

        if (shouldAutoAi) {
          const fingerprintForThisReply = incomingFp;
          isAiReplyingRef.current = true;
          setIsAiReplying(true);
          try {
            await whatsappThreadWatcherService.sendDeepInfraReply(
              activeContactNo,
              null,
              selectedPromptRowKey || null
            );
            lastAiHandledIncomingFingerprintRef.current = fingerprintForThisReply;
            toast.success('AI reply sent');
            const refreshed = await whatsappThreadWatcherService.fetchThread(activeContactNo, true);
            const refreshedNorm = normalizeMessages(refreshed?.messages);
            setMessages(refreshedNorm);
            setLastRefreshedAt(new Date().toISOString());
            seenFpToStore = getLastIncomingFingerprint(refreshedNorm);
            incomingCountToStore = refreshedNorm.filter((m) => m.direction === 'incoming').length;
            autoAiSucceeded = true;
          } catch (aiError) {
            const aiMsg = aiError?.response?.data?.error || aiError?.message || 'Failed to send AI reply';
            toast.error(aiMsg);
          } finally {
            isAiReplyingRef.current = false;
            setIsAiReplying(false);
          }
        }

        if (!shouldAutoAi || autoAiSucceeded) {
          lastSeenIncomingFingerprintRef.current = seenFpToStore;
          lastIncomingCountRef.current = incomingCountToStore;
        }
        }
      } catch (err) {
        const message = err?.response?.data?.error || err?.message || 'Failed to fetch thread';
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeContactNo, replyMode, selectedPromptRowKey]
  );

  const fetchPrompts = useCallback(async () => {
    try {
      const rows = await whatsappThreadWatcherService.listPrompts();
      setPrompts(rows);
      const active = rows.find((p) => p.isActive);
      if (!selectedPromptRowKey) {
        setSelectedPromptRowKey(active?.rowKey || rows[0]?.rowKey || '');
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || 'Failed to load prompts');
    }
  }, [selectedPromptRowKey]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  useEffect(() => {
    if (!activeContactNo) return undefined;
    fetchThread();

    pollRef.current = window.setInterval(() => {
      fetchThread({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
      }
    };
  }, [activeContactNo, fetchThread]);

  const handleTrackThread = async (e) => {
    e.preventDefault();
    if (!sanitizedInput) {
      toast.error('Enter a valid phone number');
      return;
    }
    setMessages([]);
    setNewMessageCount(0);
    lastSeenIncomingFingerprintRef.current = '';
    lastAiHandledIncomingFingerprintRef.current = '';
    lastIncomingCountRef.current = 0;
    threadPollBootstrappedRef.current = false;
    setActiveContactNo(sanitizedInput);
  };
  const handleSendAiReplyNow = async () => {
    if (!activeContactNo) {
      toast.error('Track a number before AI reply');
      return;
    }
    isAiReplyingRef.current = true;
    setIsAiReplying(true);
    try {
      await whatsappThreadWatcherService.sendDeepInfraReply(
        activeContactNo,
        null,
        selectedPromptRowKey || null
      );
      const thread = await whatsappThreadWatcherService.fetchThread(activeContactNo, true);
      const norm = normalizeMessages(thread?.messages);
      const fp = getLastIncomingFingerprint(norm);
      lastAiHandledIncomingFingerprintRef.current = fp;
      lastSeenIncomingFingerprintRef.current = fp;
      lastIncomingCountRef.current = norm.filter((m) => m.direction === 'incoming').length;
      setMessages(norm);
      setLastRefreshedAt(new Date().toISOString());
      toast.success('AI reply sent');
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || 'Failed to send AI reply';
      toast.error(message);
    } finally {
      isAiReplyingRef.current = false;
      setIsAiReplying(false);
    }
  };


  const handleSendReply = async () => {
    if (!activeContactNo) {
      toast.error('Track a number before sending');
      return;
    }
    if (!replyText.trim()) {
      toast.error('Reply message cannot be empty');
      return;
    }

    setIsSending(true);
    try {
      await whatsappThreadWatcherService.sendText(activeContactNo, replyText.trim());
      toast.success('Reply sent');
      setReplyText('');
      await fetchThread({ silent: true });
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || 'Failed to send reply';
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="sidebar-shell-main-noscroll">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="p-6 space-y-4 overflow-y-auto">
          <div className="rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 p-5">
            <h1 className="text-xl font-semibold">WhatsApp Thread Watcher</h1>
            <p className="text-sm text-slate-500 mt-1">
              Enter one number to watch. Thread refreshes every 5 seconds with incoming message audio alerts.
            </p>

            <form className="mt-4 flex gap-3" onSubmit={handleTrackThread}>
              <input
                value={contactNoInput}
                onChange={(e) => setContactNoInput(e.target.value)}
                placeholder="Enter phone number (e.g. 18199541012)"
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Track Thread
              </button>
            </form>

            <div className="mt-3 text-sm text-slate-600 dark:text-slate-300 flex gap-4 flex-wrap">
              <span>Active number: <strong>{activeContactNo || '--'}</strong></span>
              <span>Refresh: every {POLL_INTERVAL_MS / 1000}s</span>
              <span>New incoming: <strong>{newMessageCount}</strong></span>
              <span>Last refreshed: <strong>{formatTime(lastRefreshedAt)}</strong></span>
              <span>Mode: <strong>{replyMode === 'ai' ? 'AI (DeepInfra)' : 'Manual'}</strong></span>
              {refreshing ? <span className="text-indigo-500">Refreshing...</span> : null}
              {isAiReplying ? <span className="text-emerald-500">AI replying...</span> : null}
            </div>
            {error ? <div className="mt-3 text-sm text-red-500">{error}</div> : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 p-5">
            <h2 className="text-lg font-semibold">Thread</h2>
            {loading ? (
              <div className="py-8 text-slate-500">Loading thread...</div>
            ) : messages.length === 0 ? (
              <div className="py-8 text-slate-500">No messages loaded yet.</div>
            ) : (
              <div className="mt-4 max-h-[50vh] overflow-y-auto space-y-3 pr-1">
                {messages.map((m, idx) => (
                  <div
                    key={`${m.msgId}-${m.time}-${idx}`}
                    className={`p-3 rounded-lg ${
                      m.direction === 'outgoing'
                        ? 'bg-indigo-600 text-white ml-12'
                        : 'bg-slate-100 dark:bg-slate-800 mr-12'
                    }`}
                  >
                    <div className="text-xs opacity-80 mb-1">
                      {m.direction === 'outgoing' ? 'Outgoing' : 'Incoming'} | ID {m.msgId} | {formatTime(m.time)}
                    </div>
                    <div className="whitespace-pre-wrap break-words">{m.text || '(empty)'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 p-5">
            <h2 className="text-lg font-semibold">Reply</h2>
            <div className="mt-3 flex items-center gap-6 flex-wrap">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="reply-mode"
                  checked={replyMode === 'manual'}
                  onChange={() => setReplyMode('manual')}
                />
                Manual replies
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="reply-mode"
                  checked={replyMode === 'ai'}
                  onChange={() => setReplyMode('ai')}
                />
                AI DeepInfra endpoint
              </label>
            </div>

            {replyMode === 'manual' ? (
              <div className="mt-3 flex gap-3">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder="Type message to send"
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5"
                />
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={isSending}
                  className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isSending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            ) : (
              <>
                <div className="mt-3 flex gap-3 items-center">
                  <button
                    type="button"
                    onClick={handleSendAiReplyNow}
                    disabled={isAiReplying}
                    className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {isAiReplying ? 'Generating...' : 'Generate AI Reply Now'}
                  </button>
                  <div className="text-sm text-slate-500">
                    Auto-reply is active on each new incoming message while AI mode is enabled.
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm mb-1">DeepInfra prompt</label>
                  <select
                    value={selectedPromptRowKey}
                    onChange={(e) => setSelectedPromptRowKey(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5"
                  >
                    {prompts.map((prompt) => (
                      <option key={prompt.rowKey} value={prompt.rowKey}>
                        {prompt.promptName}{prompt.isActive ? ' (active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ThreadWatcher;
