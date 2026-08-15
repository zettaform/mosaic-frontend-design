import React, { useState, useEffect } from 'react';

const TeamSetupStep = ({ data, onComplete, onPrevious, isLoading, error }) => {
  const [formData, setFormData] = useState({
    invite_emails: data.invite_emails || [''],
    team_size: data.team_size || 'small'
  });

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    setValidationErrors({});
  }, [formData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmailChange = (index, value) => {
    const newEmails = [...formData.invite_emails];
    newEmails[index] = value;
    setFormData(prev => ({
      ...prev,
      invite_emails: newEmails
    }));
  };

  const addEmailField = () => {
    setFormData(prev => ({
      ...prev,
      invite_emails: [...prev.invite_emails, '']
    }));
  };

  const removeEmailField = (index) => {
    if (formData.invite_emails.length > 1) {
      const newEmails = formData.invite_emails.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        invite_emails: newEmails
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = formData.invite_emails.filter(email => email.trim());
    
    validEmails.forEach((email, index) => {
      if (!emailRegex.test(email.trim())) {
        errors[`email_${index}`] = 'Invalid email format';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Filter out empty emails
      const cleanEmails = formData.invite_emails.filter(email => email.trim());
      onComplete({
        ...formData,
        invite_emails: cleanEmails
      });
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Team Setup</h2>
        <p className="mt-2 text-gray-600">
          Invite your team members to join your workspace
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Team Size */}
        <div>
          <label htmlFor="team_size" className="block text-sm font-medium text-gray-700">
            Expected Team Size
          </label>
          <select
            id="team_size"
            value={formData.team_size}
            onChange={(e) => handleInputChange('team_size', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            disabled={isLoading}
          >
            <option value="small">Small (1-5 people)</option>
            <option value="medium">Medium (6-20 people)</option>
            <option value="large">Large (21-50 people)</option>
            <option value="enterprise">Enterprise (50+ people)</option>
          </select>
        </div>

        {/* Email Invitations */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Invite Team Members
          </label>
          <p className="mt-1 text-sm text-gray-500">
            Add email addresses of team members you'd like to invite
          </p>
          
          <div className="mt-4 space-y-3">
            {formData.invite_emails.map((email, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                      validationErrors[`email_${index}`] ? 'border-red-300' : ''
                    }`}
                    placeholder="colleague@company.com"
                    disabled={isLoading}
                  />
                  {validationErrors[`email_${index}`] && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors[`email_${index}`]}
                    </p>
                  )}
                </div>
                {formData.invite_emails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEmailField(index)}
                    className="rounded-md p-2 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    disabled={isLoading}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addEmailField}
            className="mt-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={isLoading}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Another Email
          </button>
        </div>

        {/* Information Box */}
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Team Invitations
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Invited team members will receive an email with instructions to join your workspace. 
                  You can always invite more people later from your dashboard.
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

export default TeamSetupStep;
