import React from 'react';
import { X, Mail, Users, BarChart3, Sparkles, Search, Settings2, ArrowUpDown, FileText, Cpu, RefreshCw, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import AdvancedDataTable from '../../AdvancedDataTable';

/**
 * Users With Emails Modal Component
 * Displays enterprise-wide users with emails
 * 
 * @param {Object} props
 * @param {Object} props.modals - Modals controller
 * @param {Object} props.users - Users controller
 * @param {Object} props.columns - Column controller
 */
export default function UsersWithEmailsModal({ modals, users, columns }) {
  const {
    showUsersWithEmailsModal,
    closeUsersWithEmailsModal,
    tenantUsersSearch,
    setTenantUsersSearch,
    selectedMediafyConfigId,
    setSelectedMediafyConfigId,
    followersSortDirection,
    setFollowersSortDirection,
    postsSortDirection,
    setPostsSortDirection,
    selectedPromptTemplateId,
    setSelectedPromptTemplateId,
    selectedAiModelId,
    setSelectedAiModelId,
    tenantUsersCurrentPage,
    handlePrevTenantUsersPage,
    handleNextTenantUsersPage,
    tenantUsersHasPrevPage,
    tenantUsersHasNextPage,
    handleRefreshTenantUsers,
    fetchMediafyConfigs,
    selectedMediafyConfig,
    selectedPromptTemplate,
    selectedAiModel,
    tenantMediafyConfigs,
    starterMediafyConfigs,
    mediafyConfigsLoading,
    mediafyConfigsError,
    orderedPromptTemplates,
    promptTemplatesLoading,
    promptTemplatesError,
    orderedAiModels,
    aiModelsLoading,
    aiModelsError,
    sanitizeErrorMessage,
    handleSendTenantUsersToCampaign
  } = modals;

  const {
    tenantUsersWithEmails,
    tenantUsersLoading,
    sortedTenantUsers,
    tenantUsersTotalCount
  } = users;

  const { usersWithEmailsColumns } = columns;

  if (!showUsersWithEmailsModal) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-6"
      onClick={closeUsersWithEmailsModal}
    >
      <div
        className="relative w-full"
        style={{ width: '90vw', height: '90vh', maxWidth: '1600px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden">
          <div className="flex flex-col gap-4 px-8 py-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50/70 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-100 text-indigo-600 dark:text-indigo-300 text-xs font-semibold tracking-wide uppercase">
                  <Mail className="w-4 h-4" />
                  <span>Enterprise Snapshot</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 whitespace-nowrap">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span>{tenantUsersWithEmails.length.toLocaleString()} rows loaded</span>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 whitespace-nowrap">
                    <BarChart3 className={`w-4 h-4 ${tenantUsersLoading ? 'animate-spin text-indigo-500' : 'text-slate-400'}`} />
                    <span>{tenantUsersLoading ? 'Refreshing dataset…' : 'Live enterprise view'}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 whitespace-nowrap">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>100 rows/page</span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeUsersWithEmailsModal}
                className="self-start inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <span className="sr-only">Close modal</span>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="px-8 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="search"
                  value={tenantUsersSearch}
                  onChange={(e) => setTenantUsersSearch(e.target.value)}
                  placeholder="Search by handle, email, hashtag, or user id…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>
              <div className="flex w-full flex-nowrap gap-3 overflow-x-auto pb-1">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 px-4 py-3 shadow-sm min-w-[260px]">
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                      <Settings2 className="w-3.5 h-3.5" />
                      Display Configurator
                    </span>
                    <button
                      type="button"
                      onClick={fetchMediafyConfigs}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-50"
                      disabled={mediafyConfigsLoading}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${mediafyConfigsLoading ? 'animate-spin text-indigo-500' : ''}`} />
                      <span className="sr-only">Refresh configurations</span>
                    </button>
                  </div>
                  <select
                    value={selectedMediafyConfigId}
                    onChange={(e) => setSelectedMediafyConfigId(e.target.value)}
                    disabled={mediafyConfigsLoading}
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="default">Legacy enterprise layout</option>
                    {tenantMediafyConfigs.length > 0 && (
                      <optgroup label="Your configurations">
                        {tenantMediafyConfigs.map((config) => (
                          <option key={config.id} value={config.id}>
                            {config.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {starterMediafyConfigs.length > 0 && (
                      <optgroup label="Starter templates">
                        {starterMediafyConfigs.map((config) => (
                          <option key={config.id} value={config.id}>
                            {config.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  {mediafyConfigsError && !mediafyConfigsLoading && (
                    <p className="mt-1 text-[11px] text-red-500">{sanitizeErrorMessage(mediafyConfigsError)}</p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 px-4 py-3 shadow-sm min-w-[220px]">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    Followers Sort
                  </div>
                  <select
                    value={followersSortDirection}
                    onChange={(e) => setFollowersSortDirection(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="none">No sorting</option>
                    <option value="desc">High → Low</option>
                    <option value="asc">Low → High</option>
                  </select>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 px-4 py-3 shadow-sm min-w-[220px]">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    Posts Sort
                  </div>
                  <select
                    value={postsSortDirection}
                    onChange={(e) => setPostsSortDirection(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="none">No sorting</option>
                    <option value="desc">High → Low</option>
                    <option value="asc">Low → High</option>
                  </select>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 px-4 py-3 shadow-sm min-w-[240px]">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    Prompt Template
                  </div>
                  <select
                    value={selectedPromptTemplateId}
                    onChange={(e) => setSelectedPromptTemplateId(e.target.value)}
                    disabled={promptTemplatesLoading}
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All templates</option>
                    {orderedPromptTemplates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name}
                      </option>
                    ))}
                  </select>
                  {promptTemplatesError && (
                    <p className="mt-1 text-[11px] text-red-500">{promptTemplatesError}</p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 px-4 py-3 shadow-sm min-w-[240px]">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5" />
                    AI Model
                  </div>
                  <select
                    value={selectedAiModelId}
                    onChange={(e) => setSelectedAiModelId(e.target.value)}
                    disabled={aiModelsLoading}
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Preferred orchestration</option>
                    {orderedAiModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                  {aiModelsError && (
                    <p className="mt-1 text-[11px] text-red-500">{aiModelsError}</p>
                  )}
                </div>
              </div>
            </div>
            {(selectedMediafyConfig || selectedPromptTemplate || selectedAiModel) && (
              <div className="mt-4 flex flex-wrap gap-2 text-[12px] text-slate-600 dark:text-slate-400">
                {selectedMediafyConfig && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 font-semibold text-slate-700 dark:text-slate-200">
                    <Settings2 className="w-3.5 h-3.5" />
                    {selectedMediafyConfig.name}{' '}
                    {selectedMediafyConfig.parameters?.length
                      ? `(${selectedMediafyConfig.parameters.length} fields)`
                      : ''}
                  </span>
                )}
                {selectedPromptTemplate && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 dark:bg-sky-900/30 px-3 py-1 font-semibold text-sky-700 dark:text-sky-200">
                    <FileText className="w-3.5 h-3.5" />
                    {selectedPromptTemplate.name}
                  </span>
                )}
                {selectedAiModel && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 font-semibold text-emerald-700 dark:text-emerald-200">
                    <Cpu className="w-3.5 h-3.5" />
                    {selectedAiModel.name}
                  </span>
                )}
              </div>
            )}
            {users.tenantUsersError && !tenantUsersLoading && (
              <div className="mt-3 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <svg className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs font-medium text-red-700 dark:text-red-200 break-words">
                    {sanitizeErrorMessage(users.tenantUsersError)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => users.setTenantUsersError(null)}
                  className="flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                  aria-label="Dismiss error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden px-6 py-4 bg-gradient-to-b from-white via-white/90 to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
            <AdvancedDataTable
              key={`users-with-emails-${selectedMediafyConfig ? selectedMediafyConfig.id : 'legacy'}`}
              columns={usersWithEmailsColumns}
              data={sortedTenantUsers}
              loading={tenantUsersLoading}
              emptyMessage="No unique users with public emails match your filters."
              density="compact"
            />
          </div>

          <div className="px-8 py-4 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {tenantUsersHasNextPage
                ? "Navigate to the next page to keep browsing this tenant's catalog."
                : 'All available records for this tenant and filter set are in view.'}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <button
                type="button"
                onClick={() => handleSendTenantUsersToCampaign(tenantUsersTotalCount || tenantUsersWithEmails.length, orderedAiModels || [])}
                disabled={tenantUsersLoading || tenantUsersWithEmails.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>Send to Campaign</span>
              </button>
              <button
                type="button"
                onClick={handleRefreshTenantUsers}
                disabled={tenantUsersLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${tenantUsersLoading ? 'animate-spin text-indigo-600' : 'text-slate-500 dark:text-slate-300'}`} />
                <span>Refresh data</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevTenantUsersPage}
                  disabled={!tenantUsersHasPrevPage || tenantUsersLoading}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[3rem] text-center">Page {tenantUsersCurrentPage}</span>
                <button
                  type="button"
                  onClick={handleNextTenantUsersPage}
                  disabled={!tenantUsersHasNextPage || tenantUsersLoading}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

