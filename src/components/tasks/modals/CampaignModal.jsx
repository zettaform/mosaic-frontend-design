import React from 'react';
import { X, Send, Users, Mail } from 'lucide-react';

/**
 * Campaign Modal Component
 * Handles sending tasks to campaign with configuration
 * 
 * @param {Object} props
 * @param {Object} props.modals - Modals controller
 */
export default function CampaignModal({ modals }) {
  const {
    showCampaignModal,
    setShowCampaignModal,
    sendingToCampaign,
    campaignTaskIds,
    setCampaignTaskIds,
    campaignTaskOptions,
    campaignRequirePublicEmail,
    setCampaignRequirePublicEmail,
    campaignJsonFormat,
    setCampaignJsonFormat,
    campaignName,
    setCampaignName,
    campaignPromptTemplateId,
    setCampaignPromptTemplateId,
    campaignGptModel,
    setCampaignGptModel,
    orderedPromptTemplates,
    orderedAiModels,
    promptTemplatesLoading,
    aiModelsLoading,
    handleConfirmSendToCampaign,
    // Followers filter state
    campaignFollowersMin,
    setCampaignFollowersMin,
    campaignFollowersMax,
    setCampaignFollowersMax,
    // Tenant-wide campaign state
    isTenantWideCampaign,
    setIsTenantWideCampaign,
    campaignUserLimit,
    setCampaignUserLimit,
    tenantTotalUsersWithEmails,
    // Campaign exclusion state
    excludedCampaignIds,
    setExcludedCampaignIds,
    availableCampaignIds,
    campaignIdsLoading
  } = modals;

  if (!showCampaignModal) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-6"
      onClick={() => !sendingToCampaign && setShowCampaignModal(false)}
      style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeInUp 0.2s ease-out' }}
      >
        <div className="flex flex-col gap-4 px-8 py-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50/70 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-green-100 text-green-600 dark:text-green-300 text-xs font-semibold tracking-wide uppercase">
                <Send className="w-4 h-4" />
                <span>Send to Campaign</span>
              </div>
              {isTenantWideCampaign && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  <Users className="w-3.5 h-3.5" />
                  <span>Enterprise Users</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => !sendingToCampaign && setShowCampaignModal(false)}
              disabled={sendingToCampaign}
              className="self-start inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 disabled:opacity-50"
            >
              <span className="sr-only">Close modal</span>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          <div>
            {isTenantWideCampaign ? (
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Send users with emails from your enterprise to <code className="font-mono text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">sync-campaign-users</code>. 
                Choose how many users to include, then select the prompt template and GPT model.
              </p>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Build the payload that will be sent to <code className="font-mono text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">sync-campaign-users</code>. 
                Pick one or more tasks, decide whether public emails are required, then choose the prompt template and GPT model.
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!campaignJsonFormat}
                  onChange={(e) => setCampaignJsonFormat(e.target.checked)}
                  disabled={sendingToCampaign}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                    JSON results (DeepInfra json mode)
                  </span>
                  <span className="block text-xs text-slate-600 dark:text-slate-400">
                    When enabled, the campaign docs get <code className="font-mono">json_format: \"yes\"</code> and OpenAI results are requested/stored as JSON.
                  </span>
                </span>
              </label>
            </div>
            {/* Tenant-wide mode: Show user limit input */}
            {isTenantWideCampaign ? (
              <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-green-50/70 dark:bg-green-900/20 p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-800">
                    <Mail className="w-5 h-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-green-800 dark:text-green-200">
                      Enterprise Users with Emails
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Total available: {tenantTotalUsersWithEmails.toLocaleString()} users
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Number of users to send <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={tenantTotalUsersWithEmails || 10000}
                      value={campaignUserLimit}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1) {
                          setCampaignUserLimit(Math.min(val, tenantTotalUsersWithEmails || 10000));
                        }
                      }}
                      disabled={sendingToCampaign}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                      placeholder="Enter number of users..."
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCampaignUserLimit(50)}
                        disabled={sendingToCampaign}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          campaignUserLimit === 50
                            ? 'bg-green-600 text-white'
                            : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        } disabled:opacity-60`}
                      >
                        50
                      </button>
                      <button
                        type="button"
                        onClick={() => setCampaignUserLimit(100)}
                        disabled={sendingToCampaign}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          campaignUserLimit === 100
                            ? 'bg-green-600 text-white'
                            : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        } disabled:opacity-60`}
                      >
                        100
                      </button>
                      <button
                        type="button"
                        onClick={() => setCampaignUserLimit(500)}
                        disabled={sendingToCampaign}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          campaignUserLimit === 500
                            ? 'bg-green-600 text-white'
                            : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        } disabled:opacity-60`}
                      >
                        500
                      </button>
                      <button
                        type="button"
                        onClick={() => setCampaignUserLimit(tenantTotalUsersWithEmails || 1000)}
                        disabled={sendingToCampaign}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          campaignUserLimit === (tenantTotalUsersWithEmails || 1000)
                            ? 'bg-green-600 text-white'
                            : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        } disabled:opacity-60`}
                      >
                        All
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Users will be selected in order of creation. Adjust this limit if you don't want to send all users at once.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800">
                      <Users className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Filter by Followers Count
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Optional: Filter users by their follower count range
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Followers Range
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="number"
                          min={0}
                          value={campaignFollowersMin}
                          onChange={(e) => setCampaignFollowersMin(e.target.value)}
                          disabled={sendingToCampaign}
                          placeholder="Min followers (e.g., 100)"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
                        />
                      </div>
                      <span className="text-slate-500 dark:text-slate-400 text-sm">to</span>
                      <div className="flex-1">
                        <input
                          type="number"
                          min={0}
                          value={campaignFollowersMax}
                          onChange={(e) => setCampaignFollowersMax(e.target.value)}
                          disabled={sendingToCampaign}
                          placeholder="Max followers (e.g., 5000)"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Leave empty to include all followers. Example: 100 to 5000 followers.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Task-based mode: Show task selection */
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Task IDs to include <span className="text-red-500">*</span>
                  </label>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        {campaignTaskIds.length} selected
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCampaignTaskIds(campaignTaskOptions.map((option) => option.taskId))}
                          disabled={sendingToCampaign || campaignTaskOptions.length === 0}
                          className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-60"
                        >
                          Select all
                        </button>
                        <button
                          type="button"
                          onClick={() => setCampaignTaskIds([])}
                          disabled={sendingToCampaign || campaignTaskIds.length === 0}
                          className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-60"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 max-h-48 overflow-y-auto pr-1 space-y-2">
                      {campaignTaskOptions.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">No saved tasks available. Run a task to populate this list.</p>
                      ) : (
                        campaignTaskOptions.map((option) => {
                          const isChecked = campaignTaskIds.includes(option.taskId);
                          return (
                            <label
                              key={option.taskId}
                              className={`flex items-start gap-3 rounded-2xl border px-3 py-2 cursor-pointer transition-colors ${
                                isChecked
                                  ? 'border-indigo-500 bg-indigo-50/60 dark:border-indigo-500/60 dark:bg-indigo-900/20'
                                  : 'border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-600/40'
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                checked={isChecked}
                                disabled={sendingToCampaign}
                                onChange={() =>
                                  setCampaignTaskIds((prev) =>
                                    prev.includes(option.taskId)
                                      ? prev.filter((id) => id !== option.taskId)
                                      : [...prev, option.taskId]
                                  )
                                }
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                  #{option.hashtag || 'unknown'}{' '}
                                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                    ({option.taskId})
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  Status: {option.status} • Unique users: {option.totalUsers ?? 'n/a'}
                                </div>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Require public email with "@"
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        When enabled, the query filters dev-unique-users so only rows whose <code className="font-mono">public_email</code> contains an <code className="font-mono">@</code> are synced into the campaign container.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCampaignRequirePublicEmail((prev) => !prev)}
                      disabled={sendingToCampaign}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        campaignRequirePublicEmail ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      } ${sendingToCampaign ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                          campaignRequirePublicEmail ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800">
                      <Users className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Filter by Followers Count
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Optional: Filter users by their follower count range
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Followers Range
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="number"
                          min={0}
                          value={campaignFollowersMin}
                          onChange={(e) => setCampaignFollowersMin(e.target.value)}
                          disabled={sendingToCampaign}
                          placeholder="Min followers (e.g., 100)"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
                        />
                      </div>
                      <span className="text-slate-500 dark:text-slate-400 text-sm">to</span>
                      <div className="flex-1">
                        <input
                          type="number"
                          min={0}
                          value={campaignFollowersMax}
                          onChange={(e) => setCampaignFollowersMax(e.target.value)}
                          disabled={sendingToCampaign}
                          placeholder="Max followers (e.g., 5000)"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Leave empty to include all followers. Example: 100 to 5000 followers.
                    </p>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                disabled={sendingToCampaign}
                placeholder="Enter a name for this campaign"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Exclude Users from Previous Campaigns
              </label>
              <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-900/20 p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800">
                    <X className="w-5 h-5 text-amber-600 dark:text-amber-300" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                      Exclude Previous Campaign Users
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Select campaigns to exclude their users from this new campaign
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    {excludedCampaignIds.length} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExcludedCampaignIds(availableCampaignIds.map((campaign) => campaign.campaign_id))}
                      disabled={sendingToCampaign || availableCampaignIds.length === 0 || campaignIdsLoading}
                      className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-60"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={() => setExcludedCampaignIds([])}
                      disabled={sendingToCampaign || excludedCampaignIds.length === 0}
                      className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-60"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="mt-3 max-h-48 overflow-y-auto pr-1 space-y-2">
                  {campaignIdsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-500 border-t-transparent"></div>
                      <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">Loading campaigns...</span>
                    </div>
                  ) : availableCampaignIds.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">No previous campaigns found.</p>
                  ) : (
                    availableCampaignIds.map((campaign) => {
                      const isChecked = excludedCampaignIds.includes(campaign.campaign_id);
                      return (
                        <label
                          key={campaign.campaign_id}
                          className={`flex items-start gap-3 rounded-2xl border px-3 py-2 cursor-pointer transition-colors ${
                            isChecked
                              ? 'border-amber-500 bg-amber-50/60 dark:border-amber-500/60 dark:bg-amber-900/20'
                              : 'border-slate-200 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-600/40'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                            checked={isChecked}
                            disabled={sendingToCampaign}
                            onChange={() =>
                              setExcludedCampaignIds((prev) =>
                                prev.includes(campaign.campaign_id)
                                  ? prev.filter((id) => id !== campaign.campaign_id)
                                  : [...prev, campaign.campaign_id]
                              )
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {campaign.campaign_name || campaign.campaign_id}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              ID: {campaign.campaign_id} • Users: {campaign.total_users ?? 'n/a'} • {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : 'Unknown date'}
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
                <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                  Users who participated in selected campaigns will be excluded from this new campaign to ensure fresh outreach.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Prompt Template <span className="text-red-500">*</span>
              </label>
              <select
                value={campaignPromptTemplateId}
                onChange={(e) => setCampaignPromptTemplateId(e.target.value)}
                disabled={promptTemplatesLoading || sendingToCampaign}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="">Select a prompt template...</option>
                {orderedPromptTemplates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))}
              </select>
              {promptTemplatesLoading && (
                <p className="mt-1 text-xs text-slate-500">Loading templates...</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                GPT Model <span className="text-red-500">*</span>
              </label>
              <select
                value={campaignGptModel}
                onChange={(e) => setCampaignGptModel(e.target.value)}
                disabled={aiModelsLoading || sendingToCampaign}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="">Select a GPT model...</option>
                {orderedAiModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              {aiModelsLoading && (
                <p className="mt-1 text-xs text-slate-500">Loading models...</p>
              )}
            </div>
          </div>
        </div>
        <div className="px-8 py-6 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowCampaignModal(false)}
            disabled={sendingToCampaign}
            className="px-4 py-2 rounded-2xl text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmSendToCampaign}
            disabled={
              sendingToCampaign || 
              !campaignName || 
              !campaignPromptTemplateId || 
              !campaignGptModel || 
              (isTenantWideCampaign ? !campaignUserLimit || campaignUserLimit < 1 : campaignTaskIds.length === 0)
            }
            className="px-6 py-2 rounded-2xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sendingToCampaign ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send to Campaign
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

