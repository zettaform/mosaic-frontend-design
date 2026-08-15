import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Check, 
  ArrowRight, 
  Target,
  Zap,
  Shield,
  Users,
  BarChart3
} from 'lucide-react';

const TourStep = ({ 
  step, 
  isActive, 
  onNext, 
  onPrev, 
  onSkip, 
  onComplete,
  totalSteps,
  currentStep 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const targetRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      // Scroll to target element
      if (step.target && targetRef.current) {
        targetRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
  }, [isActive, step.target]);

  const stepIcons = {
    welcome: Target,
    features: Zap,
    security: Shield,
    team: Users,
    analytics: BarChart3,
  };

  const Icon = stepIcons[step.type] || Target;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        >
          {/* Target Element Highlight */}
          {step.target && (
            <div
              ref={targetRef}
              className="absolute rounded-lg border-2 border-blue-500 shadow-lg shadow-blue-500/50 bg-blue-500/10"
              style={step.targetPosition}
            />
          )}

          {/* Tour Content */}
          <div className="flex items-center justify-center min-h-screen p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
            >
              {/* Close Button */}
              <button
                onClick={onSkip}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Step Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon className="w-8 h-8 text-white" />
              </div>

              {/* Step Content */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {step.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Step Features */}
              {step.features && (
                <div className="space-y-3 mb-8">
                  {step.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center space-x-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <span>Step {currentStep} of {totalSteps}</span>
                  <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={onPrev}
                  disabled={currentStep === 1}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex space-x-2">
                  {currentStep < totalSteps ? (
                    <motion.button
                      onClick={onNext}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={onComplete}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>Get Started</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const OnboardingTour = ({ 
  steps = [],
  onComplete,
  onSkip,
  className = '',
  ...props 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isActive, setIsActive] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsActive(false);
    onSkip?.();
  };

  const handleComplete = () => {
    setIsActive(false);
    onComplete?.();
  };

  const startTour = () => {
    setCurrentStep(1);
    setIsActive(true);
  };

  const currentStepData = steps[currentStep - 1];

  return (
    <div className={className} {...props}>
      {/* Tour Trigger Button */}
      <motion.button
        onClick={startTour}
        className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Target className="w-5 h-5" />
        <span>Start Tour</span>
      </motion.button>

      {/* Tour Steps */}
      {isActive && currentStepData && (
        <TourStep
          step={currentStepData}
          isActive={isActive}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={handleSkip}
          onComplete={handleComplete}
          totalSteps={steps.length}
          currentStep={currentStep}
        />
      )}
    </div>
  );
};

export default OnboardingTour;
