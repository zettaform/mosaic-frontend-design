import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Star, Zap, Crown, Sparkles } from 'lucide-react';

const PricingCard = ({ 
  plan, 
  isPopular = false, 
  isSelected = false, 
  onSelect,
  billing = 'monthly',
  className = '' 
}) => {
  const price = billing === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  const originalPrice = billing === 'yearly' ? plan.monthlyPrice * 12 : null;
  const savings = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const planIcons = {
    starter: Zap,
    pro: Star,
    enterprise: Crown,
  };

  const Icon = planIcons[plan.id] || Star;

  return (
    <motion.div
      className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 p-8 ${
        isPopular 
          ? 'border-blue-500 shadow-xl shadow-blue-500/20' 
          : 'border-gray-200 dark:border-gray-700 shadow-lg'
      } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''} ${className}`}
      whileHover={{ 
        scale: 1.02, 
        y: -4,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: plan.delay || 0 }}
    >
      {/* Popular Badge */}
      {isPopular && (
        <motion.div
          className="absolute -top-4 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
            <Sparkles className="w-4 h-4" />
            <span>Most Popular</span>
          </div>
        </motion.div>
      )}

      {/* Plan Header */}
      <div className="text-center mb-8">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
          isPopular 
            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}>
          <Icon className="w-8 h-8" />
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {plan.name}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {plan.description}
        </p>

        {/* Pricing */}
        <div className="mb-6">
          <div className="flex items-baseline justify-center">
            <span className="text-5xl font-bold text-gray-900 dark:text-white">
              ${price}
            </span>
            <span className="text-gray-600 dark:text-gray-400 ml-1">
              /{billing === 'monthly' ? 'month' : 'year'}
            </span>
          </div>
          
          {billing === 'yearly' && savings > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-2"
            >
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                Save {savings}%
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="space-y-4 mb-8">
        {plan.features.map((feature, index) => (
          <motion.div
            key={index}
            className="flex items-start space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
              feature.included 
                ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
            }`}>
              {feature.included ? (
                <Check className="w-3 h-3" />
              ) : (
                <X className="w-3 h-3" />
              )}
            </div>
            <span className={`text-sm ${
              feature.included 
                ? 'text-gray-900 dark:text-white' 
                : 'text-gray-500 dark:text-gray-400 line-through'
            }`}>
              {feature.text}
            </span>
          </motion.div>
        ))}
      </div>

      {/* CTA Button */}
      <motion.button
        onClick={() => onSelect(plan)}
        className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
          isPopular
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
            : isSelected
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isSelected ? 'Selected' : plan.cta || 'Get Started'}
      </motion.button>

      {/* Additional Info */}
      {plan.note && (
        <motion.p
          className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {plan.note}
        </motion.p>
      )}
    </motion.div>
  );
};

const PricingTable = ({ 
  plans = [],
  selectedPlan,
  onPlanSelect,
  billing = 'monthly',
  onBillingChange,
  className = '',
  ...props 
}) => {
  const [isAnnual, setIsAnnual] = useState(billing === 'yearly');

  const handleBillingToggle = () => {
    const newBilling = isAnnual ? 'monthly' : 'yearly';
    setIsAnnual(!isAnnual);
    onBillingChange?.(newBilling);
  };

  return (
    <div className={`w-full ${className}`} {...props}>
      {/* Billing Toggle */}
      <div className="flex items-center justify-center mb-12">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-1 flex">
          <motion.button
            onClick={() => setIsAnnual(false)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              !isAnnual 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Monthly
          </motion.button>
          <motion.button
            onClick={() => setIsAnnual(true)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              isAnnual 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-2">
              <span>Annual</span>
              <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                Save 20%
              </span>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {plans.map((plan, index) => (
            <PricingCard
              key={`${plan.id}-${isAnnual ? 'yearly' : 'monthly'}`}
              plan={plan}
              isPopular={plan.popular}
              isSelected={selectedPlan?.id === plan.id}
              onSelect={onPlanSelect}
              billing={isAnnual ? 'yearly' : 'monthly'}
              className={index === 1 ? 'md:scale-105' : ''}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* FAQ Section */}
      <motion.div
        className="mt-20 max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Frequently Asked Questions
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              question: "Can I change plans anytime?",
              answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
            },
            {
              question: "Is there a free trial?",
              answer: "We offer a 14-day free trial for all plans. No credit card required to start."
            },
            {
              question: "What payment methods do you accept?",
              answer: "We accept all major credit cards, PayPal, and bank transfers for annual plans."
            },
            {
              question: "Do you offer refunds?",
              answer: "Yes, we offer a 30-day money-back guarantee for all paid plans."
            }
          ].map((faq, index) => (
            <motion.div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                {faq.question}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {faq.answer}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default PricingTable;
