import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowRight, Hash, FileText, Settings, User, Zap } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';

const CommandPalette = ({ isOpen, onClose, commands = [] }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Default commands
  const defaultCommands = [
    { id: 'search', title: 'Search', description: 'Search across all content', icon: Search, shortcut: '⌘K' },
    { id: 'settings', title: 'Settings', description: 'Open application settings', icon: Settings, shortcut: '⌘,' },
    { id: 'profile', title: 'Profile', description: 'View your profile', icon: User, shortcut: '⌘P' },
    { id: 'shortcuts', title: 'Keyboard Shortcuts', description: 'View all shortcuts', icon: Command, shortcut: '⌘?' },
    { id: 'ai-chat', title: 'AI Chat', description: 'Open AI chat assistant', icon: Zap, shortcut: '⌘J' },
    { id: 'new-document', title: 'New Document', description: 'Create a new document', icon: FileText, shortcut: '⌘N' },
  ];

  const allCommands = [...defaultCommands, ...commands];

  // Filter commands based on query
  const filteredCommands = allCommands.filter(command =>
    command.title.toLowerCase().includes(query.toLowerCase()) ||
    command.description.toLowerCase().includes(query.toLowerCase())
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            handleCommandSelect(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleCommandSelect = (command) => {
    if (command.action) {
      command.action();
    }
    onClose();
  };

  // Register global hotkey
  useHotkeys('cmd+k, ctrl+k', (e) => {
    e.preventDefault();
    if (isOpen) {
      onClose();
    } else {
      // This would be handled by parent component
    }
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none text-lg"
            />
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto" ref={resultsRef}>
            {filteredCommands.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No commands found</p>
              </div>
            ) : (
              <div className="py-2">
                {filteredCommands.map((command, index) => {
                  const Icon = command.icon || Hash;
                  const isSelected = index === selectedIndex;
                  
                  return (
                    <motion.button
                      key={command.id}
                      className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => handleCommandSelect(command)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                        isSelected 
                          ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {command.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {command.description}
                        </div>
                      </div>
                      {command.shortcut && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                          {command.shortcut}
                        </div>
                      )}
                      <ArrowRight className="w-4 h-4 text-gray-400 ml-2" />
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">↑↓</kbd>
                  <span className="ml-1">navigate</span>
                </span>
                <span className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">↵</kbd>
                  <span className="ml-1">select</span>
                </span>
                <span className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">esc</kbd>
                  <span className="ml-1">close</span>
                </span>
              </div>
              <div className="text-gray-400">
                {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CommandPalette;
