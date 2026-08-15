import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const TextSizeAdjuster = () => {
  const { user } = useAuth();
  
  const getSessionToken = () => {
    try {
      return (localStorage.getItem('sessionToken') || localStorage.getItem('token') || '').trim();
    } catch {
      return '';
    }
  };

  const sessionToken = getSessionToken();

  const [isOpen, setIsOpen] = useState(false);
  const [textSize, setTextSize] = useState(() => {
    const saved = localStorage.getItem('textSize');
    return saved ? parseInt(saved) : 16; // Default 16px
  });
  const [fontWeight, setFontWeight] = useState(() => {
    const saved = localStorage.getItem('fontWeight');
    return saved ? parseInt(saved) : 400; // Default normal weight
  });

  // Function to completely remove all text size styles
  const removeAllTextStyles = () => {
    // Remove existing styles
    const existingStyle = document.getElementById('text-size-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Remove reset style if it exists
    const resetStyle = document.getElementById('text-size-reset');
    if (resetStyle) {
      resetStyle.remove();
    }

    // Reset CSS variables
    const root = document.documentElement;
    root.style.removeProperty('--base-font-size');
    root.style.removeProperty('--base-font-weight');
  };

  // Apply text size and weight to the document only when user is authenticated
  useEffect(() => {
    if (!user) {
      // Remove all styles when user is not authenticated
      removeAllTextStyles();
      return;
    }

    const root = document.documentElement;
    root.style.setProperty('--base-font-size', `${textSize}px`);
    root.style.setProperty('--base-font-weight', fontWeight.toString());

    // Apply to all text elements
    const style = document.getElementById('text-size-style') || document.createElement('style');
    style.id = 'text-size-style';
    style.textContent = `
      * {
        font-size: calc(var(--base-font-size, 16px) * 1) !important;
        font-weight: var(--base-font-weight, 400) !important;
      }
      .text-xs { font-size: calc(var(--base-font-size, 16px) * 0.75) !important; }
      .text-sm { font-size: calc(var(--base-font-size, 16px) * 0.875) !important; }
      .text-base { font-size: calc(var(--base-font-size, 16px) * 1) !important; }
      .text-lg { font-size: calc(var(--base-font-size, 16px) * 1.125) !important; }
      .text-xl { font-size: calc(var(--base-font-size, 16px) * 1.25) !important; }
      .text-2xl { font-size: calc(var(--base-font-size, 16px) * 1.5) !important; }
      .text-3xl { font-size: calc(var(--base-font-size, 16px) * 1.875) !important; }
      .text-4xl { font-size: calc(var(--base-font-size, 16px) * 2.25) !important; }
      .text-5xl { font-size: calc(var(--base-font-size, 16px) * 3) !important; }
      .text-6xl { font-size: calc(var(--base-font-size, 16px) * 3.75) !important; }
      .text-7xl { font-size: calc(var(--base-font-size, 16px) * 4.5) !important; }
      .text-8xl { font-size: calc(var(--base-font-size, 16px) * 6) !important; }
      .text-9xl { font-size: calc(var(--base-font-size, 16px) * 8) !important; }
    `;
    document.head.appendChild(style);

    // Cleanup function that runs when component unmounts or dependencies change
    return () => {
      removeAllTextStyles();
    };
  }, [textSize, fontWeight, user]);

  // Additional cleanup on component unmount - ensures styles are removed even if useEffect cleanup doesn't run
  useEffect(() => {
    return () => {
      removeAllTextStyles();
    };
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('textSize', textSize.toString());
  }, [textSize]);

  useEffect(() => {
    localStorage.setItem('fontWeight', fontWeight.toString());
  }, [fontWeight]);

  // Save to backend
  const saveToBackend = async (key, value) => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          key: key,
          value: value
        })
      });
      
      if (response.status === 401) return; // Ignore unauth errors (e.g. token not yet available)
      if (!response.ok) console.warn('Failed to save preference to backend:', key);
    } catch (error) {
      // Avoid noisy console warnings.
      console.warn('Error saving preference to backend:', error?.message || error);
    }
  };

  // Load from backend on component mount
  useEffect(() => {
    const loadFromBackend = async () => {
      try {
        const response = await fetch('/api/user/preferences', {
          headers: {
            ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
          },
        });
        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          const prefs = data?.preferences && typeof data.preferences === 'object' ? data.preferences : {};
          if (prefs.textSize != null) {
            setTextSize(parseInt(prefs.textSize));
          }
          if (prefs.fontWeight != null) {
            setFontWeight(parseInt(prefs.fontWeight));
          }
        } else if (response.status === 401 || response.status === 403 || response.status === 404) {
          // Ignore auth/not-found responses to avoid noisy console/network errors in dev/demo accounts.
          return;
        }
      } catch (error) {
        console.warn('Error loading preferences from backend:', error?.message || error);
      }
    };

    loadFromBackend();
  }, [sessionToken]);

  const handleTextSizeChange = (newSize) => {
    setTextSize(newSize);
    saveToBackend('textSize', newSize);
  };

  const handleFontWeightChange = (newWeight) => {
    setFontWeight(newWeight);
    saveToBackend('fontWeight', newWeight);
  };

  const resetToDefault = () => {
    handleTextSizeChange(16);
    handleFontWeightChange(400);
  };

  const getFontWeightLabel = (weight) => {
    const labels = {
      100: 'Thin',
      200: 'Extra Light',
      300: 'Light',
      400: 'Normal',
      500: 'Medium',
      600: 'Semi Bold',
      700: 'Bold',
      800: 'Extra Bold',
      900: 'Black'
    };
    return labels[weight] || 'Normal';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600/80 rounded-full transition-colors"
        title="Text Size & Boldness Adjuster"
      >
        <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-10 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Text Adjustments
                </h3>
                <button
                  onClick={resetToDefault}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Reset
                </button>
              </div>

              {/* Text Size Control */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Text Size: {textSize}px
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">A</span>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={textSize}
                    onChange={(e) => handleTextSizeChange(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-xs text-slate-500">A</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>12px</span>
                  <span>24px</span>
                </div>
              </div>

              {/* Font Weight Control */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Font Weight: {getFontWeightLabel(fontWeight)}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[300, 400, 500, 600, 700, 800].map((weight) => (
                    <button
                      key={weight}
                      onClick={() => handleFontWeightChange(weight)}
                      className={`px-3 py-2 text-xs rounded-md transition-colors ${
                        fontWeight === weight
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                      }`}
                      style={{ fontWeight: weight.toString() }}
                    >
                      {getFontWeightLabel(weight)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Preview
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
                  <p style={{ fontSize: `${textSize}px`, fontWeight: fontWeight }}>
                    Sample text with your current settings
                  </p>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="mt-3">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Quick Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      handleTextSizeChange(14);
                      handleFontWeightChange(400);
                    }}
                    className="px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition-colors"
                  >
                    Small & Normal
                  </button>
                  <button
                    onClick={() => {
                      handleTextSizeChange(18);
                      handleFontWeightChange(600);
                    }}
                    className="px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition-colors"
                  >
                    Large & Bold
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #6366f1;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #6366f1;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default TextSizeAdjuster;
