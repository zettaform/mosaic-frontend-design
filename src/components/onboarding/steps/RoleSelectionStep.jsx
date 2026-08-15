import React, { useState, useEffect } from 'react';
import onboardingService from '../../../services/onboardingService';

const RoleSelectionStep = ({ data, onComplete, onPrevious, isLoading, error }) => {
  const [selectedRole, setSelectedRole] = useState(data.role || '');
  const [validationErrors, setValidationErrors] = useState({});

  const roleOptions = onboardingService.getRoleOptions();

  useEffect(() => {
    setValidationErrors({});
  }, [selectedRole]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const validateForm = () => {
    const errors = {};

    if (!selectedRole) {
      errors.role = 'Please select a role';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onComplete({ role: selectedRole });
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Select Your Role</h2>
        <p className="mt-2 text-gray-600">
          Choose the role that best describes your responsibilities
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role Selection */}
        <div>
          <fieldset>
            <legend className="text-sm font-medium text-gray-700">
              Your Role *
            </legend>
            <div className="mt-4 space-y-4">
              {roleOptions.map((option) => (
                <div
                  key={option.value}
                  className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                    selectedRole === option.value
                      ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600'
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !isLoading && handleRoleSelect(option.value)}
                >
                  <div className="flex items-center">
                    <div className="flex h-5 w-5 items-center">
                      <input
                        type="radio"
                        name="role"
                        value={option.value}
                        checked={selectedRole === option.value}
                        onChange={() => handleRoleSelect(option.value)}
                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-500">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
          
          {validationErrors.role && (
            <p className="mt-2 text-sm text-red-600">{validationErrors.role}</p>
          )}
        </div>

        {/* Role Information */}
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Role Permissions
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Administrator:</strong> Full access to all features, user management, and system settings
                  </li>
                  <li>
                    <strong>Manager:</strong> Access to team management, reporting, and most features
                  </li>
                  <li>
                    <strong>Staff:</strong> Basic access to core features and assigned tasks
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6">
          {onPrevious && (
            <button
              type="button"
              onClick={onPrevious}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={isLoading}
            >
              Previous
            </button>
          )}
          
          <div className="ml-auto">
            <button
              type="submit"
              disabled={isLoading || !selectedRole}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RoleSelectionStep;
