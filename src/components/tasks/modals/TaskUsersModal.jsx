import React from 'react';
import { X, Users, Hash, Mail, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import AdvancedDataTable from '../../AdvancedDataTable';

/**
 * Task Users Modal Component
 * Displays users for a specific task
 * 
 * @param {Object} props
 * @param {Object} props.modals - Modals controller
 * @param {Object} props.users - Users controller
 * @param {Object} props.columns - Column controller
 */
export default function TaskUsersModal({ modals, users, columns }) {
  const {
    showTaskUsersModal,
    closeTaskUsersModal,
    taskUsersIsTenantWide,
    taskUsersTaskId,
    taskUsersTaskHashtag,
    handleSendToCampaign,
    handleSendTenantUsersToCampaign,
    selectedMediafyConfig,
    orderedAiModels
  } = modals;

  const {
    taskUsers,
    taskUsersLoading,
    taskUsersTotalCount,
    taskUsersWithEmailCount,
    taskUsersFilterByEmail,
    setTaskUsersFilterByEmail,
    taskUsersCurrentPage,
    taskUsersPageNextKeys,
    handlePrevTaskUsersPage,
    handleNextTaskUsersPage,
    tenantUsersTotalCount
  } = users;

  // Compute pagination flags
  const taskUsersHasNextPage = Boolean(taskUsersPageNextKeys[taskUsersCurrentPage - 1]);
  const taskUsersHasPrevPage = taskUsersCurrentPage > 1;

  // Use taskUsers directly (sortedTaskUsers was just taskUsers in the refactored version)
  const sortedTaskUsers = taskUsers;

  const { usersWithEmailsColumns } = columns;

  if (!showTaskUsersModal) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-6"
      onClick={closeTaskUsersModal}
    >
      <div
        className="relative w-full"
        style={{ width: '90vw', height: '90vh', maxWidth: '1600px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden">
          <div className="flex flex-col gap-4 px-8 py-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50/70 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
              <div className="flex items-center gap-3 flex-1 min-w-0 overflow-x-auto pb-1 lg:pb-0">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-100 text-indigo-600 dark:text-indigo-300 text-xs font-semibold tracking-wide uppercase flex-shrink-0">
                  {taskUsersIsTenantWide ? (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Users with Emails</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      <span>Task Users</span>
                    </>
                  )}
                </div>
                {!taskUsersIsTenantWide && taskUsersTaskId && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap flex-shrink-0">
                    <Hash className="w-4 h-4 text-indigo-500" />
                    <span>
                      Task name ={' '}
                      <span className="text-slate-900 dark:text-slate-100">
                        {taskUsersTaskHashtag ? `#${taskUsersTaskHashtag}` : taskUsersTaskId.substring(0, 12)}
                      </span>
                    </span>
                  </div>
                )}
                {taskUsersIsTenantWide ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap flex-shrink-0">
                    <Mail className="w-4 h-4 text-green-500" />
                    <span>
                      total users with emails ={' '}
                      <span className="text-green-600 dark:text-green-400">
                        {taskUsersTotalCount !== null ? taskUsersTotalCount.toLocaleString() : '-'}
                      </span>
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap flex-shrink-0">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span>
                      users in task ={' '}
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {taskUsersTotalCount !== null ? taskUsersTotalCount.toLocaleString() : '-'}
                      </span>
                    </span>
                  </div>
                )}
                {!taskUsersIsTenantWide && (
                  <button
                    type="button"
                    onClick={() => setTaskUsersFilterByEmail((prev) => !prev)}
                    disabled={taskUsersLoading}
                    aria-pressed={taskUsersFilterByEmail}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap border flex-shrink-0 ${
                      taskUsersFilterByEmail
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow shadow-indigo-600/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                    title="Toggle only users with email"
                  >
                    <Mail className={`w-4 h-4 ${taskUsersFilterByEmail ? 'text-white' : 'text-green-500'}`} />
                    <span>
                      users with email ={' '}
                      <span className={taskUsersFilterByEmail ? 'text-white' : 'text-green-600 dark:text-green-400'}>
                        {taskUsersWithEmailCount !== null ? taskUsersWithEmailCount.toLocaleString() : '-'}
                      </span>
                    </span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!taskUsersIsTenantWide && taskUsersTaskId && (
                  <button
                    type="button"
                    onClick={() => handleSendToCampaign(taskUsersTaskId, orderedAiModels || [])}
                    disabled={taskUsersLoading || taskUsers.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send to Campaign</span>
                  </button>
                )}
                {taskUsersIsTenantWide && (
                  <button
                    type="button"
                    onClick={() => handleSendTenantUsersToCampaign(taskUsersTotalCount || tenantUsersTotalCount || taskUsers.length, orderedAiModels || [])}
                    disabled={taskUsersLoading || taskUsers.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send to Campaign</span>
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevTaskUsersPage}
                    disabled={!taskUsersHasPrevPage || taskUsersLoading}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[3rem] text-center">Page {taskUsersCurrentPage}</span>
                  <button
                    type="button"
                    onClick={handleNextTaskUsersPage}
                    disabled={!taskUsersHasNextPage || taskUsersLoading}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Next page"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={closeTaskUsersModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 flex-shrink-0"
              >
                <span className="sr-only">Close modal</span>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden px-6 py-4 bg-gradient-to-b from-white via-white/90 to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
            <AdvancedDataTable
              key={`task-users-${selectedMediafyConfig ? selectedMediafyConfig.id : 'legacy'}`}
              columns={usersWithEmailsColumns}
              data={sortedTaskUsers}
              loading={taskUsersLoading}
              emptyMessage={taskUsersIsTenantWide 
                ? "No users with public emails found for this tenant."
                : "No users found for this task."}
              density="compact"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

