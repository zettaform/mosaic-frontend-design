import React, { useState, useEffect } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import adminApiService from '../../services/adminApiService';
import promptTemplatesService from '../../services/promptTemplatesService';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';

function AIModels() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openaiModels, setOpenaiModels] = useState([]);
  const [dbModels, setDbModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState('');

  // Test form states
  const [userIdentifier, setUserIdentifier] = useState('');
  const [isUserId, setIsUserId] = useState(false);
  const [captions, setCaptions] = useState([]);
  const [showCaptions, setShowCaptions] = useState(false);

  // Analysis states
  const [promptTemplates, setPromptTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStats, setAnalysisStats] = useState(null);

  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [modelTypeFilter, setModelTypeFilter] = useState('all');

  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  // RBAC check
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  const routeInfo = ROUTE_TO_SECTION[currentPath];
  if (routeInfo) {
    const { section, page } = routeInfo;
    if (!hasAccess(user, section, page)) {
      return <Navigate to="/unauthorized" replace />;
    }
  } else {
    return <Navigate to="/unauthorized" replace />;
  }

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [modelsResult, templatesResult] = await Promise.all([
          adminApiService.getOpenAIModels(),
          promptTemplatesService.getTemplates(user?.email)
        ]);

        if (modelsResult.success) {
          setOpenaiModels(modelsResult.models || []);
        } else {
          setError(modelsResult.error || 'Failed to fetch OpenAI models');
        }

        if (templatesResult.success) {
          setPromptTemplates(templatesResult.templates || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load AI models');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.email]);

  // Fetch Instagram captions
  const handleFetchCaptions = async () => {
    try {
      if (!userIdentifier.trim()) {
        setTestError('Please enter a username or user ID');
        return;
      }

      setTestLoading(true);
      setTestError('');
      setCaptions([]);

      const result = await adminApiService.getInstagramCaptions(userIdentifier, isUserId);

      if (result.success) {
        setCaptions(result.captions || []);
        setShowCaptions(true);
        setSuccess(`Fetched ${result.captions?.length || 0} captions`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setTestError(result.error || 'Failed to fetch captions');
      }
    } catch (err) {
      console.error('Error fetching captions:', err);
      setTestError(err.message || 'Failed to fetch captions');
    } finally {
      setTestLoading(false);
    }
  };

  // Run analysis
  const handleRunAnalysis = async () => {
    try {
      if (!selectedModel) {
        setTestError('Please select a model');
        return;
      }

      if (!selectedTemplate && !customPrompt.trim()) {
        setTestError('Please select a template or enter a custom prompt');
        return;
      }

      if (captions.length === 0) {
        setTestError('Please fetch captions first');
        return;
      }

      setAnalyzing(true);
      setTestError('');
      setAnalysisResult('');

      const analysisData = {
        userIdentifier,
        isUserId,
        modelId: selectedModel.id,
        promptTemplate: selectedTemplate || customPrompt,
        customPrompt: customPrompt || undefined
      };

      const result = await adminApiService.analyzeInstagramCaptions(analysisData);

      if (result.success) {
        setAnalysisResult(result.analysis || '');
        setAnalysisStats(result.usage || {});
        setSuccess('Analysis completed successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setTestError(result.error || 'Failed to run analysis');
      }
    } catch (err) {
      console.error('Error running analysis:', err);
      setTestError(err.message || 'Failed to run analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  // Filter models
  const filteredModels = openaiModels.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.owner.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = modelTypeFilter === 'all' || model.type === modelTypeFilter;
    return matchesSearch && matchesType;
  });

  const modelTypes = ['all', ...new Set(openaiModels.map(m => m.type))];

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="sidebar-shell-main flex flex-col flex-1">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="mb-12">
              <div className="mb-2">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2">
                  AI Models Explorer
                </h1>
                <p className="text-slate-400 text-lg">
                  Test and analyze available AI models with real Instagram data
                </p>
              </div>
              <div className="h-1 w-24 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"></div>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 animate-pulse">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300 animate-pulse">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{success}</span>
                </div>
              </div>
            )}

            {/* Search and Filter Bar */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search models by name or provider..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                  />
                </div>
              </div>

              <select
                value={modelTypeFilter}
                onChange={(e) => setModelTypeFilter(e.target.value)}
                className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              >
                {modelTypes.map(type => (
                  <option key={type} value={type} className="bg-slate-900">
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </select>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full animate-spin opacity-75" style={{ borderRadius: '50%', borderTop: '4px solid transparent' }}></div>
                  <div className="absolute inset-2 bg-slate-900 rounded-full"></div>
                </div>
                <p className="text-slate-400 text-lg">Loading AI models...</p>
              </div>
            ) : (
              <>
                {/* Models Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {filteredModels.map((model) => (
                    <div
                      key={model.id}
                      className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 cursor-pointer"
                      onClick={() => {
                        setSelectedModel(model);
                        setShowTestModal(true);
                        setTestError('');
                        setAnalysisResult('');
                        setCaptions([]);
                        setShowCaptions(false);
                      }}
                    >
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/5 group-hover:to-purple-500/5 rounded-xl transition-all duration-300"></div>

                      {/* Content */}
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                              {model.name}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">{model.owner}</p>
                          </div>
                          <div className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-medium border border-cyan-500/30">
                            {model.type}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Created: {new Date(model.created * 1000).toLocaleDateString()}
                        </div>

                        {/* Test Button */}
                        <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 hover:from-cyan-500/30 hover:to-purple-500/30">
                          Test Model
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Empty State */}
                {filteredModels.length === 0 && (
                  <div className="text-center py-20">
                    <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-slate-400 text-lg">No models found matching your criteria</p>
                  </div>
                )}

                {/* Model Count */}
                <div className="text-center text-slate-500 text-sm mb-8">
                  Showing {filteredModels.length} of {openaiModels.length} models
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Test Model Modal */}
      {showTestModal && selectedModel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700/50 px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">
                  Test Model: <span className="text-cyan-400">{selectedModel.name}</span>
                </h2>
                <p className="text-slate-400 mt-1">Provider: {selectedModel.owner}</p>
              </div>
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestError('');
                  setAnalysisResult('');
                }}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-8 py-6 space-y-6">
              {/* Test Error */}
              {testError && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{testError}</span>
                  </div>
                </div>
              )}

              {/* Step 1: Fetch Captions */}
              {!analysisResult && (
                <>
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-bold">1</span>
                      Fetch Instagram Captions
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Username or User ID
                        </label>
                        <input
                          type="text"
                          value={userIdentifier}
                          onChange={(e) => setUserIdentifier(e.target.value)}
                          placeholder="e.g., loczidesign or 378339456"
                          className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isUserId}
                            onChange={(e) => setIsUserId(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-900/50 text-cyan-500 focus:ring-cyan-500"
                          />
                          <span className="text-sm text-slate-300">This is a User ID (not username)</span>
                        </label>
                      </div>

                      <button
                        onClick={handleFetchCaptions}
                        disabled={testLoading}
                        className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20"
                      >
                        {testLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Fetching captions...
                          </span>
                        ) : (
                          'Fetch Last 12 Captions'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Display Captions */}
                  {showCaptions && captions.length > 0 && (
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-slate-100 mb-4">
                        Captions ({captions.length})
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-48 overflow-y-auto pr-2">
                        {captions.map((caption, idx) => (
                          <div key={caption.id} className="bg-slate-900/50 border border-slate-600/30 rounded-lg p-3">
                            <p className="text-xs text-slate-400 mb-2">Post {idx + 1}</p>
                            <p className="text-sm text-slate-200 line-clamp-3">{caption.caption || '(No caption)'}</p>
                            <div className="flex gap-4 mt-2 text-xs text-slate-500">
                              <span>❤️ {caption.likes}</span>
                              <span>💬 {caption.comments}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Select Prompt and Analyze */}
                  {showCaptions && captions.length > 0 && (
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-bold">2</span>
                        Analyze with Prompt Template
                      </h3>

                      <div className="space-y-4">
                        {promptTemplates.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Select a Prompt Template
                            </label>
                            <select
                              value={selectedTemplate}
                              onChange={(e) => {
                                setSelectedTemplate(e.target.value);
                                setCustomPrompt('');
                              }}
                              className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                            >
                              <option value="">Choose a template...</option>
                              {promptTemplates.map(template => (
                                <option key={template.id} value={template.content} className="bg-slate-900">
                                  {template.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Or Enter Custom Prompt
                          </label>
                          <textarea
                            value={customPrompt}
                            onChange={(e) => {
                              setCustomPrompt(e.target.value);
                              if (e.target.value) setSelectedTemplate('');
                            }}
                            placeholder="Enter your custom analysis prompt..."
                            className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                            rows="4"
                          />
                        </div>

                        <button
                          onClick={handleRunAnalysis}
                          disabled={analyzing}
                          className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
                        >
                          {analyzing ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Analyzing...
                            </span>
                          ) : (
                            'Run Analysis'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Analysis Results */}
              {analysisResult && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Analysis Results
                    </h3>
                    <div className="bg-slate-900/50 border border-slate-600/30 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <p className="text-slate-300 whitespace-pre-wrap leading-relaxed font-normal text-sm">{analysisResult}</p>
                    </div>
                  </div>

                  {/* Token Usage Stats */}
                  {analysisStats && Object.keys(analysisStats).length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
                        <p className="text-sm text-slate-400 mb-2">Input Tokens</p>
                        <p className="text-2xl font-bold text-cyan-400">{analysisStats.inputTokens || 0}</p>
                      </div>
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
                        <p className="text-sm text-slate-400 mb-2">Output Tokens</p>
                        <p className="text-2xl font-bold text-purple-400">{analysisStats.outputTokens || 0}</p>
                      </div>
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
                        <p className="text-sm text-slate-400 mb-2">Total Tokens</p>
                        <p className="text-2xl font-bold text-pink-400">{analysisStats.totalTokens || 0}</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setAnalysisResult('');
                      setAnalysisStats(null);
                      setSelectedTemplate('');
                      setCustomPrompt('');
                    }}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 text-slate-300 font-semibold rounded-lg transition-all duration-300"
                  >
                    Run Another Analysis
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIModels;
