import React, { useState, useEffect } from 'react';
import onboardingService from '../../../services/onboardingService';

const PreferencesStep = ({ data, onComplete, onPrevious, isLoading, error }) => {
  const [formData, setFormData] = useState({
    timezone: data.timezone || 'America/New_York',
    notification_settings: data.notification_settings || {
      email_notifications: true,
      push_notifications: true,
      weekly_digest: true,
      product_updates: true
    },
    api_integrations: data.api_integrations || {
      webhook_enabled: false,
      api_access: false,
      third_party_integrations: false
    },
    data_preferences: data.data_preferences || {
      analytics_tracking: true,
      usage_analytics: true,
      error_reporting: true
    }
  });

  const [validationErrors, setValidationErrors] = useState({});

  const timezoneOptions = onboardingService.getAvailableTimezones();

  useEffect(() => {
    setValidationErrors({});
  }, [formData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parentField, childField, value) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (formData.timezone && !/^[A-Za-z_]+\/[A-Za-z_]+$/.test(formData.timezone)) {
      errors.timezone = 'Invalid timezone format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onComplete(formData);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Preferences & Settings</h2>
        <p className="mt-2 text-gray-600">
          Configure your preferences to personalize your experience
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Timezone */}
        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
            Timezone
          </label>
          <select
            id="timezone"
            value={formData.timezone}
            onChange={(e) => handleInputChange('timezone', e.target.value)}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              validationErrors.timezone ? 'border-red-300' : ''
            }`}
            disabled={isLoading}
          >
            {timezoneOptions.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace('_', ' ')}
              </option>
            ))}
          </select>
          {validationErrors.timezone && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.timezone}</p>
          )}
        </div>

        {/* Notification Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            {Object.entries(formData.notification_settings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                  <p className="text-sm text-gray-500">
                    {key === 'email_notifications' && 'Receive email notifications for important updates'}
                    {key === 'push_notifications' && 'Receive push notifications in your browser'}
                    {key === 'weekly_digest' && 'Get a weekly summary of your activity'}
                    {key === 'product_updates' && 'Stay informed about new features and updates'}
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => handleNestedInputChange('notification_settings', key, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    disabled={isLoading}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Integrations */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">API & Integrations</h3>
          <div className="space-y-4">
            {Object.entries(formData.api_integrations).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                  <p className="text-sm text-gray-500">
                    {key === 'webhook_enabled' && 'Enable webhook notifications for real-time updates'}
                    {key === 'api_access' && 'Allow API access for third-party integrations'}
                    {key === 'third_party_integrations' && 'Enable integrations with external services'}
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => handleNestedInputChange('api_integrations', key, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    disabled={isLoading}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Preferences */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Data & Privacy</h3>
          <div className="space-y-4">
            {Object.entries(formData.data_preferences).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                  <p className="text-sm text-gray-500">
                    {key === 'analytics_tracking' && 'Help us improve by sharing anonymous usage data'}
                    {key === 'usage_analytics' && 'Track feature usage to optimize your experience'}
                    {key === 'error_reporting' && 'Automatically report errors to help us fix issues'}
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => handleNestedInputChange('data_preferences', key, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    disabled={isLoading}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Information Box */}
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Privacy & Security
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  Your preferences are stored securely and can be changed at any time from your account settings. 
                  We never share your personal data with third parties without your explicit consent.
                </p>
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
              disabled={isLoading}
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

export default PreferencesStep;
