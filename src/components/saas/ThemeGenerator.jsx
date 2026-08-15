import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Download, 
  Upload, 
  RotateCcw, 
  Eye, 
  Copy, 
  Check,
  Sparkles,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';

const ColorPicker = ({ 
  label, 
  value, 
  onChange, 
  className = '' 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="flex items-center space-x-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  );
};

const ThemePreview = ({ theme, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Theme Preview</h3>
      
      {/* Header */}
      <div 
        className="h-16 rounded-lg mb-4 flex items-center px-4"
        style={{ backgroundColor: theme.primary }}
      >
        <div className="w-8 h-8 rounded-lg bg-white/20 mr-3"></div>
        <div className="text-white font-semibold">App Header</div>
      </div>

      {/* Content Cards */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div 
          className="h-20 rounded-lg p-4 flex flex-col justify-center"
          style={{ backgroundColor: theme.secondary }}
        >
          <div className="text-white text-sm font-medium">Card 1</div>
          <div className="text-white/80 text-xs">Secondary color</div>
        </div>
        <div 
          className="h-20 rounded-lg p-4 flex flex-col justify-center"
          style={{ backgroundColor: theme.accent }}
        >
          <div className="text-white text-sm font-medium">Card 2</div>
          <div className="text-white/80 text-xs">Accent color</div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex space-x-3">
        <button 
          className="px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: theme.primary }}
        >
          Primary Button
        </button>
        <button 
          className="px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: theme.secondary }}
        >
          Secondary Button
        </button>
      </div>
    </div>
  );
};

const ThemeGenerator = ({ 
  onThemeChange,
  initialTheme = null,
  className = '',
  ...props 
}) => {
  const [theme, setTheme] = useState({
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  });

  const [copied, setCopied] = useState(false);
  const [themeMode, setThemeMode] = useState('light');

  // Predefined theme presets
  const presets = {
    default: {
      name: 'Default',
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
    },
    dark: {
      name: 'Dark',
      primary: '#6366F1',
      secondary: '#10B981',
      accent: '#F59E0B',
      background: '#0F172A',
      surface: '#1E293B',
      text: '#F1F5F9',
      textSecondary: '#94A3B8',
      border: '#334155',
    },
    purple: {
      name: 'Purple',
      primary: '#8B5CF6',
      secondary: '#EC4899',
      accent: '#F59E0B',
      background: '#FFFFFF',
      surface: '#FAF5FF',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
    },
    green: {
      name: 'Green',
      primary: '#059669',
      secondary: '#0D9488',
      accent: '#F59E0B',
      background: '#FFFFFF',
      surface: '#F0FDF4',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
    },
    orange: {
      name: 'Orange',
      primary: '#EA580C',
      secondary: '#DC2626',
      accent: '#F59E0B',
      background: '#FFFFFF',
      surface: '#FFF7ED',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
    },
  };

  useEffect(() => {
    if (initialTheme) {
      setTheme(initialTheme);
    }
  }, [initialTheme]);

  useEffect(() => {
    onThemeChange?.(theme);
  }, [theme, onThemeChange]);

  const handleColorChange = (colorKey, value) => {
    setTheme(prev => ({
      ...prev,
      [colorKey]: value
    }));
  };

  const applyPreset = (preset) => {
    setTheme(prev => ({
      ...prev,
      ...preset
    }));
  };

  const resetTheme = () => {
    setTheme(presets.default);
  };

  const exportTheme = () => {
    const themeConfig = {
      name: 'Custom Theme',
      colors: theme,
      mode: themeMode,
      createdAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(themeConfig, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importTheme = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTheme = JSON.parse(e.target.result);
        if (importedTheme.colors) {
          setTheme(importedTheme.colors);
        }
      } catch (error) {
        console.error('Error importing theme:', error);
      }
    };
    reader.readAsText(file);
  };

  const copyThemeCode = async () => {
    const themeCode = `const theme = {
  primary: '${theme.primary}',
  secondary: '${theme.secondary}',
  accent: '${theme.accent}',
  background: '${theme.background}',
  surface: '${theme.surface}',
  text: '${theme.text}',
  textSecondary: '${theme.textSecondary}',
  border: '${theme.border}',
  success: '${theme.success}',
  warning: '${theme.warning}',
  error: '${theme.error}',
  info: '${theme.info}',
};`;

    try {
      await navigator.clipboard.writeText(themeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy theme code:', err);
    }
  };

  return (
    <div className={`space-y-6 ${className}`} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Theme Generator</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Create and customize your app's theme</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={resetTheme}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Theme Controls */}
        <div className="space-y-6">
          {/* Presets */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Presets</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(presets).map(([key, preset]) => (
                <motion.button
                  key={key}
                  onClick={() => applyPreset(preset)}
                  className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-left"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.secondary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.accent }}
                    />
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {preset.name}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Color Controls */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Colors</h3>
            <div className="space-y-4">
              <ColorPicker
                label="Primary"
                value={theme.primary}
                onChange={(value) => handleColorChange('primary', value)}
              />
              <ColorPicker
                label="Secondary"
                value={theme.secondary}
                onChange={(value) => handleColorChange('secondary', value)}
              />
              <ColorPicker
                label="Accent"
                value={theme.accent}
                onChange={(value) => handleColorChange('accent', value)}
              />
              <ColorPicker
                label="Background"
                value={theme.background}
                onChange={(value) => handleColorChange('background', value)}
              />
              <ColorPicker
                label="Surface"
                value={theme.surface}
                onChange={(value) => handleColorChange('surface', value)}
              />
              <ColorPicker
                label="Text"
                value={theme.text}
                onChange={(value) => handleColorChange('text', value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <motion.button
              onClick={copyThemeCode}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </motion.button>

            <motion.button
              onClick={exportTheme}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </motion.button>

            <label className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Import</span>
              <input
                type="file"
                accept=".json"
                onChange={importTheme}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Theme Preview */}
        <div>
          <ThemePreview theme={theme} />
        </div>
      </div>
    </div>
  );
};

export default ThemeGenerator;
