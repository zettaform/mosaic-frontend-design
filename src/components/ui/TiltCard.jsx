import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useGesture } from '@use-gesture/react';

const TiltCard = ({ 
  children, 
  className = '', 
  intensity = 0.3,
  scale = 1.05,
  perspective = 1000,
  ...props 
}) => {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-1, 1], [intensity * 20, -intensity * 20]));
  const rotateY = useSpring(useTransform(x, [-1, 1], [-intensity * 20, intensity * 20]));
  const scaleValue = useSpring(useTransform([x, y], (latest) => {
    const [xVal, yVal] = latest;
    const distance = Math.sqrt(xVal * xVal + yVal * yVal);
    return 1 + (distance * (scale - 1));
  }));

  const bind = useGesture({
    onHover: ({ hovering }) => {
      setIsHovered(hovering);
      if (!hovering) {
        x.set(0);
        y.set(0);
      }
    },
    onMove: ({ xy: [px, py], dragging }) => {
      if (!dragging && isHovered && cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const xVal = (px - centerX) / (rect.width / 2);
        const yVal = (py - centerY) / (rect.height / 2);
        
        x.set(xVal);
        y.set(yVal);
      }
    },
  });

  return (
    <motion.div
      ref={cardRef}
      className={`relative ${className}`}
      style={{
        perspective,
        transformStyle: 'preserve-3d',
      }}
      {...bind()}
      {...props}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          scale: scaleValue,
          transformStyle: 'preserve-3d',
        }}
        className="w-full h-full"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

export default TiltCard;
