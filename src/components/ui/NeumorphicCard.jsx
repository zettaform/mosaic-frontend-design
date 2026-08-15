import React from 'react';
import { motion } from 'framer-motion';

const NeumorphicCard = ({ 
  children, 
  className = '', 
  variant = 'default',
  size = 'md',
  padding = 'p-6',
  hover = true,
  ...props 
}) => {
  const variantClasses = {
    default: 'bg-gray-100 dark:bg-gray-800',
    elevated: 'bg-gray-200 dark:bg-gray-700',
    inset: 'bg-gray-50 dark:bg-gray-900',
    colored: 'bg-blue-100 dark:bg-blue-900',
  };

  const sizeClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };

  const getNeumorphicShadow = (variant, size) => {
    const shadows = {
      default: {
        sm: 'shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)]',
        md: 'shadow-[12px_12px_24px_rgba(0,0,0,0.15),-12px_-12px_24px_rgba(255,255,255,0.7)]',
        lg: 'shadow-[16px_16px_32px_rgba(0,0,0,0.2),-16px_-16px_32px_rgba(255,255,255,0.7)]',
        xl: 'shadow-[20px_20px_40px_rgba(0,0,0,0.25),-20px_-20px_40px_rgba(255,255,255,0.7)]',
      },
      elevated: {
        sm: 'shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.8)]',
        md: 'shadow-[6px_6px_12px_rgba(0,0,0,0.15),-6px_-6px_12px_rgba(255,255,255,0.8)]',
        lg: 'shadow-[8px_8px_16px_rgba(0,0,0,0.2),-8px_-8px_16px_rgba(255,255,255,0.8)]',
        xl: 'shadow-[10px_10px_20px_rgba(0,0,0,0.25),-10px_-10px_20px_rgba(255,255,255,0.8)]',
      },
      inset: {
        sm: 'shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.7)]',
        md: 'shadow-[inset_6px_6px_12px_rgba(0,0,0,0.15),inset_-6px_-6px_12px_rgba(255,255,255,0.7)]',
        lg: 'shadow-[inset_8px_8px_16px_rgba(0,0,0,0.2),inset_-8px_-8px_16px_rgba(255,255,255,0.7)]',
        xl: 'shadow-[inset_10px_10px_20px_rgba(0,0,0,0.25),inset_-10px_-10px_20px_rgba(255,255,255,0.7)]',
      },
    };

    return shadows[variant]?.[size] || shadows.default[size];
  };

  return (
    <motion.div
      className={`
        ${variantClasses[variant]}
        ${getNeumorphicShadow(variant, size)}
        ${padding}
        rounded-2xl border-0
        ${hover ? 'hover:shadow-[12px_12px_24px_rgba(0,0,0,0.1),-12px_-12px_24px_rgba(255,255,255,0.8)] transition-all duration-300' : ''}
        ${className}
      `}
      whileHover={hover ? { scale: 1.02, y: -2 } : {}}
      whileTap={hover ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default NeumorphicCard;
