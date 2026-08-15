import React from 'react';

const ProgressIndicator = ({ currentStep, totalSteps, steps }) => {
  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div key={stepNumber} className="flex items-center">
              {/* Step Circle */}
              <div className="flex items-center justify-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium ${
                    isCompleted
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : isCurrent
                      ? 'border-indigo-600 bg-white text-indigo-600'
                      : 'border-gray-300 bg-white text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
              </div>

              {/* Step Label */}
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${
                    isCompleted || isCurrent
                      ? 'text-indigo-600'
                      : 'text-gray-500'
                  }`}
                >
                  {step}
                </p>
              </div>

              {/* Connector Line */}
              {stepNumber < totalSteps && (
                <div className="ml-4 flex-1">
                  <div
                    className={`h-0.5 w-full ${
                      isCompleted ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Percentage */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
      </div>
    </div>
  );
};

export default ProgressIndicator;
