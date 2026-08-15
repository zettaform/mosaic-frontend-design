import React from 'react';

/**
 * New Collection Form Component
 * Handles hashtag collection form and submission
 * 
 * @param {Object} props
 * @param {Object} props.collection - Collection controller data
 */
export default function NewCollectionForm({ collection }) {
  const {
    hashtag,
    setHashtag,
    targetCount,
    setTargetCount,
    loading,
    progress,
    triggerFetch,
    startBackgroundTask,
    error,
    result,
    extractedItems,
    summary,
    animatedRows,
    sendTaskToPhases
  } = collection;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6">
      <form onSubmit={triggerFetch} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            Hashtag
          </label>
          <input
            type="text"
            id="tour-hashtag-input"
            value={hashtag}
            onChange={(e) => setHashtag(e.target.value)}
            placeholder="summer"
            className="form-input w-full"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            Target Record Count
          </label>
          <input
            type="number"
            id="tour-target-count-input"
            value={targetCount}
            onChange={(e) => setTargetCount(e.target.value === '' ? '' : parseInt(e.target.value) || 100)}
            placeholder="100"
            min="1"
            max="5000"
            className="form-input w-full"
            required
          />
        </div>

        {/* Enterprise Progress Indicator */}
        {loading && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  {progress.phase}
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {progress.current}
                </span>
                <span className="text-sm text-blue-500 dark:text-blue-300">
                  /{progress.target}
                </span>
                {progress.call_number && (
                  <div className="text-xs text-blue-500 dark:text-blue-400">
                    Call {progress.call_number}
                  </div>
                )}
              </div>
            </div>
            
            {/* Main Progress Bar */}
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3 mb-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm" 
                style={{ width: `${Math.min((progress.current / progress.target) * 100, 100)}%` }}
              ></div>
            </div>
            
            {/* Enterprise Status Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-white/50 dark:bg-slate-800/50 rounded p-2">
                <div className="text-slate-600 dark:text-slate-400">Processing Speed</div>
                <div className="font-semibold text-green-600 dark:text-green-400">~100ms/record</div>
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded p-2">
                <div className="text-slate-600 dark:text-slate-400">ETA</div>
                <div className="font-semibold text-blue-600 dark:text-blue-400">
                  {Math.max(0, Math.round((progress.target - progress.current) * 0.1))}s
                </div>
              </div>
            </div>
            
            {/* Real-time Toast Notifications */}
            {progress.new_items && (
              <div className="mt-3 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-700 dark:text-green-300">
                    +{progress.new_items} new records processed
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button 
            onClick={startBackgroundTask} 
            disabled={loading || targetCount > 5000} 
            type="button" 
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium w-full sm:w-auto"
          >
            Start in Background
          </button>
        </div>
      </form>
      
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded p-4 mb-6 mt-4">
          <div className="font-semibold mb-1">Request Error</div>
          <div>{error}</div>
        </div>
      )}

      {result && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 space-y-6 mt-6">
          {/* Header with file info */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Hashtag Analysis Results
              </h2>
              {result.saved_file && (
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Saved file: <span className="font-mono">{result.saved_file}</span>
                </p>
              )}
            </div>
          </div>

          {/* Summary Statistics */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="text-sm text-slate-500 dark:text-slate-400">Total Items</div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {summary.total_items}
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="text-sm text-slate-500 dark:text-slate-400">Total Likes</div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {summary.total_likes.toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="text-sm text-slate-500 dark:text-slate-400">Total Comments</div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {summary.total_comments.toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="text-sm text-slate-500 dark:text-slate-400">Verified Users</div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {summary.verified_users}/{summary.total_items} ({summary.verified_percentage}%)
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {extractedItems.length > 0 && result?.summary?.task_id && (
            <div className="mb-6 flex flex-col sm:flex-row sm:justify-end gap-3">
              <button
                onClick={() => sendTaskToPhases(result.summary.task_id)}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 justify-center w-full sm:w-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span>Send to Phases Page</span>
              </button>
            </div>
          )}

          {/* Extracted Items Table */}
          {extractedItems.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                Extracted Posts Data
              </h3>
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">#</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">User ID</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Username</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Verified</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Likes</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Comments</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {extractedItems.map((item, index) => {
                      const isAnimating = animatedRows.includes(index);
                      return (
                        <tr 
                          key={item.item_index} 
                          className={`hover:bg-slate-50 dark:hover:bg-slate-700 transition-all ${
                            isAnimating ? 'row-appear' : ''
                          }`}
                        >
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
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
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.is_verified
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {item.is_verified ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                            <span className="font-mono">{item.likes_count.toLocaleString()}</span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                            <span className="font-mono">{item.comments_count.toLocaleString()}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="space-y-3 md:hidden">
                {extractedItems.map((item, index) => {
                  const isAnimating = animatedRows.includes(index);
                  return (
                    <div
                      key={item.item_index}
                      className={`border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800 shadow-sm ${
                        isAnimating ? 'row-appear' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">#{item.item_index}</div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.is_verified
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {item.is_verified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs uppercase text-slate-500 dark:text-slate-400">User</span>
                          <span className="font-mono text-slate-800 dark:text-slate-100">{item.user_id}</span>
                          <span className="text-slate-700 dark:text-slate-200">@{item.username}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs uppercase text-slate-500 dark:text-slate-400">Full Name</span>
                          <span className="text-sm text-slate-800 dark:text-slate-100 break-words">{item.full_name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-xs uppercase text-slate-500 dark:text-slate-400">Likes</span>
                            <div className="font-mono text-slate-800 dark:text-slate-100">{item.likes_count.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-xs uppercase text-slate-500 dark:text-slate-400">Comments</span>
                            <div className="font-mono text-slate-800 dark:text-slate-100">{item.comments_count.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

