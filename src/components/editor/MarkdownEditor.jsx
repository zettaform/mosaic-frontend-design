import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Link, 
  Image, 
  Eye, 
  EyeOff,
  Save,
  Download,
  Upload,
  Undo,
  Redo
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

const ToolbarButton = ({ icon: Icon, onClick, isActive = false, disabled = false, title }) => (
  <motion.button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg transition-colors duration-200 ${
      isActive 
        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <Icon className="w-4 h-4" />
  </motion.button>
);

const MarkdownEditor = ({ 
  value = '',
  onChange,
  onSave,
  placeholder = 'Start writing your markdown...',
  className = '',
  showPreview = true,
  autoSave = false,
  ...props 
}) => {
  const [content, setContent] = useState(value);
  const [isPreviewMode, setIsPreviewMode] = useState(showPreview);
  const [history, setHistory] = useState([value]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Update content when value prop changes
  useEffect(() => {
    setContent(value);
  }, [value]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && content !== value) {
      const timer = setTimeout(() => {
        setIsAutoSaving(true);
        onSave?.(content);
        setTimeout(() => setIsAutoSaving(false), 1000);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [content, autoSave, onSave, value]);

  const handleContentChange = (newContent) => {
    setContent(newContent);
    onChange?.(newContent);
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newContent);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const insertText = (before, after = '', placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = before + (selectedText || placeholder) + after;
    
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    handleContentChange(newContent);

    // Set cursor position
    setTimeout(() => {
      const newCursorPos = start + before.length + (selectedText || placeholder).length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const formatText = (format) => {
    const formats = {
      bold: ['**', '**', 'bold text'],
      italic: ['*', '*', 'italic text'],
      code: ['`', '`', 'code'],
      quote: ['> ', '', 'quote'],
      link: ['[', '](url)', 'link text'],
      image: ['![', '](url)', 'alt text'],
    };

    const [before, after, placeholder] = formats[format] || ['', '', ''];
    insertText(before, after, placeholder);
  };

  const insertList = (ordered = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lines = content.substring(0, start).split('\n');
    const currentLine = lines[lines.length - 1];
    const indent = currentLine.match(/^(\s*)/)[1];
    const marker = ordered ? '1. ' : '- ';
    
    const newContent = content.substring(0, start) + indent + marker + content.substring(start);
    handleContentChange(newContent);

    setTimeout(() => {
      const newCursorPos = start + indent.length + marker.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const newContent = history[newIndex];
      setContent(newContent);
      onChange?.(newContent);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const newContent = history[newIndex];
      setContent(newContent);
      onChange?.(newContent);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      handleContentChange(event.target.result);
    };
    reader.readAsText(file);
  };

  const downloadMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    onSave?.(content);
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`} {...props}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-1">
          <ToolbarButton
            icon={Undo}
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Undo"
          />
          <ToolbarButton
            icon={Redo}
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Redo"
          />
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
          
          <ToolbarButton
            icon={Bold}
            onClick={() => formatText('bold')}
            title="Bold"
          />
          <ToolbarButton
            icon={Italic}
            onClick={() => formatText('italic')}
            title="Italic"
          />
          <ToolbarButton
            icon={Code}
            onClick={() => formatText('code')}
            title="Code"
          />
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
          
          <ToolbarButton
            icon={List}
            onClick={() => insertList(false)}
            title="Bullet List"
          />
          <ToolbarButton
            icon={ListOrdered}
            onClick={() => insertList(true)}
            title="Numbered List"
          />
          <ToolbarButton
            icon={Quote}
            onClick={() => formatText('quote')}
            title="Quote"
          />
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
          
          <ToolbarButton
            icon={Link}
            onClick={() => formatText('link')}
            title="Link"
          />
          <ToolbarButton
            icon={Image}
            onClick={() => formatText('image')}
            title="Image"
          />
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-sm">{isPreviewMode ? 'Hide Preview' : 'Show Preview'}</span>
          </motion.button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

          <ToolbarButton
            icon={Upload}
            onClick={() => fileInputRef.current?.click()}
            title="Upload File"
          />
          <ToolbarButton
            icon={Download}
            onClick={downloadMarkdown}
            title="Download"
          />
          <ToolbarButton
            icon={Save}
            onClick={handleSave}
            title="Save"
          />
        </div>
      </div>

      {/* Editor and Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className={`${isPreviewMode ? 'w-1/2' : 'w-full'} flex flex-col`}>
          <div className="flex-1 p-4">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder={placeholder}
              className="w-full h-full resize-none border-0 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-mono text-sm leading-relaxed"
              style={{ minHeight: '400px' }}
            />
          </div>
        </div>

        {/* Preview */}
        <AnimatePresence>
          {isPreviewMode && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '50%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="border-l border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="h-full overflow-y-auto p-4">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {content || '*Start writing to see preview...*'}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <span>{content.length} characters</span>
          <span>{content.split('\n').length} lines</span>
          <span>{content.split(' ').filter(word => word.length > 0).length} words</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {isAutoSaving && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-1"
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>Auto-saving...</span>
            </motion.div>
          )}
          <span>Markdown</span>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default MarkdownEditor;
