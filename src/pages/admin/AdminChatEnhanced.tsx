import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
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
  Sun,
  Moon,
  Monitor,
  RotateCcw,
  StopCircle,
  Sparkles,
  Brain,
} from 'lucide-react'

// @ts-ignore - JSX files don't have type definitions
import Sidebar from '../../partials/Sidebar'
// @ts-ignore - JSX files don't have type definitions
import Header from '../../partials/Header'
import { useTheme } from '../../contexts/ThemeContext'
import { useToast } from '../../contexts/ToastContext'
import { useChat } from '../../hooks/useChat'
import { useConversations } from '../../hooks/useConversations'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Skeleton from '../../components/ui/Skeleton'
import { Message, AIModel, ChatSettings } from '../../types/chat'

// Available AI Models
const availableModels: AIModel[] = [
  {
    id: 'deepseek-ai/DeepSeek-V3.1',
    name: 'DeepSeek‑V3.1',
    description: 'Latest DeepSeek V3.1 general model',
    provider: 'DeepSeek',
    category: 'reasoning',
    contextWindow: 128000,
    precision: '16-bit',
    status: 'active',
  },
  {
    id: 'meta-llama/Meta-Llama-3-8B-Instruct',
    name: 'Llama 3 8B',
    description: 'Meta Llama 3 8B Instruct - Fast and efficient',
    provider: 'Meta',
    category: 'text-generation',
    contextWindow: 128000,
    precision: '16-bit',
    status: 'active',
  },
  {
    id: 'meta-llama/Meta-Llama-3-70B-Instruct',
    name: 'Llama 3 70B',
    description: 'Meta Llama 3 70B Instruct - High performance',
    provider: 'Meta',
    category: 'text-generation',
    contextWindow: 128000,
    precision: '16-bit',
    status: 'active',
  },
  {
    id: 'mistralai/Mistral-7B-Instruct-v0.3',
    name: 'Mistral 7B',
    description: 'Mistral 7B Instruct - Balanced performance',
    provider: 'Mistral',
    category: 'text-generation',
    contextWindow: 32000,
    precision: '16-bit',
    status: 'active',
  },
  {
    id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    name: 'Mixtral 8×7B',
    description: 'Mixtral 8×7B Instruct - Mixture of experts',
    provider: 'Mistral',
    category: 'text-generation',
    contextWindow: 32000,
    precision: '16-bit',
    status: 'active',
  },
]

// Message Component
const MessageBubble: React.FC<{
  message: Message
  index: number
  isLast: boolean
  isLoading: boolean
  onCopyCode: (code: string, id: string) => void
  copiedCodeId: string | null
}> = React.memo(({ message, index, isLast, isLoading, onCopyCode, copiedCodeId }) => {
  const extractCodeBlocks = (content: string) => {
    const regex = /```(\w+)?\n([\s\S]*?)```/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index),
        })
      }
      parts.push({
        type: 'code',
        language: match[1] || 'text',
        content: match[2],
      })
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex),
      })
    }

    return parts.length ? parts : [{ type: 'text', content }]
  }

  const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })

  const isUser = message.role === 'user'
  const isError = message.error
  const isThinking = message.isThinking

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`flex max-w-4xl ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        } space-x-3`}
      >
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isUser
              ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg'
              : isError
              ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg'
              : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-slate-300 shadow-lg'
          }`}
        >
          {isUser ? <User size={20} /> : <Bot size={20} />}
        </motion.div>

        {/* Message Content */}
        <div
          className={`px-4 py-3 rounded-2xl break-words shadow-sm ${
            isUser
              ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white'
              : isError
              ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <div className="relative">
            {isThinking ? (
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Bot size={16} />
                </motion.div>
                <span>Thinking...</span>
              </div>
            ) : message.content === '' ? (
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Bot size={16} />
                </motion.div>
                <span>Generating response...</span>
              </div>
            ) : (
              extractCodeBlocks(message.content).map((part, partIdx) => {
                if (part.type === 'code') {
                  return (
                    <div
                      key={partIdx}
                      className="relative mt-4 mb-4 rounded-lg overflow-hidden"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCopyCode(part.content, `${index}-${partIdx}`)}
                        className="absolute right-2 top-2 z-10 bg-slate-800/50 hover:bg-slate-700/50 text-white backdrop-blur-sm"
                      >
                        {copiedCodeId === `${index}-${partIdx}` ? (
                          <Check size={14} />
                        ) : (
                          <Copy size={14} />
                        )}
                      </Button>
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
                  )
                }

                return (
                  <div
                    key={partIdx}
                    className="w-full text-sm leading-relaxed break-words whitespace-pre-line"
                    dangerouslySetInnerHTML={{
                      __html: part.content.replace(/\n/g, '<br/>'),
                    }}
                  />
                )
              })
            )}
          </div>

          {/* Timestamp and Status */}
          <div className="flex items-center justify-end space-x-2 mt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formatTime(message.timestamp)}
            </span>
            {!isUser && isLoading && isLast && !isThinking && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xs text-indigo-600 dark:text-indigo-400"
              >
                Generating...
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
})

