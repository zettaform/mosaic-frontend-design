import React, { useState } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDownIcon, PencilSquareIcon, TrashIcon, KeyIcon, UserCircleIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import apiUserService from '../../services/apiUserService';
import s3AvatarService from '../../services/s3AvatarService';
import EditUserModal from './EditUserModal';

function UsersTable({ rows, onRefresh, isAdmin = false, sortConfig, onSort }) {
  const [resettingPassword, setResettingPassword] = useState(null);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const handleResetPassword = async (userId, userEmail) => {
    setResettingPassword(userId);
    setResetMessage('');
    setResetError('');

    try {
      // Request password reset
      const result = await apiUserService.requestPasswordReset(userEmail);
      
      if (result.success) {
        setResetMessage(`Password reset link sent to ${userEmail}. Reset token: ${result.resetToken}`);
      } else {
        setResetError(result.error || 'Failed to send reset link');
      }
    } catch (error) {
      setResetError('Failed to send reset link');
    } finally {
      setResettingPassword(null);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditModalOpen(true);
  };

  const handleStatusChange = async (userId, newStatus) => {
    if (!isAdmin) {
      alert('Only administrators can change user status');
      return;
    }

    const action = newStatus === 'active' ? 'activate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    setUpdatingStatus(userId);
    try {
      const result = await apiUserService.updateUser(userId, { status: newStatus });
      if (result.success) {
        onRefresh();
        alert(`User ${action}d successfully`);
      } else {
        alert('Failed to update user status: ' + result.error);
      }
    } catch (error) {
      alert('Failed to update user status: ' + error.message);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const result = await apiUserService.deleteUser(userId);
        if (result.success) {
          onRefresh();
        } else {
          alert('Failed to delete user: ' + result.error);
        }
      } catch (error) {
        alert('Failed to delete user: ' + error.message);
      }
    }
  };

  // Sortable column header component
  const SortableHeader = ({ columnKey, children, sortable = true }) => {
    if (!sortable || !onSort) {
      return (
        <div className="font-semibold text-left">{children}</div>
      );
    }

    const isSorted = sortConfig?.key === columnKey;
    const sortDirection = isSorted ? sortConfig.direction : null;

    return (
      <button
        onClick={() => onSort(columnKey)}
        className="font-semibold text-left hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center group"
      >
        {children}
        <div className="ml-1 flex flex-col">
          <svg 
            className={`w-3 h-3 ${sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} ${isSorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <svg 
            className={`w-3 h-3 ${sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} ${isSorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </button>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: {
        icon: CheckCircleIcon,
        text: 'Active',
        className:
          'inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20'
      },
      inactive: {
        icon: XCircleIcon,
        text: 'Inactive',
        className:
          'inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/10 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/20'
      },
      suspended: {
        icon: ExclamationTriangleIcon,
        text: 'Suspended',
        className:
          'inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20'
      },
      pending: {
        icon: ClockIcon,
        text: 'Pending',
        className:
          'inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20'
      },
      blocked: {
        icon: XCircleIcon,
        text: 'Blocked',
        className:
          'inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20'
      }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    const Icon = config.icon;
    
    return (
      <span className={config.className}>
        <Icon className="h-3 w-3" />
        {config.text}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: {
        icon: UserCircleIcon,
        text: 'Admin',
        className:
          'inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-300 dark:ring-purple-500/20'
      },
      manager: {
        icon: UserCircleIcon,
        text: 'Manager',
        className:
          'inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20'
      },
      user: {
        icon: UserCircleIcon,
        text: 'User',
        className:
          'inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/10 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/20'
      }
    };
    
    const config = roleConfig[role] || roleConfig.user;
    const Icon = config.icon;
    
    return (
      <span className={config.className}>
        <Icon className="h-3 w-3" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-slate-800 shadow-sm rounded-sm border border-slate-200 dark:border-slate-700">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table-auto w-full">
          <thead className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <SortableHeader columnKey="name">User</SortableHeader>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <SortableHeader columnKey="role">Role</SortableHeader>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <SortableHeader columnKey="status">Status</SortableHeader>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <SortableHeader columnKey="created_at">Created</SortableHeader>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <SortableHeader columnKey="updated_at">Updated</SortableHeader>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <SortableHeader columnKey="last_login">Last Login</SortableHeader>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <div className="font-semibold text-left">Actions</div>
              </th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-200 dark:divide-slate-700">
            {rows && rows.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full mr-3 ring-1 ring-slate-200 dark:ring-slate-700">
                      <img 
                        className="w-10 h-10 rounded-full object-cover" 
                        src={user.image} 
                        alt={`${user.name} avatar`}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/fallback-avatar.svg';
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-900 dark:text-slate-100 truncate">{user.name}</div>
                      <div className="text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  {getRoleBadge(user.role)}
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  {getStatusBadge(user.status)}
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="text-slate-600 dark:text-slate-300 font-mono text-xs">{formatDate(user.created_at)}</div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="text-slate-600 dark:text-slate-300 font-mono text-xs">{formatDate(user.updated_at)}</div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="text-slate-600 dark:text-slate-300 font-mono text-xs">{formatDate(user.last_login)}</div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="flex items-center justify-end">
                    {/* Professional Actions Menu */}
                    <Menu as="div" className="relative inline-block">
                      <MenuButton className="btn-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 inline-flex items-center gap-2">
                        Actions
                        <ChevronDownIcon aria-hidden="true" className="-mr-1 h-4 w-4 text-slate-400 dark:text-slate-500" />
                      </MenuButton>

                      <MenuItems
                        transition
                        className="absolute right-0 z-10 mt-2 w-60 origin-top-right divide-y divide-slate-200 dark:divide-slate-700 rounded-md bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none"
                      >
                        <div className="py-1">
                          <MenuItem>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="group flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/40"
                            >
                              <PencilSquareIcon className="mr-3 h-4 w-4 text-slate-400" />
                              Edit User
                            </button>
                          </MenuItem>
                          <MenuItem>
                            <button
                              onClick={() => handleResetPassword(user.id, user.email)}
                              disabled={resettingPassword === user.id}
                              className="group flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/40 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {resettingPassword === user.id ? (
                                <div className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent dark:border-slate-500" />
                              ) : (
                                <KeyIcon className="mr-3 h-4 w-4 text-slate-400" />
                              )}
                              Reset Password
                            </button>
                          </MenuItem>
                        </div>
                        
                        {isAdmin && (
                          <div className="py-1">
                            <div className="px-4 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide">
                              Status Management
                            </div>
                            {['active', 'inactive', 'suspended', 'pending', 'blocked'].map((status) => (
                              <MenuItem key={status}>
                                <button
                                  onClick={() => handleStatusChange(user.id, status)}
                                  disabled={updatingStatus === user.id || user.status === status}
                                  className={`group flex w-full items-center px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/40 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    user.status === status
                                      ? 'text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/10'
                                      : 'text-slate-700 dark:text-slate-200'
                                  }`}
                                >
                                  {updatingStatus === user.id && user.status === status ? (
                                    <div className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                                  ) : user.status === status ? (
                                    <CheckCircleIcon className="mr-3 h-4 w-4 text-indigo-400" />
                                  ) : (
                                    <div className="mr-3 h-4 w-4" />
                                  )}
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                              </MenuItem>
                            ))}
                          </div>
                        )}
                        
                        <div className="py-1">
                          <MenuItem>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="group flex w-full items-center px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                            >
                              <TrashIcon className="mr-3 h-4 w-4" />
                              Delete User
                            </button>
                          </MenuItem>
                        </div>
                      </MenuItems>
                    </Menu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reset Password Messages */}
      {resetMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-sm">
          <div className="text-sm text-emerald-600 dark:text-emerald-400">
            {resetMessage}
          </div>
          <button
            className="text-xs text-emerald-500 hover:text-emerald-600 mt-2"
            onClick={() => setResetMessage('')}
          >
            Dismiss
          </button>
        </div>
      )}

      {resetError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-sm">
          <div className="text-sm text-rose-600 dark:text-rose-400">
            {resetError}
          </div>
          <button
            className="text-xs text-rose-500 hover:text-rose-600 mt-2"
            onClick={() => setResetError('')}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Empty State */}
      {(!rows || rows.length === 0) && (
        <div className="text-center py-8">
          <div className="text-slate-500 dark:text-slate-400">No users found</div>
          <div className="text-sm text-slate-400 dark:text-slate-500 mt-1">Add your first user to get started</div>
        </div>
      )}

      {/* Edit User Modal */}
      <EditUserModal
        open={editModalOpen}
        setOpen={setEditModalOpen}
        user={editingUser}
        onUpdated={onRefresh}
      />
    </div>
  );
}

export default UsersTable;
