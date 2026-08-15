import React, { useEffect, useMemo, useState } from 'react';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Label } from '@headlessui/react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDownIcon, EllipsisVerticalIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid';

import { Navigate, useLocation } from 'react-router-dom';

import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import UsersTable from '../../partials/users/UsersTable';
import AddUserModal from '../../partials/users/AddUserModal';
import EditUserModal from '../../partials/users/EditUserModal';

import { useAuth } from '../../contexts/AuthContext';
import apiUserService from '../../services/apiUserService';
import s3AvatarService from '../../services/s3AvatarService';
import rbacTemplateService from '../../services/rbacTemplateService';
import { findMatchingTemplate } from '../../utils/rbacTemplateMatcher';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';

const formatShortDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return '—';
  }
};

const LoadingSpinner = ({ label = 'Loading…' }) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500 dark:border-slate-700 dark:border-t-indigo-400" />
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  </div>
);

const Badge = ({ className = '', children, title }) => (
  <span title={title} className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${className}`}>
    {children}
  </span>
);

const StatusBadge = ({ status }) => {
  const config = {
    active: {
      dot: 'bg-emerald-500',
      cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
      label: 'Active',
    },
    inactive: {
      dot: 'bg-slate-400',
      cls: 'bg-slate-50 text-slate-700 ring-slate-600/10 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/20',
      label: 'Inactive',
    },
    suspended: {
      dot: 'bg-amber-500',
      cls: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
      label: 'Suspended',
    },
    pending: {
      dot: 'bg-blue-500',
      cls: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20',
      label: 'Pending',
    },
    blocked: {
      dot: 'bg-rose-500',
      cls: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
      label: 'Blocked',
    },
  }[status] || {
    dot: 'bg-slate-400',
    cls: 'bg-slate-50 text-slate-700 ring-slate-600/10 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/20',
    label: status || 'Unknown',
  };

  return (
    <Badge className={config.cls}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      {config.label}
    </Badge>
  );
};

const RoleBadge = ({ role }) => {
  const label = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
  return (
    <Badge className="bg-slate-50 text-slate-700 ring-slate-600/10 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/20">
      {label}
    </Badge>
  );
};

const RBACTemplateBadge = ({ template, isManual }) => {
  if (isManual) {
    return (
      <Badge
        className="bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20"
        title="Custom permissions not defined in an RBAC template"
      >
        Manual
      </Badge>
    );
  }

  if (!template) return null;

  return (
    <Badge
      className="bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20"
      title={`RBAC Template: ${template.name}${template.description ? ` — ${template.description}` : ''}`}
    >
      {template.name}
    </Badge>
  );
};

const CustomerCard = ({ customer, onEdit, onSuspend, onActivate, onDelete, matchingTemplate, isManualConfig }) => {
  const isActive = customer.status === 'active';

  return (
    <div className="bg-white dark:bg-slate-800 shadow-sm rounded-sm border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full ring-1 ring-slate-200 dark:ring-slate-700 shrink-0">
              <img
                className="h-10 w-10 rounded-full object-cover"
                src={customer.image}
                alt={`${customer.name} avatar`}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/fallback-avatar.svg';
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-slate-800 dark:text-slate-100 truncate">{customer.name}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 truncate">{customer.email}</div>
            </div>
          </div>

          <Menu as="div" className="relative shrink-0">
            <MenuButton
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="User actions"
            >
              <EllipsisVerticalIcon className="h-5 w-5" />
            </MenuButton>
            <MenuItems className="absolute right-0 z-10 mt-2 w-52 origin-top-right rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg focus:outline-none">
              <div className="py-1">
                <MenuItem>
                  <button
                    onClick={() => onEdit(customer.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/40"
                  >
                    <PencilSquareIcon className="h-4 w-4 text-slate-400" />
                    Edit
                  </button>
                </MenuItem>
                <MenuItem>
                  <button
                    onClick={() => (isActive ? onSuspend(customer.id) : onActivate(customer.id))}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/40"
                  >
                    <span className="h-4 w-4" aria-hidden="true" />
                    {isActive ? 'Suspend' : 'Activate'}
                  </button>
                </MenuItem>
              </div>
              <div className="py-1 border-t border-slate-200 dark:border-slate-700">
                <MenuItem>
                  <button
                    onClick={() => onDelete(customer.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <RoleBadge role={customer.role} />
          <StatusBadge status={customer.status} />
          <RBACTemplateBadge template={matchingTemplate} isManual={isManualConfig} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Created</dt>
            <dd className="mt-1 text-sm text-slate-800 dark:text-slate-100 tabular-nums">{formatShortDate(customer.created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Last login</dt>
            <dd className="mt-1 text-sm text-slate-800 dark:text-slate-100 tabular-nums">
              {customer.last_login ? formatShortDate(customer.last_login) : 'Never'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

function Customers() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [creating, setCreating] = useState(false);
  const [adminKey, setAdminKey] = useState('');

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Filtering + pagination
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState({ start: null, end: null });
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [filteredRows, setFilteredRows] = useState(null);

  // Combobox query state
  const [statusQuery, setStatusQuery] = useState('');
  const [roleQuery, setRoleQuery] = useState('');
  const [rowsQuery, setRowsQuery] = useState('');

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // RBAC templates
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  // Auth/RBAC gating
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500 dark:border-slate-700 dark:border-t-indigo-400" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  const routeInfo = ROUTE_TO_SECTION[currentPath];
  if (routeInfo) {
    const { section, page } = routeInfo;
    if (!hasAccess(user, section, page)) {
      console.log(
        `❌ Access denied: User ${user.email || user.user_id} (role: ${user.role}) attempted to access ${currentPath} (${section}/${page})`
      );
      return <Navigate to="/unauthorized" replace />;
    }
  } else {
    console.log(`❌ Access denied: Route ${currentPath} is not in ROUTE_TO_SECTION`);
    return <Navigate to="/unauthorized" replace />;
  }

  const stats = useMemo(() => {
    if (!rows) return { total: 0, active: 0, suspended: 0, newThisMonth: 0 };
    const total = rows.length;
    const active = rows.filter((c) => c.status === 'active').length;
    const suspended = rows.filter((c) => c.status === 'suspended').length;
    const newThisMonth = rows.filter((c) => {
      const created = new Date(c.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
    return { total, active, suspended, newThisMonth };
  }, [rows]);

  const statusOptions = [
    { id: 'all', name: 'All statuses' },
    { id: 'active', name: 'Active' },
    { id: 'inactive', name: 'Inactive' },
    { id: 'suspended', name: 'Suspended' },
    { id: 'pending', name: 'Pending' },
    { id: 'blocked', name: 'Blocked' },
  ];

  const roleOptions = [
    { id: 'all', name: 'All roles' },
    { id: 'admin', name: 'Admin' },
    { id: 'user', name: 'User' },
    { id: 'manager', name: 'Manager' },
  ];

  const rowsPerPageOptions = [
    { id: 10, name: '10' },
    { id: 25, name: '25' },
    { id: 50, name: '50' },
    { id: 100, name: '100' },
  ];

  const getFilteredStatusOptions = () =>
    statusQuery === ''
      ? statusOptions
      : statusOptions.filter((o) => o.name.toLowerCase().includes(statusQuery.toLowerCase()));

  const getFilteredRoleOptions = () =>
    roleQuery === '' ? roleOptions : roleOptions.filter((o) => o.name.toLowerCase().includes(roleQuery.toLowerCase()));

  const getFilteredRowsOptions = () =>
    rowsQuery === '' ? rowsPerPageOptions : rowsPerPageOptions.filter((o) => o.name.toLowerCase().includes(rowsQuery.toLowerCase()));

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortData = (data) => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'name') {
        aValue = a.name || '';
        bValue = b.name || '';
      }

      if (sortConfig.key.includes('_at') || sortConfig.key.includes('login')) {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const applyFilters = (data) => {
    if (!data) return [];
    let filtered = data;

    if (statusFilter !== 'all') filtered = filtered.filter((u) => u.status === statusFilter);

    if (roleFilter !== 'all') {
      if (roleFilter === 'admin') filtered = filtered.filter((u) => u.role === 'admin');
      else if (roleFilter === 'user') filtered = filtered.filter((u) => u.role === 'user');
      else filtered = filtered.filter((u) => u.role === roleFilter);
    }

    if (dateFilter.start || dateFilter.end) {
      filtered = filtered.filter((u) => {
        const userDate = new Date(u.created_at);
        const start = dateFilter.start ? new Date(dateFilter.start) : null;
        const end = dateFilter.end ? new Date(dateFilter.end) : null;
        if (start && end) return userDate >= start && userDate <= end;
        if (start) return userDate >= start;
        if (end) return userDate <= end;
        return true;
      });
    }

    return filtered;
  };

  const paginateData = (data, page, perPage) => {
    const startIndex = (page - 1) * perPage;
    return data.slice(startIndex, startIndex + perPage);
  };

  const processData = () => {
    if (!rows) return;
    const filtered = applyFilters(rows);
    const sorted = sortData(filtered);
    const paginated = paginateData(sorted, currentPage, rowsPerPage);
    setFilteredRows(paginated);
    setTotalCustomers(filtered.length);
  };

  useEffect(() => {
    processData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, statusFilter, roleFilter, dateFilter, sortConfig, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, roleFilter, dateFilter, rowsPerPage]);

  const refreshUsers = async () => {
    setLoading(true);
    try {
      const result = await apiUserService.listUsers();
      if (result.success) {
        const mapped = result.users.map((u) => {
          const fallbackAvatar = s3AvatarService.getAvatarByName('goku');

          const firstName = u.first_name || '';
          const lastName = u.last_name || '';
          let displayName = '';
          if (firstName || lastName) displayName = `${firstName} ${lastName}`.trim();
          else if (u.username) displayName = u.username;
          else if (u.email) displayName = u.email.split('@')[0];
          else displayName = `User ${u.user_id}`;

          return {
            id: u.user_id,
            image: u.avatar_url || u.avatar || fallbackAvatar.url,
            name: displayName,
            first_name: u.first_name || firstName,
            last_name: u.last_name || lastName,
            email: u.email || '',
            role: u.role || 'user',
            status: u.status || 'active',
            created_at: u.created_at || null,
            updated_at: u.updated_at || null,
            last_login: u.last_login || null,
            permissions: u.permissions || {},
            avatar: u.avatar || '',
            avatar_url: u.avatar_url || u.avatar || '',
            fav: false,
          };
        });
        setRows(mapped);
      } else {
        console.error('Failed to load users:', result.error);
        setRows([]);
      }
    } catch (e) {
      console.error('Failed to load users', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const result = await rbacTemplateService.listTemplates();
        if (result.success) setTemplates(result.templates || []);
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setLoadingTemplates(false);
      }
    };
    loadTemplates();
  }, []);

  useEffect(() => {
    refreshUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCreateUser = async (payload) => {
    setCreating(true);
    try {
      const result = await apiUserService.createUser(payload);
      if (result.success) {
        setAddOpen(false);
        await refreshUsers();
      } else {
        console.error('Failed to create user:', result.error);
      }
    } catch (e) {
      console.error('Failed to create user', e);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateExternalUser = async (payload) => {
    setCreating(true);
    try {
      const result = await apiUserService.createExternalUser(payload, adminKey);
      if (result.success) {
        setAddOpen(false);
        await refreshUsers();
      } else {
        console.error('Failed to create external user:', result.error);
      }
    } catch (e) {
      console.error('Failed to create external user', e);
    } finally {
      setCreating(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      if (action === 'edit') {
        const userToEdit = rows?.find((u) => u.id === userId);
        if (userToEdit) {
          setEditingUser(userToEdit);
          setEditOpen(true);
        } else {
          console.error(`User ${userId} not found`);
        }
        return;
      }

      setLoading(true);
      switch (action) {
        case 'suspend': {
          const suspendResult = await apiUserService.updateUserStatus(userId, 'suspended');
          if (suspendResult.success) await refreshUsers();
          else console.error('Failed to suspend user:', suspendResult.error);
          break;
        }
        case 'activate': {
          const activateResult = await apiUserService.updateUserStatus(userId, 'active');
          if (activateResult.success) await refreshUsers();
          else console.error('Failed to activate user:', activateResult.error);
          break;
        }
        case 'delete': {
          if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            const deleteResult = await apiUserService.deleteUser(userId);
            if (deleteResult.success) await refreshUsers();
            else console.error('Failed to delete user:', deleteResult.error);
          }
          break;
        }
        default:
          console.warn(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error(`Error performing ${action} on user ${userId}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setRoleFilter('all');
    setDateFilter({ start: null, end: null });
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalCustomers / rowsPerPage));
  const rangeStart = totalCustomers === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const rangeEnd = Math.min(currentPage * rowsPerPage, totalCustomers);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            {/* Header */}
            <div className="sm:flex sm:justify-between sm:items-start mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">Users</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage accounts, roles, and access controls.</p>
              </div>

              <div className="grid grid-flow-row sm:grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                <div className="inline-flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`btn rounded-r-none border ${
                      viewMode === 'grid'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`btn rounded-l-none border -ml-px ${
                      viewMode === 'table'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    Table
                  </button>
                </div>

                <button className="btn bg-indigo-500 hover:bg-indigo-600 text-white" onClick={() => setAddOpen(true)}>
                  Add user
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-sm border border-slate-200 dark:border-slate-700 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-700">
                <div className="p-4">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100 tabular-nums">{stats.total}</div>
                </div>
                <div className="p-4">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Active</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100 tabular-nums">{stats.active}</div>
                </div>
                <div className="p-4">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Suspended</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100 tabular-nums">{stats.suspended}</div>
                </div>
                <div className="p-4">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">New this month</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100 tabular-nums">{stats.newThisMonth}</div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-sm border border-slate-200 dark:border-slate-700 mb-6">
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div>
                    <Combobox
                      as="div"
                      value={statusOptions.find((o) => o.id === statusFilter) || statusOptions[0]}
                      onChange={(option) => {
                        setStatusFilter(option.id);
                        setStatusQuery('');
                      }}
                    >
                      <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</Label>
                      <div className="relative mt-2">
                        <ComboboxInput
                          className="block w-full rounded-md bg-white dark:bg-slate-700 py-1.5 pr-12 pl-3 text-base text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm/6"
                          onChange={(event) => setStatusQuery(event.target.value)}
                          onBlur={() => setStatusQuery('')}
                          displayValue={(option) => option?.name}
                        />
                        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-hidden">
                          <ChevronDownIcon className="size-5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                        </ComboboxButton>

                        <ComboboxOptions
                          transition
                          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1 text-base data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm"
                        >
                          {getFilteredStatusOptions().map((option) => (
                            <ComboboxOption
                              key={option.id}
                              value={option}
                              className="cursor-default px-3 py-2 text-slate-700 dark:text-slate-300 select-none data-focus:bg-indigo-500 data-focus:text-white data-focus:outline-hidden hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              <span className="block truncate">{option.name}</span>
                            </ComboboxOption>
                          ))}
                        </ComboboxOptions>
                      </div>
                    </Combobox>
                  </div>

                  <div>
                    <Combobox
                      as="div"
                      value={roleOptions.find((o) => o.id === roleFilter) || roleOptions[0]}
                      onChange={(option) => {
                        setRoleFilter(option.id);
                        setRoleQuery('');
                      }}
                    >
                      <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Role</Label>
                      <div className="relative mt-2">
                        <ComboboxInput
                          className="block w-full rounded-md bg-white dark:bg-slate-700 py-1.5 pr-12 pl-3 text-base text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm/6"
                          onChange={(event) => setRoleQuery(event.target.value)}
                          onBlur={() => setRoleQuery('')}
                          displayValue={(option) => option?.name}
                        />
                        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-hidden">
                          <ChevronDownIcon className="size-5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                        </ComboboxButton>

                        <ComboboxOptions
                          transition
                          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1 text-base data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm"
                        >
                          {getFilteredRoleOptions().map((option) => (
                            <ComboboxOption
                              key={option.id}
                              value={option}
                              className="cursor-default px-3 py-2 text-slate-700 dark:text-slate-300 select-none data-focus:bg-indigo-500 data-focus:text-white data-focus:outline-hidden hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              <span className="block truncate">{option.name}</span>
                            </ComboboxOption>
                          ))}
                        </ComboboxOptions>
                      </div>
                    </Combobox>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Created date</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={dateFilter.start || ''}
                        onChange={(e) => setDateFilter((prev) => ({ ...prev, start: e.target.value }))}
                        className="form-input w-full"
                      />
                      <input
                        type="date"
                        value={dateFilter.end || ''}
                        onChange={(e) => setDateFilter((prev) => ({ ...prev, end: e.target.value }))}
                        className="form-input w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <Combobox
                      as="div"
                      value={rowsPerPageOptions.find((o) => o.id === rowsPerPage) || rowsPerPageOptions[1]}
                      onChange={(option) => {
                        setRowsPerPage(option.id);
                        setRowsQuery('');
                      }}
                    >
                      <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rows</Label>
                      <div className="relative mt-2">
                        <ComboboxInput
                          className="block w-full rounded-md bg-white dark:bg-slate-700 py-1.5 pr-12 pl-3 text-base text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm/6"
                          onChange={(event) => setRowsQuery(event.target.value)}
                          onBlur={() => setRowsQuery('')}
                          displayValue={(option) => option?.name}
                        />
                        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-hidden">
                          <ChevronDownIcon className="size-5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                        </ComboboxButton>

                        <ComboboxOptions
                          transition
                          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1 text-base data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm"
                        >
                          {getFilteredRowsOptions().map((option) => (
                            <ComboboxOption
                              key={option.id}
                              value={option}
                              className="cursor-default px-3 py-2 text-slate-700 dark:text-slate-300 select-none data-focus:bg-indigo-500 data-focus:text-white data-focus:outline-hidden hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              <span className="block truncate">{option.name}</span>
                            </ComboboxOption>
                          ))}
                        </ComboboxOptions>
                      </div>
                    </Combobox>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {totalCustomers > 0 ? (
                      <>
                        Showing <span className="font-medium text-slate-700 dark:text-slate-200">{rangeStart}–{rangeEnd}</span> of{' '}
                        <span className="font-medium text-slate-700 dark:text-slate-200">{totalCustomers}</span>
                      </>
                    ) : (
                      <>No users match the current filters</>
                    )}
                    {loadingTemplates ? <span className="ml-2 text-xs text-slate-400">Loading RBAC templates…</span> : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearFilters}
                      className="btn-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200"
                    >
                      Clear
                    </button>
                    <button
                      onClick={refreshUsers}
                      className="btn-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <LoadingSpinner label="Loading users…" />
            ) : (filteredRows || rows || []).length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No users found</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Add a user to get started.</p>
                <button onClick={() => setAddOpen(true)} className="btn bg-indigo-500 hover:bg-indigo-600 text-white">
                  Add user
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {(filteredRows || rows || []).map((customer) => {
                  const matchingTemplate = findMatchingTemplate(customer.permissions, templates);
                  const isManualConfig = !matchingTemplate && customer.permissions && Object.keys(customer.permissions).length > 0;
                  return (
                    <CustomerCard
                      key={customer.id}
                      customer={customer}
                      onEdit={(id) => handleUserAction(id, 'edit')}
                      onSuspend={(id) => handleUserAction(id, 'suspend')}
                      onActivate={(id) => handleUserAction(id, 'activate')}
                      onDelete={(id) => handleUserAction(id, 'delete')}
                      matchingTemplate={matchingTemplate}
                      isManualConfig={isManualConfig}
                    />
                  );
                })}
              </div>
            ) : (
              <UsersTable
                rows={(filteredRows || rows || []).map((customer) => ({
                  ...customer,
                  name: customer.name,
                  email: customer.email,
                  role: customer.role,
                  status: customer.status,
                  created_at: customer.created_at,
                  updated_at: customer.updated_at,
                  last_login: customer.last_login,
                  image: customer.image,
                }))}
                onRefresh={refreshUsers}
                sortConfig={sortConfig}
                onSort={handleSort}
                isAdmin
              />
            )}

            {/* Pagination */}
            {totalCustomers > rowsPerPage && (
              <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Showing <span className="font-medium text-slate-700 dark:text-slate-200">{rangeStart}–{rangeEnd}</span> of{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-200">{totalCustomers}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis ? <span className="px-2 text-slate-400">…</span> : null}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`btn-sm border ${
                              currentPage === page
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="btn-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Modals */}
            <AddUserModal
              open={addOpen}
              setOpen={setAddOpen}
              onCreated={handleCreateUser}
              onExternalCreated={handleCreateExternalUser}
              creating={creating}
              adminKey={adminKey}
            />

            <EditUserModal open={editOpen} setOpen={setEditOpen} user={editingUser} onUpdated={refreshUsers} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Customers;