// Settings Panel Component
const SettingsPanel: React.FC<{
  isOpen: boolean
  onClose: () => void
  settings: ChatSettings
  onSettingsChange: (settings: Partial<ChatSettings>) => void
}> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const resetToDefaults = () => {
    onSettingsChange({
      temperature: 0.7,
      maxTokens: 4000,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      stream: true,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chat Settings" size="md">
      <div className="space-y-6">
        {/* Temperature */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Temperature: {settings.temperature}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={settings.temperature}
            onChange={(e) =>
              onSettingsChange({ temperature: parseFloat(e.target.value) })
            }
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
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
            Max Tokens: {settings.maxTokens}
          </label>
          <input
            type="range"
            min="100"
            max="8000"
            step="100"
            value={settings.maxTokens}
            onChange={(e) =>
              onSettingsChange({ maxTokens: parseInt(e.target.value) })
            }
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
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
            Top P: {settings.topP}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.topP}
            onChange={(e) =>
              onSettingsChange({ topP: parseFloat(e.target.value) })
            }
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>Focused (0)</span>
            <span>Diverse (1)</span>
          </div>
        </div>

        {/* Frequency Penalty */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Frequency Penalty: {settings.frequencyPenalty}
          </label>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={settings.frequencyPenalty}
            onChange={(e) =>
              onSettingsChange({ frequencyPenalty: parseFloat(e.target.value) })
            }
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
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
            Presence Penalty: {settings.presencePenalty}
          </label>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={settings.presencePenalty}
            onChange={(e) =>
              onSettingsChange({ presencePenalty: parseFloat(e.target.value) })
            }
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>Stay on Topic (-2)</span>
            <span>No Effect (0)</span>
            <span>Explore Topics (2)</span>
          </div>
        </div>

        {/* Stream Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Stream Response
          </label>
          <button
            onClick={() => onSettingsChange({ stream: !settings.stream })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.stream
                ? 'bg-indigo-600'
                : 'bg-slate-200 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.stream ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          onClick={resetToDefaults}
          className="w-full"
        >
          <RotateCcw size={16} className="mr-2" />
          Reset to Defaults
        </Button>
      </div>
    </Modal>
  )
}

// Main Component
const AdminChatEnhanced: React.FC = () => {
  const { theme, setTheme } = useTheme()
  const toast = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [selectedModel, setSelectedModel] = useState(availableModels[0].id)
  const [showModels, setShowModels] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showConversations, setShowConversations] = useState(false)
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    messages,
    isLoading,
    tokenUsage,
    settings,
    updateSettings,
    sendMessage,
    clearMessages,
    stopGeneration,
  } = useChat({
    onError: (error) => {
      console.error('Chat error:', error)
    },
  })

  const {
    conversations,
    isLoading: conversationsLoading,
    loadConversation,
    deleteConversation,
  } = useConversations()

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [inputMessage])

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return

    const message = inputMessage.trim()
    setInputMessage('')
    
    await sendMessage(message, selectedModel)
  }, [inputMessage, isLoading, selectedModel, sendMessage])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCodeId(id)
    setTimeout(() => setCopiedCodeId(null), 2000)
    toast.success('Code copied to clipboard')
  }, [toast])

  const selectedModelData = useMemo(
    () => availableModels.find((m) => m.id === selectedModel),
    [selectedModel]
  )

  const themeIcon = useMemo(() => {
    switch (theme) {
      case 'light':
        return <Sun size={20} />
      case 'dark':
        return <Moon size={20} />
      case 'system':
        return <Monitor size={20} />
      default:
        return <Sun size={20} />
    }
  }, [theme])

  const cycleTheme = useCallback(() => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }, [theme, setTheme])

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar-container ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-[#182235]">
        {/* Header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Top Bar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0"
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Bot size={24} className="text-indigo-600 dark:text-indigo-400" />
                </motion.div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  AI Chat Assistant
                </h1>
              </div>

              {/* Model Selector */}
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowModels(!showModels)}
                  rightIcon={<ChevronDown size={16} />}
                >
                  {selectedModelData?.name || 'Select Model'}
                </Button>

                <AnimatePresence>
                  {showModels && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-12 left-0 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-10"
                    >
                      {availableModels.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id)
                            setShowModels(false)
                          }}
                          className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                            selectedModel === model.id
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500'
                              : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                {model.name}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {model.description}
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  {model.provider}
                                </span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  •
                                </span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  {model.contextWindow?.toLocaleString()} tokens
                                </span>
                              </div>
                            </div>
                            {selectedModel === model.id && (
                              <Check size={16} className="text-indigo-600 dark:text-indigo-400" />
                            )}
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-4">
              {/* Token Usage */}
              <div className="hidden md:flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
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

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cycleTheme}
                  title={`Current theme: ${theme}`}
                >
                  {themeIcon}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  title="Settings"
                >
                  <Settings size={20} />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConversations(true)}
                  title="Conversations"
                >
                  <MessageSquare size={20} />
                </Button>

                {isLoading && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={stopGeneration}
                    title="Stop Generation"
                  >
                    <StopCircle size={20} />
                  </Button>
                )}

                <Button
                  variant="primary"
                  onClick={clearMessages}
                  disabled={messages.length === 0}
                >
                  <Sparkles size={16} className="mr-2" />
                  New Chat
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center p-8"
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Bot size={64} className="text-indigo-600 dark:text-indigo-400 mb-6" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                    Welcome to AI Chat Assistant
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6">
                    Start a conversation with our advanced AI models. Your conversations are automatically saved and you can switch between different models anytime.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {availableModels.slice(0, 3).map((model) => (
                      <Button
                        key={model.id}
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedModel(model.id)}
                        className={selectedModel === model.id ? 'ring-2 ring-indigo-500' : ''}
                      >
                        <Brain size={16} className="mr-2" />
                        {model.name}
                      </Button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <MessageBubble
                      key={message.id || index}
                      message={message}
                      index={index}
                      isLast={index === messages.length - 1}
                      isLoading={isLoading}
                      onCopyCode={copyCode}
                      copiedCodeId={copiedCodeId}
                    />
                  ))}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800"
            >
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                  className="w-full px-4 py-3 pr-16 border border-slate-300 dark:border-slate-600 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-200"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="absolute right-2 bottom-2"
                  size="sm"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Bot size={16} />
                    </motion.div>
                  ) : (
                    <Send size={16} />
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={updateSettings}
      />

      {/* Conversations Modal */}
      <Modal
        isOpen={showConversations}
        onClose={() => setShowConversations(false)}
        title="Recent Conversations"
        size="lg"
      >
        <div className="space-y-4">
          {conversationsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} lines={2} height="4rem" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.conversationId}
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer group"
                onClick={() => {
                  loadConversation(conv.conversationId)
                  setShowConversations(false)
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-800 dark:text-slate-200">
                      {conv.title || `Chat #${conv.conversationId.slice(-8)}`}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {conv.messageCount} messages • {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      deleteConversation(conv.conversationId)
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}

export default AdminChatEnhanced
