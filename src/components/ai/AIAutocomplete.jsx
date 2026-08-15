import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Clock, Check } from 'lucide-react';

const AIAutocomplete = ({ 
  placeholder = 'Ask AI anything...',
  suggestions = [],
  onSelect,
  onSearch,
  className = '',
  disabled = false,
  ...props 
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Filter suggestions based on query
  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.text.toLowerCase().includes(query.toLowerCase()) ||
    suggestion.description?.toLowerCase().includes(query.toLowerCase())
  );

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0);
    setSelectedIndex(-1);
    
    if (onSearch) {
      onSearch(value);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    setQuery(suggestion.text);
    setIsOpen(false);
    setSelectedIndex(-1);
    
    if (onSelect) {
      onSelect(suggestion);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
          handleSuggestionSelect(filteredSuggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  return (
    <div className={`relative w-full ${className}`} {...props}>
      {/* Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-5 w-5 text-blue-500" />
            </motion.div>
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        />
        
        {query && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              setSelectedIndex(-1);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="text-lg">×</span>
          </motion.button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && filteredSuggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion.id || index}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
                  index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                } ${index === 0 ? 'rounded-t-xl' : ''} ${
                  index === filteredSuggestions.length - 1 ? 'rounded-b-xl' : ''
                }`}
                onClick={() => handleSuggestionSelect(suggestion)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    suggestion.type === 'ai' 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                      : suggestion.type === 'recent'
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      : 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                  }`}>
                    {suggestion.type === 'ai' ? (
                      <Sparkles className="w-4 h-4" />
                    ) : suggestion.type === 'recent' ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {suggestion.text}
                    </div>
                    {suggestion.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {suggestion.description}
                      </div>
                    )}
                    {suggestion.tags && suggestion.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {suggestion.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {suggestion.shortcut && (
                    <div className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 font-mono">
                      {suggestion.shortcut}
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results */}
      <AnimatePresence>
        {isOpen && query.length > 0 && filteredSuggestions.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No suggestions found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIAutocomplete;
