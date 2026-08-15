import React from 'react';
import { motion } from 'framer-motion';

const GlassmorphismCard = ({ 
  children, 
  className = '', 
  intensity = 'medium',
  blur = 'md',
  borderRadius = 'lg',
  padding = 'p-6',
  hover = true,
  ...props 
}) => {
  const intensityClasses = {
    light: 'bg-white/10 backdrop-blur-sm border-white/20',
    medium: 'bg-white/20 backdrop-blur-md border-white/30',
    strong: 'bg-white/30 backdrop-blur-lg border-white/40',
  };

  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };

  const borderRadiusClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
  };

  return (
    <motion.div
      className={`
        ${intensityClasses[intensity]}
        ${blurClasses[blur]}
        ${borderRadiusClasses[borderRadius]}
        ${padding}
        border shadow-xl
        ${hover ? 'hover:bg-white/25 hover:border-white/40 transition-all duration-300' : ''}
        ${className}
      `}
      whileHover={hover ? { scale: 1.02, y: -2 } : {}}
      whileTap={hover ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassmorphismCard;
