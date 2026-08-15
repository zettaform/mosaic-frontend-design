import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Label } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import costEstimatorService from '../services/costEstimatorService';

function CostEstimator() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Form state
  const [userCount, setUserCount] = useState(1000);
  const [captionsCount, setCaptionsCount] = useState(12);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [outputTokens, setOutputTokens] = useState(300);
  const [selectedModel, setSelectedModel] = useState(null);
  
  // Data state
  const [templates, setTemplates] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState({});
  
  // Combobox search states
  const [userCountQuery, setUserCountQuery] = useState('');
  const [captionsQuery, setCaptionsQuery] = useState('');
  const [templateQuery, setTemplateQuery] = useState('');
  const [modelQuery, setModelQuery] = useState('');

  // Cost change tracking
  const previousCostEstimate = useRef(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [templatesResult, modelsResult] = await Promise.all([
          costEstimatorService.getPromptTemplates(),
          costEstimatorService.getAIModels()
        ]);
        
        if (templatesResult.success) {
          setTemplates(templatesResult.templates);
          if (templatesResult.templates.length > 0) {
            setSelectedTemplate(templatesResult.templates[0]);
          }
        }
        
        if (modelsResult.success) {
          setModels(modelsResult.models);
          if (modelsResult.models.length > 0) {
            setSelectedModel(modelsResult.models[0]);
          }
        }
      } catch (err) {
        setError('Failed to load configuration data');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Initialize audio on component mount
  useEffect(() => {
    const initAudio = () => {
      if (audioRef.current) {
        console.log('Initializing audio element...');
        createBackgroundMusic();
      }
    };

    // Initialize after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(initAudio, 500);
    return () => clearTimeout(timeoutId);
  }, []);

  // Real-time calculations
  const calculations = useMemo(() => {
    if (!selectedTemplate || !selectedModel) {
      return null;
    }

    const tokenEstimate = costEstimatorService.calculateTokenEstimate(
      captionsCount,
      selectedTemplate
    );
    
    const costEstimate = costEstimatorService.calculateCostEstimate(
      tokenEstimate,
      outputTokens,
      userCount,
      selectedModel
    );

    return {
      tokenEstimate,
      costEstimate
    };
  }, [userCount, captionsCount, selectedTemplate, outputTokens, selectedModel]);

  // Form validation
  useEffect(() => {
    const errors = {};
    
    if (outputTokens < 1 || outputTokens > 10000) {
      errors.outputTokens = 'Output tokens must be between 1 and 10,000';
    }
    
    if (!selectedTemplate) {
      errors.template = 'Please select a prompt template';
    }
    
    if (!selectedModel) {
      errors.model = 'Please select an AI model';
    }
    
    setValidationErrors(errors);
  }, [outputTokens, selectedTemplate, selectedModel]);


  // Effect to detect cost estimate changes and play music
  useEffect(() => {
    if (calculations && Object.keys(validationErrors).length === 0) {
      const currentCostEstimate = calculations.costEstimate.totalCostRange.min;
      
      // Check if cost estimate has changed
      if (previousCostEstimate.current !== null && 
          previousCostEstimate.current !== currentCostEstimate) {
        
        console.log('Cost estimate changed from', previousCostEstimate.current, 'to', currentCostEstimate);
        
        // Play music when cost estimate changes using global function
        if (window.playBackgroundMusic) {
          console.log('Playing background music...');
          window.playBackgroundMusic();
        }
      }
      
      previousCostEstimate.current = currentCostEstimate;
    }
  }, [calculations]);



  const userCountOptions = costEstimatorService.getUserCountOptions();
  const captionCountOptions = costEstimatorService.getCaptionCountOptions();

  // Helper functions for filtering combobox options
  const getFilteredUserCountOptions = () => {
    return userCountQuery === ''
      ? userCountOptions
      : userCountOptions.filter((option) =>
          option.label.toLowerCase().includes(userCountQuery.toLowerCase())
        );
  };

  const getFilteredCaptionOptions = () => {
    return captionsQuery === ''
      ? captionCountOptions
      : captionCountOptions.filter((option) =>
          option.label.toLowerCase().includes(captionsQuery.toLowerCase())
        );
  };

  const getFilteredTemplateOptions = () => {
    return templateQuery === ''
      ? templates
      : templates.filter((template) =>
          template.name.toLowerCase().includes(templateQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(templateQuery.toLowerCase())
        );
  };

  const getFilteredModelOptions = () => {
    return modelQuery === ''
      ? models
      : models.filter((model) =>
          model.name.toLowerCase().includes(modelQuery.toLowerCase()) ||
          model.description.toLowerCase().includes(modelQuery.toLowerCase())
        );
  };

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="sidebar-shell-main">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main>
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
                  <p className="mt-4 text-sm text-slate-500">Loading configuration...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main>
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            
            {/* Page header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">Sales Pitch Cost Estimator</h1>
                <p className="text-slate-600 dark:text-slate-400">Calculate projected costs for generating custom sales pitches from Instagram captions</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Input Configuration Panel */}
              <div className="xl:col-span-2">
                <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700">
                  <header className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                    <h2 className="font-semibold text-slate-800 dark:text-slate-100">Configuration Parameters</h2>
                  </header>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Number of Users */}
                      <div>
                        <Combobox
                          as="div"
                          value={userCountOptions.find(option => option.value === userCount) || userCountOptions[0]}
                          onChange={(option) => {
                            setUserCount(option.value);
                            setUserCountQuery('');
                          }}
                        >
                          <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Number of Sales Pitches
                          </Label>
                          <div className="relative mt-2">
                            <ComboboxInput
                              className="block w-full rounded-md bg-white dark:bg-slate-700 py-1.5 pr-12 pl-3 text-base text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm/6"
                              onChange={(event) => setUserCountQuery(event.target.value)}
                              onBlur={() => setUserCountQuery('')}
                              displayValue={(option) => option?.label}
                            />
                            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-hidden">
                              <ChevronDownIcon className="size-5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                            </ComboboxButton>

                            <ComboboxOptions
                              transition
                              className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1 text-base data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm"
                            >
                              {getFilteredUserCountOptions().map((option) => (
                                <ComboboxOption
                                  key={option.value}
                                  value={option}
                                  className="cursor-default px-3 py-2 text-slate-700 dark:text-slate-300 select-none data-focus:bg-indigo-500 data-focus:text-white data-focus:outline-hidden hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                  <span className="block truncate">{option.label}</span>
                                </ComboboxOption>
                              ))}
                            </ComboboxOptions>
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Total number of sales pitches to generate
                          </p>
                        </Combobox>
                      </div>

                      {/* Number of Captions */}
                      <div>
                        <Combobox
                          as="div"
                          value={captionCountOptions.find(option => option.value === captionsCount) || captionCountOptions[0]}
                          onChange={(option) => {
                            setCaptionsCount(option.value);
                            setCaptionsQuery('');
                          }}
                        >
                          <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Captions Per User
                          </Label>
                          <div className="relative mt-2">
                            <ComboboxInput
                              className="block w-full rounded-md bg-white dark:bg-slate-700 py-1.5 pr-12 pl-3 text-base text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm/6"
                              onChange={(event) => setCaptionsQuery(event.target.value)}
                              onBlur={() => setCaptionsQuery('')}
                              displayValue={(option) => option?.label}
                            />
                            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-hidden">
                              <ChevronDownIcon className="size-5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                            </ComboboxButton>

                            <ComboboxOptions
                              transition
                              className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1 text-base data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm"
                            >
                              {getFilteredCaptionOptions().map((option) => (
                                <ComboboxOption
                                  key={option.value}
                                  value={option}
                                  className="cursor-default px-3 py-2 text-slate-700 dark:text-slate-300 select-none data-focus:bg-indigo-500 data-focus:text-white data-focus:outline-hidden hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                  <span className="block truncate">{option.label}</span>
                                </ComboboxOption>
                              ))}
                            </ComboboxOptions>
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Instagram captions to analyze per user (multiples of 12)
                          </p>
                        </Combobox>
                      </div>

                      {/* Prompt Template */}
                      <div>
                        <Combobox
                          as="div"
                          value={selectedTemplate}
                          onChange={(template) => {
                            setSelectedTemplate(template);
                            setTemplateQuery('');
                          }}
                        >
                          <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Prompt Template
                          </Label>
                          <div className="relative mt-2">
                            <ComboboxInput
                              className={`block w-full rounded-md bg-white dark:bg-slate-700 py-1.5 pr-12 pl-3 text-base text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm/6 ${validationErrors.template ? 'ring-2 ring-red-500 border-red-500' : ''}`}
                              onChange={(event) => setTemplateQuery(event.target.value)}
                              onBlur={() => setTemplateQuery('')}
                              displayValue={(template) => template ? `${template.name} (${costEstimatorService.formatTokenCount(template.tokenCount)} tokens)` : 'Select a template...'}
                            />
                            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-hidden">
                              <ChevronDownIcon className="size-5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                            </ComboboxButton>

                            <ComboboxOptions
                              transition
                              className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1 text-base data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm"
                            >
                              {getFilteredTemplateOptions().map((template) => (
                                <ComboboxOption
                                  key={template.id}
                                  value={template}
                                  className="cursor-default px-3 py-2 text-slate-700 dark:text-slate-300 select-none data-focus:bg-indigo-500 data-focus:text-white data-focus:outline-hidden hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                  <div className="block truncate">
                                    <div className="font-medium">{template.name}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                      {costEstimatorService.formatTokenCount(template.tokenCount)} tokens
                                    </div>
                                  </div>
                                </ComboboxOption>
                              ))}
                            </ComboboxOptions>
                          </div>
                          {selectedTemplate && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {selectedTemplate.description}
                            </p>
                          )}
                          {validationErrors.template && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.template}</p>
                          )}
                        </Combobox>
                      </div>

                      {/* Expected Output Tokens */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Expected Output Tokens
                        </label>
                        <input
                          type="number"
                          value={outputTokens}
                          onChange={(e) => setOutputTokens(Number(e.target.value))}
                          min="1"
                          max="10000"
                          className={`form-input w-full border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 ${validationErrors.outputTokens ? 'border-red-300 dark:border-red-500' : ''}`}
                          placeholder="300"
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Expected tokens in generated sales pitch (1-10,000)
                        </p>
                        {validationErrors.outputTokens && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.outputTokens}</p>
                        )}
                      </div>

                      {/* AI Model Selection */}
                      <div className="md:col-span-2">
                        <Combobox
                          as="div"
                          value={selectedModel}
                          onChange={(model) => {
                            setSelectedModel(model);
                            setModelQuery('');
                          }}
                        >
                          <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            AI Model
                          </Label>
                          <div className="relative mt-2">
                            <ComboboxInput
                              className={`block w-full rounded-md bg-white dark:bg-slate-700 py-1.5 pr-12 pl-3 text-base text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm/6 ${validationErrors.model ? 'ring-2 ring-red-500 border-red-500' : ''}`}
                              onChange={(event) => setModelQuery(event.target.value)}
                              onBlur={() => setModelQuery('')}
                              displayValue={(model) => model ? `${model.name} - Input: $${model.inputCostPerMillion}/1M tokens, Output: $${model.outputCostPerMillion}/1M tokens` : 'Select a model...'}
                            />
                            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-hidden">
                              <ChevronDownIcon className="size-5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                            </ComboboxButton>

                            <ComboboxOptions
                              transition
                              className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1 text-base data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm"
                            >
                              {getFilteredModelOptions().map((model) => (
                                <ComboboxOption
                                  key={model.id}
                                  value={model}
                                  className="cursor-default px-3 py-2 text-slate-700 dark:text-slate-300 select-none data-focus:bg-indigo-500 data-focus:text-white data-focus:outline-hidden hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                  <div className="block truncate">
                                    <div className="font-medium">{model.name}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                      Input: ${model.inputCostPerMillion}/1M tokens, Output: ${model.outputCostPerMillion}/1M tokens
                                    </div>
                                  </div>
                                </ComboboxOption>
                              ))}
                            </ComboboxOptions>
                          </div>
                          {selectedModel && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {selectedModel.description}
                            </p>
                          )}
                          {validationErrors.model && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.model}</p>
                          )}
                        </Combobox>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Preview Panel */}
              <div className="xl:col-span-1">
                <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700">
                  <header className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                    <h2 className="font-semibold text-slate-800 dark:text-slate-100">Cost Estimate</h2>
                  </header>
                  <div className="p-6">
                    {calculations && Object.keys(validationErrors).length === 0 ? (
                      <div className="space-y-6">
                        
                        {/* Token Breakdown */}
                        <div>
                          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Token Analysis</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Captions:</span>
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {costEstimatorService.formatTokenCount(calculations.tokenEstimate.captionTokensRange.min)} - {costEstimatorService.formatTokenCount(calculations.tokenEstimate.captionTokensRange.max)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Prompt:</span>
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {costEstimatorService.formatTokenCount(calculations.tokenEstimate.promptTokens)}
                              </span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 dark:border-slate-600 pt-2">
                              <span className="text-slate-700 dark:text-slate-300 font-medium">Input Total:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {costEstimatorService.formatTokenCount(calculations.tokenEstimate.minInputTokens)} - {costEstimatorService.formatTokenCount(calculations.tokenEstimate.maxInputTokens)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Output per pitch:</span>
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {costEstimatorService.formatTokenCount(outputTokens)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Cost Breakdown */}
                        <div>
                          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Cost Breakdown</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Input Cost:</span>
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {costEstimatorService.formatCurrency(calculations.costEstimate.inputCostRange.min)} - {costEstimatorService.formatCurrency(calculations.costEstimate.inputCostRange.max)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Output Cost:</span>
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {costEstimatorService.formatCurrency(calculations.costEstimate.outputCost)}
                              </span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 dark:border-slate-600 pt-2">
                              <span className="text-slate-700 dark:text-slate-300 font-medium">Total Cost:</span>
                              <span className="font-semibold text-lg text-slate-800 dark:text-slate-200">
                                {costEstimatorService.formatCurrency(calculations.costEstimate.totalCostRange.min)} - {costEstimatorService.formatCurrency(calculations.costEstimate.totalCostRange.max)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Per Pitch Cost */}
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                          <h3 className="text-sm font-medium text-indigo-900 dark:text-indigo-300 mb-2">Cost Per Sales Pitch</h3>
                          <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-200">
                            {costEstimatorService.formatCurrency(calculations.costEstimate.costPerPitchRange.min)} - {costEstimatorService.formatCurrency(calculations.costEstimate.costPerPitchRange.max)}
                          </div>
                          <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">
                            Based on {userCount.toLocaleString()} sales pitches
                          </p>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                              {userCount.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">Pitches</div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                              {captionsCount}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">Captions Each</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-slate-400 dark:text-slate-500 mb-2">
                          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Complete the configuration to see cost estimates
                        </p>
                        {Object.keys(validationErrors).length > 0 && (
                          <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                            Please fix validation errors
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="mt-8 bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-600 dark:text-slate-400">
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">1. Token Calculation</h4>
                  <p>Each Instagram caption contains approximately 100-150 tokens. The total input includes captions plus your selected prompt template.</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">2. Cost Calculation</h4>
                  <p>Costs are calculated based on the AI model's pricing per million tokens, separately for input processing and output generation.</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">3. Real-time Updates</h4>
                  <p>All estimates update automatically as you change parameters, showing both minimum and maximum cost ranges.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default CostEstimator;
