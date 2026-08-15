import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Eye, Edit3, Save, Share2, MessageCircle } from 'lucide-react';

const Cursor = ({ user, position, isActive = false }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  return (
    <motion.div
      className={`absolute pointer-events-none z-10 ${!isVisible ? 'opacity-0' : 'opacity-100'}`}
      style={{
        left: position.x,
        top: position.y,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      <div className="flex items-center space-x-1">
        <div 
          className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: user.color }}
        />
        <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg">
          {user.name}
        </div>
      </div>
    </motion.div>
  );
};

const UserAvatar = ({ user, isActive = false, className = '' }) => {
  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <div
        className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-semibold"
        style={{ backgroundColor: user.color }}
      >
        {user.name.charAt(0).toUpperCase()}
      </div>
      {isActive && (
        <motion.div
          className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};

const CollaborativeEditor = ({ 
  documentId,
  initialContent = '',
  onContentChange,
  onSave,
  className = '',
  ...props 
}) => {
  const [content, setContent] = useState(initialContent);
  const [collaborators, setCollaborators] = useState([]);
  const [currentUser] = useState({
    id: 'user-1',
    name: 'You',
    color: '#3B82F6',
    isActive: true,
  });
  const [cursors, setCursors] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [lastSaved, setLastSaved] = useState(new Date());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const editorRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Simulate real-time collaboration
  useEffect(() => {
    const mockCollaborators = [
      { id: 'user-2', name: 'Alice', color: '#10B981', isActive: true },
      { id: 'user-3', name: 'Bob', color: '#F59E0B', isActive: false },
      { id: 'user-4', name: 'Carol', color: '#EF4444', isActive: true },
    ];
    
    setCollaborators(mockCollaborators);

    // Simulate cursor movements
    const interval = setInterval(() => {
      setCursors(prev => 
        mockCollaborators
          .filter(user => user.isActive)
          .map(user => ({
            user,
            position: {
              x: Math.random() * 300 + 50,
              y: Math.random() * 200 + 50,
            },
            isActive: Math.random() > 0.7,
          }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, 2000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, hasUnsavedChanges]);

  const handleContentChange = useCallback((newContent) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
    onContentChange?.(newContent);
  }, [onContentChange]);

  const handleSave = useCallback(() => {
    onSave?.(content);
    setLastSaved(new Date());
    setHasUnsavedChanges(false);
  }, [content, onSave]);

  const handleKeyDown = (e) => {
    if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  const formatLastSaved = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Collaborative Document
            </h2>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Collaborators */}
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <div className="flex -space-x-2">
              <UserAvatar user={currentUser} isActive={true} />
              {collaborators.map((user) => (
                <UserAvatar key={user.id} user={user} isActive={user.isActive} />
              ))}
            </div>
          </div>

          {/* Save Status */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            {hasUnsavedChanges ? (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span>Unsaved changes</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Saved {formatLastSaved(lastSaved)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={handleSave}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </motion.button>

            <motion.button
              className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative overflow-hidden">
        <div className="h-full p-6">
          <textarea
            ref={editorRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Start typing to collaborate in real-time..."
            className="w-full h-full resize-none border-0 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-lg leading-relaxed"
            style={{ minHeight: '400px' }}
          />
        </div>

        {/* Collaborative Cursors */}
        <div className="absolute inset-0 pointer-events-none">
          <AnimatePresence>
            {cursors.map((cursor, index) => (
              <Cursor
                key={cursor.user.id}
                user={cursor.user}
                position={cursor.position}
                isActive={cursor.isActive}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <span>{content.length} characters</span>
          <span>{content.split('\n').length} lines</span>
          <span>{content.split(' ').filter(word => word.length > 0).length} words</span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-4 h-4" />
            <span>Comments: 0</span>
          </div>
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>Viewers: {collaborators.filter(c => c.isActive).length + 1}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborativeEditor;
