import React, { useState, useEffect } from 'react';
import onboardingService from '../../../services/onboardingService';

const CompanyInfoStep = ({ data, onComplete, onPrevious, isLoading, error }) => {
  const [formData, setFormData] = useState({
    company_name: data.company_name || '',
    company_size: data.company_size || '',
    industry: data.industry || '',
    website: data.website || ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  const industryOptions = onboardingService.getIndustryOptions();
  const companySizeOptions = onboardingService.getCompanySizeOptions();

  useEffect(() => {
    // Clear validation errors when form data changes
    setValidationErrors({});
  }, [formData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.company_name.trim()) {
      errors.company_name = 'Company name is required';
    } else if (formData.company_name.trim().length < 2) {
      errors.company_name = 'Company name must be at least 2 characters';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      errors.website = 'Website must be a valid URL starting with http:// or https://';
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
        <h2 className="text-2xl font-bold text-gray-900">Company Information</h2>
        <p className="mt-2 text-gray-600">
          Tell us about your company to personalize your experience
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Name */}
        <div>
          <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
            Company Name *
          </label>
          <input
            type="text"
            id="company_name"
            value={formData.company_name}
            onChange={(e) => handleInputChange('company_name', e.target.value)}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              validationErrors.company_name ? 'border-red-300' : ''
            }`}
            placeholder="Enter your company name"
            disabled={isLoading}
          />
          {validationErrors.company_name && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.company_name}</p>
          )}
        </div>

        {/* Company Size */}
        <div>
          <label htmlFor="company_size" className="block text-sm font-medium text-gray-700">
            Company Size
          </label>
          <select
            id="company_size"
            value={formData.company_size}
            onChange={(e) => handleInputChange('company_size', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            disabled={isLoading}
          >
            <option value="">Select company size</option>
            {companySizeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Industry */}
        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
            Industry
          </label>
          <select
            id="industry"
            value={formData.industry}
            onChange={(e) => handleInputChange('industry', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            disabled={isLoading}
          >
            <option value="">Select industry</option>
            {industryOptions.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>

        {/* Website */}
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700">
            Company Website
          </label>
          <input
            type="url"
            id="website"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              validationErrors.website ? 'border-red-300' : ''
            }`}
            placeholder="https://www.yourcompany.com"
            disabled={isLoading}
          />
          {validationErrors.website && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.website}</p>
          )}
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

export default CompanyInfoStep;
