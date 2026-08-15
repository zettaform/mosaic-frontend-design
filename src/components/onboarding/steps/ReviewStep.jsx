import React from 'react';

const ReviewStep = ({ allData, onComplete, onSaveAndResumeLater, onPrevious, isLoading, error }) => {
  const handleComplete = () => {
    onComplete();
  };

  const handleSaveAndResumeLater = () => {
    onSaveAndResumeLater();
  };

  const formatData = (data) => {
    if (!data || Object.keys(data).length === 0) return 'Not provided';
    
    if (typeof data === 'object' && !Array.isArray(data)) {
      return Object.entries(data)
        .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
        .join(', ');
    }
    
    if (Array.isArray(data)) {
      return data.length > 0 ? data.join(', ') : 'None';
    }
    
    return data.toString();
  };

  const formatNotificationSettings = (settings) => {
    if (!settings || typeof settings !== 'object') return 'Not configured';
    
    return Object.entries(settings)
      .filter(([_, value]) => value === true)
      .map(([key, _]) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
      .join(', ') || 'None enabled';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Review & Complete</h2>
        <p className="mt-2 text-gray-600">
          Please review your information before completing the setup
        </p>
      </div>

      <div className="space-y-8">
        {/* Company Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Company Name</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {allData.step1?.company_name || 'Not provided'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Company Size</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {allData.step1?.company_size || 'Not provided'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Industry</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {allData.step1?.industry || 'Not provided'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Website</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {allData.step1?.website ? (
                  <a 
                    href={allData.step1.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    {allData.step1.website}
                  </a>
                ) : 'Not provided'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Role Selection */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Role</h3>
          <dl className="grid grid-cols-1 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Selected Role</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">
                {allData.step2?.role || 'Not selected'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Team Setup */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Setup</h3>
          <dl className="grid grid-cols-1 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Expected Team Size</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">
                {allData.step3?.team_size || 'Not specified'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Invited Team Members</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {allData.step3?.invite_emails && allData.step3.invite_emails.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {allData.step3.invite_emails.map((email, index) => (
                      <li key={index}>{email}</li>
                    ))}
                  </ul>
                ) : 'No team members invited'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Preferences */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences & Settings</h3>
          <dl className="grid grid-cols-1 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Timezone</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {allData.step4?.timezone || 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Notification Settings</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatNotificationSettings(allData.step4?.notification_settings)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">API Integrations</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatNotificationSettings(allData.step4?.api_integrations)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Data Preferences</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatNotificationSettings(allData.step4?.data_preferences)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Completion Message */}
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Ready to Complete Setup
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  Your onboarding information has been saved. Click "Complete Setup" to finish 
                  and access your personalized dashboard.
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
          
          <div className="flex space-x-3 ml-auto">
            <button
              type="button"
              onClick={handleSaveAndResumeLater}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={isLoading}
            >
              Save & Resume Later
            </button>
            
            <button
              type="button"
              onClick={handleComplete}
              disabled={isLoading}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Completing...' : 'Complete Setup'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
