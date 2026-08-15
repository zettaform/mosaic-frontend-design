import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Copy, Check, MoreVertical, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';

const MessageBubble = ({ message, isUser, timestamp, onCopy, onRegenerate, onFeedback }) => {
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      onCopy?.(message);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleFeedback = (type) => {
    onFeedback?.(type);
  };

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`flex max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
        {/* Avatar */}
        <motion.div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-blue-600 text-white' 
              : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
        </motion.div>

        {/* Message Content */}
        <div
          className={`relative group ${
            isUser 
              ? 'bg-blue-600 text-white' 
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
          } rounded-2xl px-4 py-3 shadow-sm`}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap">{message}</div>
          </div>

          {/* Timestamp */}
          <div className={`text-xs mt-2 ${
            isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {timestamp}
          </div>

          {/* Actions */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`absolute top-2 ${
                  isUser ? 'left-2' : 'right-2'
                } flex items-center space-x-1`}
              >
                <motion.button
                  onClick={handleCopy}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isUser 
                      ? 'hover:bg-blue-700 text-blue-100' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </motion.button>

                {!isUser && (
                  <>
                    <motion.button
                      onClick={() => handleFeedback('positive')}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </motion.button>
                    <motion.button
                      onClick={() => handleFeedback('negative')}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </motion.button>
                    <motion.button
                      onClick={onRegenerate}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </motion.button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

const TypingIndicator = () => (
  <motion.div
    className="flex items-center space-x-2 text-gray-500 dark:text-gray-400"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <Bot className="w-4 h-4" />
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-gray-400 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
    <span className="text-sm">AI is thinking...</span>
  </motion.div>
);

const ChatInterface = ({ 
  messages = [],
  onSendMessage,
  onRegenerateMessage,
  onFeedback,
  isLoading = false,
  placeholder = 'Type your message...',
  className = '',
  ...props 
}) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: input.trim(),
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onSendMessage?.(userMessage);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text) => {
    console.log('Copied:', text);
  };

  const handleFeedback = (messageId, type) => {
    onFeedback?.(messageId, type);
  };

  const handleRegenerate = (messageId) => {
    onRegenerateMessage?.(messageId);
  };

  return (
    <div className={`flex flex-col h-full bg-gray-50 dark:bg-gray-900 ${className}`} {...props}>
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message.text}
              isUser={message.isUser}
              timestamp={message.timestamp}
              onCopy={handleCopy}
              onRegenerate={() => handleRegenerate(message.id)}
              onFeedback={(type) => handleFeedback(message.id, type)}
            />
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <TypingIndicator />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isLoading}
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[44px] max-h-32"
              rows={1}
              style={{
                height: 'auto',
                minHeight: '44px',
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
          </div>
          
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors duration-200 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Input Footer */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Powered by AI</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
