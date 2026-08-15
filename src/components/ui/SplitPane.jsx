import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';

const SplitPane = ({ 
  children, 
  direction = 'horizontal',
  minSize = 200,
  maxSize = 800,
  defaultSize = 300,
  className = '',
  ...props 
}) => {
  const [sizes, setSizes] = useState([defaultSize, 400]);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0, sizes: [0, 0] });

  const isHorizontal = direction === 'horizontal';

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      sizes: [...sizes],
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const delta = isHorizontal 
      ? e.clientX - startPosRef.current.x
      : e.clientY - startPosRef.current.y;

    const containerSize = isHorizontal ? containerRect.width : containerRect.height;
    const deltaPercent = (delta / containerSize) * 100;

    const newSizes = [...startPosRef.current.sizes];
    newSizes[0] = Math.max(
      minSize,
      Math.min(maxSize, newSizes[0] + deltaPercent)
    );
    newSizes[1] = 100 - newSizes[0];

    setSizes(newSizes);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const childrenArray = React.Children.toArray(children);

  return (
    <div
      ref={containerRef}
      className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} h-full ${className}`}
      {...props}
    >
      {/* First Panel */}
      <motion.div
        className={`${isHorizontal ? 'w-full' : 'h-full'} overflow-hidden`}
        style={{
          [isHorizontal ? 'width' : 'height']: `${sizes[0]}%`,
        }}
        animate={{
          [isHorizontal ? 'width' : 'height']: `${sizes[0]}%`,
        }}
        transition={{ duration: isDragging ? 0 : 0.3, ease: "easeOut" }}
      >
        {childrenArray[0]}
      </motion.div>

      {/* Resizer */}
      <div
        className={`
          ${isHorizontal ? 'w-1 h-full' : 'h-1 w-full'}
          bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600
          cursor-${isHorizontal ? 'col-resize' : 'row-resize'}
          flex items-center justify-center
          transition-colors duration-200
          ${isDragging ? 'bg-blue-500' : ''}
        `}
        onMouseDown={handleMouseDown}
      >
        <div className={`
          ${isHorizontal ? 'w-6 h-8' : 'h-6 w-8'}
          bg-white dark:bg-gray-800 rounded-full shadow-lg
          flex items-center justify-center
          border border-gray-200 dark:border-gray-600
          ${isDragging ? 'scale-110' : 'hover:scale-105'}
          transition-transform duration-200
        `}>
          <GripVertical 
            className={`${isHorizontal ? 'rotate-90' : ''} w-3 h-3 text-gray-400`} 
          />
        </div>
      </div>

      {/* Second Panel */}
      <motion.div
        className={`${isHorizontal ? 'w-full' : 'h-full'} overflow-hidden`}
        style={{
          [isHorizontal ? 'width' : 'height']: `${sizes[1]}%`,
        }}
        animate={{
          [isHorizontal ? 'width' : 'height']: `${sizes[1]}%`,
        }}
        transition={{ duration: isDragging ? 0 : 0.3, ease: "easeOut" }}
      >
        {childrenArray[1]}
      </motion.div>
    </div>
  );
};

export default SplitPane;
