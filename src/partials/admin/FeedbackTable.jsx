import React, { useState, useEffect } from 'react';
import FeedbackTableItem from './FeedbackTableItem';
import adminApiService from '../../services/adminApiService';

function FeedbackTable({ selectedItems }) {
  const [selectAll, setSelectAll] = useState(false);
  const [isCheck, setIsCheck] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [storageInfo, setStorageInfo] = useState(null);

  useEffect(() => {
    fetchFeedback();
    // eslint-disable-next-line
  }, []);


  const fetchFeedback = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const result = await adminApiService.getFeedback();
      
      if (result.success) {
        if (result.storage?.tableName) {
          setStorageInfo(result.storage);
        } else {
          setStorageInfo(null);
        }
        // Transform backend data to match frontend format
        const transformedFeedback = result.feedback.map(fb => ({
          id: fb.feedbackId || fb.feedback_id,
          user_id: fb.userId || fb.user_id || 'Anonymous',
          username: fb.username || 'Anonymous',
          email: fb.email || 'No email',
          first_name: fb.first_name || 'Unknown',
          last_name: fb.last_name || 'User',
          full_name: `${fb.first_name || 'Unknown'} ${fb.last_name || 'User'}`.trim(),
          role: fb.role || 'user',
          rating: fb.rating || 0,
          message: fb.message || fb.comment || fb.description || fb.title || 'No message',
          timestamp: fb.createdAt || fb.created_at || fb.updated_at,
          status: fb.status || 'active',
          category: fb.category || 'general'
        }));
        setFeedbackList(transformedFeedback);
      } else {
        throw new Error(result.error || 'Failed to fetch feedback');
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setError(`Failed to load feedback: ${error.message || 'Please check your connection.'}`);
      setFeedbackList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchFeedback(true);
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    setIsCheck(feedbackList.map(item => item.id));
    if (selectAll) {
      setIsCheck([]);
    }
  };

  const handleClick = e => {
    const { id, checked } = e.target;
    setSelectAll(false);
    setIsCheck([...isCheck, id]);
    if (!checked) {
      setIsCheck(isCheck.filter(item => item !== id));
    }
  };

  useEffect(() => {
    selectedItems(isCheck);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheck]);

  const formatDate = (timestamp) => {
    try {
      // Handle both ISO string and epoch timestamp formats
      let date;
      if (typeof timestamp === 'string' && timestamp.includes('T')) {
        // ISO string format
        date = new Date(timestamp);
      } else if (typeof timestamp === 'number' || (typeof timestamp === 'string' && !isNaN(Number(timestamp)))) {
        // Epoch timestamp (milliseconds)
        date = new Date(Number(timestamp));
      } else {
        // Fallback
        date = new Date(timestamp);
      }
      
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'timestamp:', timestamp);
      return 'Invalid date';
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700 relative">
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-500 dark:text-slate-400">Loading feedback...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700 relative">
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-red-500 text-center mb-4">{error}</div>
          <button
            onClick={() => fetchFeedback()}
            disabled={loading}
            className="btn bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700 relative">
      <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
              All Feedback <span className="text-slate-400 dark:text-slate-500 font-medium">{feedbackList.length}</span>
            </h2>
            {storageInfo?.tableName && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Azure Table Storage: <span className="font-mono">{storageInfo.tableName}</span>
                {storageInfo.partitionKey ? (
                  <span className="ml-2">(partition: {storageInfo.partitionKey})</span>
                ) : null}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="btn-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refreshing ? (
                <>
                  <svg className="w-4 h-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
      </header>
      <div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full dark:text-slate-300">
            {/* Table header */}
            <thead className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20 border-t border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
                  <div className="flex items-center">
                    <label className="inline-flex">
                      <span className="sr-only">Select all</span>
                      <input className="form-checkbox" type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                    </label>
                  </div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">User</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Email</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Role</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Rating</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Message</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Date</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <span className="sr-only">Menu</span>
                </th>
              </tr>
            </thead>
            {/* Table body */}
            <tbody className="text-sm divide-y divide-slate-200 dark:divide-slate-700">
              {feedbackList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-2 first:pl-5 last:pr-5 py-8 text-center text-slate-500 dark:text-slate-400">
                    No feedback submitted yet
                  </td>
                </tr>
              ) : (
                feedbackList.map(feedback => (
                  <FeedbackTableItem
                    key={feedback.id}
                    id={feedback.id}
                    full_name={feedback.full_name}
                    email={feedback.email}
                    role={feedback.role}
                    rating={feedback.rating}
                    message={feedback.message}
                    timestamp={feedback.timestamp}
                    handleClick={handleClick}
                    isChecked={isCheck.includes(feedback.id)}
                    formatDate={formatDate}
                    renderStars={renderStars}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default FeedbackTable;
