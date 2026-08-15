import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import onboardingService from '../../services/onboardingService';
import ProtectedRoute from '../../components/ProtectedRoute';

const OnboardingRecords = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    page: 1,
    limit: 20,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({});
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadRecords();
  }, [filters]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await onboardingService.getOnboardingRecords(filters);
      
      if (response.success) {
        setRecords(response.records);
        setPagination(response.pagination);
      } else {
        setError('Failed to load onboarding records');
      }
    } catch (error) {
      console.error('Error loading records:', error);
      setError(error.message || 'Failed to load onboarding records');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handleSearch = (searchTerm) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleSort = (sortBy) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleViewDetails = async (userId) => {
    try {
      setLoading(true);
      const response = await onboardingService.getUserOnboardingDetails(userId);
      
      if (response.success) {
        setSelectedRecord(response);
        setShowDetails(true);
      } else {
        setError('Failed to load user details');
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      setError(error.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format = 'json') => {
    try {
      setLoading(true);
      await onboardingService.exportOnboardingRecords(format, filters.status);
    } catch (error) {
      console.error('Error exporting records:', error);
      setError(error.message || 'Failed to export records');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      not_started: { color: 'bg-gray-100 text-gray-800', label: 'Not Started' }
    };
    
    const config = statusConfig[status] || statusConfig.not_started;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (showDetails && selectedRecord) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button
              onClick={() => setShowDetails(false)}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Records
            </button>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">
                Onboarding Details - {selectedRecord.user.first_name} {selectedRecord.user.last_name}
              </h1>
              <p className="text-gray-600">{selectedRecord.user.email}</p>
            </div>

            <div className="p-6">
              {/* User Information */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">User ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedRecord.user.user_id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedRecord.user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Role</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{selectedRecord.user.role}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedRecord.user.status}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Onboarding Completed</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {selectedRecord.user.onboarding_completed ? 'Yes' : 'No'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Completed At</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(selectedRecord.user.onboarding_completed_at)}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Onboarding Steps */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Onboarding Steps</h2>
                <div className="space-y-4">
                  {selectedRecord.onboarding_steps.map((step, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">
                          Step {step.step_number}: {step.step_number === 'completed' ? 'Completion' : 'Data Collection'}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {formatDate(step.created_at)}
                        </span>
                      </div>
                      {step.step_data && Object.keys(step.step_data).length > 0 && (
                        <div className="bg-gray-50 rounded p-3">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                            {JSON.stringify(step.step_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Logs */}
              {selectedRecord.audit_logs && selectedRecord.audit_logs.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit Logs</h2>
                  <div className="space-y-2">
                    {selectedRecord.audit_logs.map((log, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-gray-50 rounded p-3">
                        <div>
                          <span className="font-medium">{log.action}</span>
                          {log.step && <span className="text-gray-500"> - Step {log.step}</span>}
                        </div>
                        <span className="text-gray-500">{formatDate(log.action_timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Onboarding Records</h1>
            <p className="mt-2 text-gray-600">
              Manage and monitor user onboarding progress
            </p>
          </div>

          {/* Filters and Search */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="not_started">Not Started</option>
                  </select>
                </div>

                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search by email or company..."
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleSort(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="created_at">Created Date</option>
                    <option value="completed_at">Completed Date</option>
                    <option value="email">Email</option>
                    <option value="company_name">Company Name</option>
                  </select>
                </div>

                {/* Export */}
                <div className="flex items-end">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleExport('json')}
                      disabled={loading}
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      Export JSON
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      disabled={loading}
                      className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Records Table */}
          <div className="bg-white shadow rounded-lg">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Completed At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {records.map((record) => (
                        <tr key={record.user_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {record.first_name} {record.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{record.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.company_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {record.role}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(record.onboarding_status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(record.completed_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleViewDetails(record.user_id)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing{' '}
                          <span className="font-medium">
                            {(pagination.page - 1) * pagination.limit + 1}
                          </span>{' '}
                          to{' '}
                          <span className="font-medium">
                            {Math.min(pagination.page * pagination.limit, pagination.total)}
                          </span>{' '}
                          of{' '}
                          <span className="font-medium">{pagination.total}</span>{' '}
                          results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default OnboardingRecords;
