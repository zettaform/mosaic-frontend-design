import React from 'react';
import { X } from 'lucide-react';

/**
 * Task View Modal Component
 * Displays task details and records in a modal
 * 
 * @param {Object} props
 * @param {Object} props.modals - Modals controller
 */
export default function TaskViewModal({ modals }) {
  const {
    showTaskViewModal,
    setShowTaskViewModal,
    taskViewLoading,
    modalSelectedResult,
    modalSummary,
    modalExtractedItems,
    modalRecordsLoading,
    modalRecordsPageIndex,
    modalRecordsNextKey,
    handleModalPrevRecordsPage,
    handleModalNextRecordsPage
  } = modals;

  if (!showTaskViewModal) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-6"
      onClick={() => setShowTaskViewModal(false)}
    >
      <div
        className="relative w-full"
        style={{ width: '90vw', height: '90vh', maxWidth: '1600px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Task Results
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {modalSelectedResult?.hashtag ? `#${modalSelectedResult.hashtag}` : modalSelectedResult?.taskId?.substring(0, 12) || 'Loading...'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTaskViewModal(false)}
              className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {taskViewLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
                  <p className="text-slate-600 dark:text-slate-400">Loading task results...</p>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-auto">
                {/* Task Summary */}
                {modalSummary && (
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          {modalSummary.total_items?.toLocaleString() || 0}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Total Items</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {modalSummary.unique_users?.toLocaleString() || 0}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Unique Users</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {modalSelectedResult?.created_at ? new Date(modalSelectedResult.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Created</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Records Table */}
                <div className="p-6">
                  {modalRecordsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
                        <p className="text-slate-600 dark:text-slate-400">Loading records...</p>
                      </div>
                    </div>
                  ) : modalExtractedItems.length > 0 ? (
                    <div className="overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                          <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                              <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">#</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">User ID</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Username</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Caption</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Likes</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Comments</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Code</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {modalExtractedItems.map((item, index) => (
                              <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all">
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                  {item.item_index}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 font-mono">
                                  {item.user_id}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                                  @{item.username}
                                </td>
                                <td className="px-3 py-4 text-sm text-slate-900 dark:text-slate-100 max-w-xs truncate">
                                  {item.full_name}
                                </td>
                                <td className="px-3 py-4 text-sm text-slate-900 dark:text-slate-100 max-w-md">
                                  <div className="truncate" title={item.caption_text}>
                                    {item.caption_text && item.caption_text.length > 50 ? `${item.caption_text.substring(0, 50)}...` : item.caption_text}
                                  </div>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                                  <span className="font-mono">{(item.likes_count || 0).toLocaleString()}</span>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                                  <span className="font-mono">{(item.comments_count || 0).toLocaleString()}</span>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 font-mono">
                                  {item.code}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-slate-600 dark:text-slate-400">Page {modalRecordsPageIndex + 1}</div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleModalPrevRecordsPage}
                            disabled={modalRecordsLoading || modalRecordsPageIndex === 0}
                            className="px-3 py-1 bg-slate-100 dark:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 rounded text-sm"
                          >Previous</button>
                          <button
                            onClick={handleModalNextRecordsPage}
                            disabled={modalRecordsLoading || !modalRecordsNextKey}
                            className="px-3 py-1 bg-slate-100 dark:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 rounded text-sm"
                          >Next</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-slate-600 dark:text-slate-400">No records found for this task.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

