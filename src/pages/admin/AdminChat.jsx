/* pages/admin/AdminChat.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Copy,
  Send,
  Bot,
  User,
  Trash2,
  Settings,
  MessageSquare,
  Zap,
  Clock,
  ChevronDown,
  Check,
} from 'lucide-react';

import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';

/* -------------------------------------------------------------------------- */
/*                         MESSAGE OBJECT (plain‑JS comment)                 */
/* -------------------------------------------------------------------------- */
/*
  Message shape:
  {
    role: 'user' | 'assistant',
    content: string,
    timestamp: string,
    error?: boolean,
    isThinking?: boolean,
  }
*/

export default function AdminChat() {
  /* ------------------------------- STATE --------------------------------- */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('deepseek-ai/DeepSeek-V3.2-Exp');
  const [conversationId, setConversationId] = useState(null);
  const [tokenUsage, setTokenUsage] = useState({
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
  });
  const [showModels, setShowModels] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [showConversations, setShowConversations] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const [chatSettings, setChatSettings] = useState({
    temperature: 0.7,
    maxTokens: 4000,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    stream: true,
  });

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  /* --------------------------- MODEL LIST -------------------------------- */
  const availableModels = [
    {
      id: 'deepseek-ai/DeepSeek-V3.2-Exp',
      name: 'DeepSeek‑V3.2-Exp',
      description: 'Latest DeepSeek model - advanced reasoning and performance',
      provider: 'DeepSeek',
      category: 'reasoning',
      contextWindow: 128000,
      precision: '16-bit',
      status: 'active',
    },
    {
      id: 'meta-llama/Meta-Llama-3-8B-Instruct',
      name: 'Llama 3 8B',
      description: 'Meta Llama 3 8B Instruct',
    },
    {
      id: 'meta-llama/Meta-Llama-3-70B-Instruct',
      name: 'Llama 3 70B',
      description: 'Meta Llama 3 70B Instruct',
    },
    {
      id: 'mistralai/Mistral-7B-Instruct-v0.3',
      name: 'Mistral 7B',
      description: 'Mistral 7B Instruct',
    },
    {
      id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      name: 'Mixtral 8×7B',
      description: 'Mixtral 8×7B Instruct',
    },
  ];

  /* --------------------------- EFFECTS ---------------------------------- */
  useEffect(() => {
    loadConversations();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, [messages]);

  // Auto‑grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

  /* --------------------------- HELPERS ---------------------------------- */
  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  const extractCodeBlocks = (content) => {
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'code',
        language: match[1] || 'text',
        content: match[2],
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex),
      });
    }

    return parts.length ? parts : [{ type: 'text', content }];
  };

  const copyCode = (code, idx) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(idx);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  /* -------------------------- CONVERSATIONS ----------------------------- */
  const loadConversations = async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      const data = await res.json();
      const sorted = (data.conversations || []).sort(
        (a, b) =>
          new Date(b.updatedAt).valueOf() -
          new Date(a.updatedAt).valueOf()
      );
      setConversations(sorted);
    } catch (e) {
      console.error('Failed to load conversations', e);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setTokenUsage({ inputTokens: 0, outputTokens: 0, totalTokens: 0 });
  };

  const loadConversation = async (convId) => {
    try {
      const res = await fetch(`/api/chat/conversations/${convId}`);
      const conv = await res.json();
      setMessages(conv.messages ?? []);
      setConversationId(convId);
      setShowConversations(false);
    } catch (e) {
      console.error('Failed to load conversation', e);
    }
  };

  const deleteConversation = async (convId) => {
    try {
      await fetch(`/api/chat/conversations/${convId}`, {
        method: 'DELETE',
      });
      await loadConversations();
      if (conversationId === convId) startNewConversation();
    } catch (e) {
      console.error('Failed to delete conversation', e);
    }
  };

  /* ------------------------------ SEND --------------------------------- */
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMsg = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setInputMessage('');
    setIsLoading(true);

    // placeholder "thinking" message
    const placeholder = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isThinking: true,
    };
    setMessages((prev) => [...prev, placeholder]);

    try {
      const requestBody = {
        messages: updatedMsgs,
        conversationId,
        model: selectedModel,
        settings: chatSettings,
      };

      const response = await fetch('/api/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      /* ==================== STREAMING (whitespace‑fixed) ==================== */
      if (chatSettings.stream) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let assistantMsg = {
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
          isThinking: false,
        };

        // became true after the first *real* (non‑whitespace) chunk
        let hasStarted = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;

            let data;
            try {
              data = JSON.parse(line.slice(6));
            } catch {
              continue; // ignore malformed line
            }

            if (data.type === 'content') {
              const piece = data.content;

              // First real content → strip leading whitespace
              if (!hasStarted) {
                if (/\S/.test(piece)) {
                  assistantMsg.content = piece.replace(/^\s+/, '');
                  hasStarted = true;
                }
                // pure whitespace → ignore
                continue;
              }

              // Subsequent pieces – keep as‑is
              assistantMsg.content += piece;
              setMessages((prev) => {
                const upd = [...prev];
                upd[upd.length - 1] = { ...assistantMsg };
                return upd;
              });
            } else if (data.type === 'usage') {
              setTokenUsage({
                inputTokens: data.inputTokens,
                outputTokens: data.outputTokens,
                totalTokens: data.totalTokens,
              });
              if (data.conversationId) setConversationId(data.conversationId);
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          }
        }

        // final update (ensures message exists even if last chunk had no content)
        setMessages((prev) => {
          const upd = [...prev];
          upd[upd.length - 1] = { ...assistantMsg };
          return upd;
        });
      }

      /* ==================== NON‑STREAMING (whitespace‑fixed) ==================== */
      else {
        const data = await response.json();

        const trimmed =
          typeof data.message === 'string'
            ? data.message.replace(/^\s+/, '')
            : data.message;

        setMessages((prev) => {
          const upd = [...prev];
          upd[upd.length - 1] = {
            role: 'assistant',
            content: trimmed,
            timestamp: new Date().toISOString(),
            isThinking: false,
          };
          return upd;
        });

        if (data.usage) {
          setTokenUsage({
            inputTokens: data.usage.inputTokens,
            outputTokens: data.usage.outputTokens,
            totalTokens: data.usage.totalTokens,
          });
        }
        if (data.conversationId) setConversationId(data.conversationId);
      }

      // refresh the conversation list (new or updated conversation appears)
      await loadConversations();
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I ran into an error: ${err.message}. Please try again.`,
          timestamp: new Date().toISOString(),
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------------------- INPUT HANDLER --------------------------- */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* -------------------------------------------------------------------- */
  /*                              RENDER                                   */
  /* -------------------------------------------------------------------- */
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main area */}
      <div className="sidebar-shell-main">
        {/* Header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
            <div className="flex flex-col h-full">

              {/* -------------------- TOP BAR -------------------- */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Bot size={20} className="text-indigo-600 dark:text-indigo-400" />
                    <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                      AI Chat Assistant
                    </h1>
                  </div>

                  {/* Model selector */}
                  <div className="relative">
                    <button
                      onClick={() => setShowModels(!showModels)}
                      className="flex items-center space-x-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {availableModels.find((m) => m.id === selectedModel)?.name ||
                          'DeepSeek‑R1'}
                      </span>
                      <ChevronDown size={16} className="text-slate-600 dark:text-slate-400" />
                    </button>

                    {showModels && (
                      <div className="absolute top-12 left-0 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10">
                        {availableModels.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setSelectedModel(model.id);
                              setShowModels(false);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg ${
                              selectedModel === model.id
                                ? 'bg-indigo-50 dark:bg-indigo-900/20'
                                : ''
                            }`}
                          >
                            <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                              {model.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {model.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: token usage, settings, conversations */}
                <div className="flex items-center space-x-4">
                  {/* Token counters */}
                  <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Zap size={14} />
                      <span>Input: {tokenUsage.inputTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap size={14} />
                      <span>Output: {tokenUsage.outputTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>Total: {tokenUsage.totalTokens.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Settings"
                    >
                      <Settings size={20} />
                    </button>

                    <button
                      onClick={() => setShowConversations(!showConversations)}
                      className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Recent Conversations"
                    >
                      <MessageSquare size={20} />
                    </button>

                    <button
                      onClick={startNewConversation}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      New Chat
                    </button>
                  </div>
                </div>
              </div>

              {/* -------------------- CONVERSATIONS SIDEBAR -------------------- */}
              {showConversations && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
                  <div className="absolute right-0 top-0 h-full w-96 bg-white dark:bg-slate-800 shadow-xl">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        Conversations ({conversations.length})
                      </h2>
                      <button
                        onClick={() => setShowConversations(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        ×
                      </button>
                    </div>
                    <div className="overflow-y-auto h-[calc(100vh-4rem)]">
                      {conversations.map((conv, idx) => (
                        <div
                          key={conv.conversationId}
                          className={`p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer group ${
                            conversationId === conv.conversationId
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                              : ''
                          }`}
                          onClick={() => loadConversation(conv.conversationId)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                {conv.title || `Chat #${idx + 1}`}
                                {conversationId === conv.conversationId && (
                                  <span className="ml-2 text-indigo-600 dark:text-indigo-400">
                                    (current)
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {conv.messageCount} messages •{' '}
                                {formatTime(conv.updatedAt)}
                              </div>
                              <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                ID: {conv.conversationId.slice(-8)}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conv.conversationId);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {conversations.length === 0 && (
                        <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                          No conversations yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* -------------------- SETTINGS SIDEBAR -------------------- */}
              {showSettings && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
                  <div className="absolute right-0 top-0 h-full w-96 bg-white dark:bg-slate-800 shadow-xl">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        Chat Settings
                      </h2>
                      <button
                        onClick={() => setShowSettings(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        ×
                      </button>
                    </div>

                    <div className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-4rem)]">
                      {/* Temperature */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Temperature: {chatSettings.temperature}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={chatSettings.temperature}
                          onChange={(e) =>
                            setChatSettings((prev) => ({
                              ...prev,
                              temperature: parseFloat(e.target.value),
                            }))
                          }
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>Focused (0)</span>
                          <span>Balanced (1)</span>
                          <span>Creative (2)</span>
                        </div>
                      </div>

                      {/* Max Tokens */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Max Tokens: {chatSettings.maxTokens}
                        </label>
                        <input
                          type="range"
                          min="100"
                          max="8000"
                          step="100"
                          value={chatSettings.maxTokens}
                          onChange={(e) =>
                            setChatSettings((prev) => ({
                              ...prev,
                              maxTokens: parseInt(e.target.value),
                            }))
                          }
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>Short (100)</span>
                          <span>Long (4000)</span>
                          <span>Very Long (8000)</span>
                        </div>
                      </div>

                      {/* Top P */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Top P: {chatSettings.topP}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={chatSettings.topP}
                          onChange={(e) =>
                            setChatSettings((prev) => ({
                              ...prev,
                              topP: parseFloat(e.target.value),
                            }))
                          }
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>Focused (0)</span>
                          <span>Diverse (1)</span>
                        </div>
                      </div>

                      {/* Frequency Penalty */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Frequency Penalty: {chatSettings.frequencyPenalty}
                        </label>
                        <input
                          type="range"
                          min="-2"
                          max="2"
                          step="0.1"
                          value={chatSettings.frequencyPenalty}
                          onChange={(e) =>
                            setChatSettings((prev) => ({
                              ...prev,
                              frequencyPenalty: parseFloat(e.target.value),
                            }))
                          }
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>Repeat More (-2)</span>
                          <span>No Effect (0)</span>
                          <span>Avoid Repetition (2)</span>
                        </div>
                      </div>

                      {/* Presence Penalty */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Presence Penalty: {chatSettings.presencePenalty}
                        </label>
                        <input
                          type="range"
                          min="-2"
                          max="2"
                          step="0.1"
                          value={chatSettings.presencePenalty}
                          onChange={(e) =>
                            setChatSettings((prev) => ({
                              ...prev,
                              presencePenalty: parseFloat(e.target.value),
                            }))
                          }
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>Stay on Topic (-2)</span>
                          <span>No Effect (0)</span>
                          <span>Explore Topics (2)</span>
                        </div>
                      </div>

                      {/* Stream toggle */}
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Stream Response
                        </label>
                        <button
                          onClick={() =>
                            setChatSettings((prev) => ({
                              ...prev,
                              stream: !prev.stream,
                            }))
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            chatSettings.stream
                              ? 'bg-indigo-600'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              chatSettings.stream ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Reset defaults */}
                      <div>
                        <button
                          onClick={() =>
                            setChatSettings({
                              temperature: 0.7,
                              maxTokens: 4000,
                              topP: 1.0,
                              frequencyPenalty: 0.0,
                              presencePenalty: 0.0,
                              stream: true,
                            })
                          }
                          className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors text-sm font-medium"
                        >
                          Reset to Defaults
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* -------------------- MAIN CHAT AREA -------------------- */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Messages list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <Bot size={48} className="text-indigo-600 dark:text-indigo-400 mb-4" />
                      <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                        Welcome to AI Chat Assistant
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400 max-w-md">
                        Type a question or a prompt below and the assistant will answer. Your conversation is saved automatically.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`flex max-w-3xl ${
                            msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                          } space-x-3`}
                        >
                          {/* Avatar */}
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              msg.role === 'user'
                                ? 'bg-indigo-600 text-white'
                                : msg.error
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                          </div>

                          {/* Bubble */}
                          <div
                            className={`px-4 py-3 rounded-2xl break-words ${
                              msg.role === 'user'
                                ? 'bg-indigo-600 text-white'
                                : msg.error
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="relative">
                              {/* Thinking placeholder */}
                              {msg.isThinking ? (
                                <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                                  <div className="animate-spin"><Bot size={16} /></div>
                                  <div>Thinking…</div>
                                </div>
                              ) : (
                                <>
                                  {/* Empty content → spinner */}
                                  {msg.content === '' ? (
                                    <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                                      <div className="animate-spin"><Bot size={16} /></div>
                                      <div>Generating response…</div>
                                    </div>
                                  ) : (
                                    /* Real content (including code blocks) */
                                    extractCodeBlocks(msg.content).map((part, partIdx) => {
                                      if (part.type === 'code') {
                                        return (
                                          <div
                                            key={partIdx}
                                            className="relative mt-4 mb-4 rounded-lg overflow-hidden"
                                          >
                                            <button
                                              onClick={() =>
                                                copyCode(part.content, `${idx}-${partIdx}`)
                                              }
                                              className="absolute right-2 top-2 p-1.5 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded text-xs backdrop-blur-sm transition-colors"
                                              title="Copy code"
                                            >
                                              {copiedCode === `${idx}-${partIdx}` ? (
                                                <Check size={14} />
                                              ) : (
                                                <Copy size={14} />
                                              )}
                                            </button>
                                            <SyntaxHighlighter
                                              language={part.language}
                                              style={oneDark}
                                              customStyle={{
                                                margin: 0,
                                                borderRadius: '0.5rem',
                                                fontSize: '0.875rem',
                                                background: '#1f2937',
                                              }}
                                            >
                                              {part.content}
                                            </SyntaxHighlighter>
                                          </div>
                                        );
                                      }

                                      // plain text
                                      return (
                                        <div
                                          key={partIdx}
                                          className="w-full text-sm leading-relaxed break-words whitespace-pre-line"
                                          dangerouslySetInnerHTML={{
                                            __html: part.content.replace(/\n/g, '<br/>'),
                                          }}
                                        />
                                      );
                                    })
                                  )}
                                </>
                              )}
                            </div>

                            {/* Timestamp & “generating” indicator */}
                            <div className="flex items-center justify-end space-x-2 mt-2">
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {formatTime(msg.timestamp)}
                              </span>
                              {msg.role === 'assistant' &&
                                isLoading &&
                                idx === messages.length - 1 &&
                                !msg.isThinking && (
                                  <div className="animate-pulse text-xs text-indigo-600 dark:text-indigo-400">
                                    Generating…
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="border-t border-slate-200 dark:border-slate-700 p-4">
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
                      className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
                      rows={1}
                      disabled={isLoading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      className="absolute right-2 bottom-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center space-x-2"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
              {/* End of main chat area */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
