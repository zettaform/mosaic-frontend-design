import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Tooltip as RechartsTooltip } from 'recharts';

const Heatmap = ({ 
  data = [],
  xAxis = 'x',
  yAxis = 'y',
  value = 'value',
  width = '100%',
  height = 300,
  className = '',
  colorScale = ['#EBF8FF', '#BEE3F8', '#90CDF4', '#63B3ED', '#4299E1', '#3182CE', '#2C5282'],
  showTooltip = true,
  cellSize = 20,
  ...props 
}) => {
  const [hoveredCell, setHoveredCell] = useState(null);

  // Process data to create heatmap
  const { heatmapData, xLabels, yLabels, minValue, maxValue } = useMemo(() => {
    if (!data.length) return { heatmapData: [], xLabels: [], yLabels: [], minValue: 0, maxValue: 1 };

    const xSet = new Set();
    const ySet = new Set();
    const valueMap = new Map();

    data.forEach(item => {
      xSet.add(item[xAxis]);
      ySet.add(item[yAxis]);
      valueMap.set(`${item[xAxis]}-${item[yAxis]}`, item[value]);
    });

    const xLabels = Array.from(xSet).sort();
    const yLabels = Array.from(ySet).sort();
    const values = data.map(item => item[value]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    const heatmapData = yLabels.map(y => 
      xLabels.map(x => ({
        x,
        y,
        value: valueMap.get(`${x}-${y}`) || 0,
        xIndex: xLabels.indexOf(x),
        yIndex: yLabels.indexOf(y),
      }))
    ).flat();

    return { heatmapData, xLabels, yLabels, minValue, maxValue };
  }, [data, xAxis, yAxis, value]);

  const getColor = (value) => {
    if (minValue === maxValue) return colorScale[0];
    const ratio = (value - minValue) / (maxValue - minValue);
    const index = Math.floor(ratio * (colorScale.length - 1));
    return colorScale[Math.min(index, colorScale.length - 1)];
  };

  const getOpacity = (value) => {
    if (minValue === maxValue) return 0.3;
    return 0.3 + ((value - minValue) / (maxValue - minValue)) * 0.7;
  };

  return (
    <div className={`w-full ${className}`} {...props}>
      <div className="relative" style={{ width, height }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-2">
          {yLabels.map((label, index) => (
            <div
              key={label}
              className="text-xs text-gray-600 dark:text-gray-400 font-medium"
              style={{ 
                height: cellSize,
                lineHeight: `${cellSize}px`,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div 
          className="ml-16 mt-8 relative"
          style={{ 
            width: `calc(100% - 4rem)`,
            height: `calc(100% - 2rem)`,
          }}
        >
          {heatmapData.map((cell, index) => (
            <motion.div
              key={`${cell.x}-${cell.y}`}
              className="absolute border border-gray-200 dark:border-gray-700 cursor-pointer"
              style={{
                left: `${(cell.xIndex / xLabels.length) * 100}%`,
                top: `${(cell.yIndex / yLabels.length) * 100}%`,
                width: `${100 / xLabels.length}%`,
                height: `${100 / yLabels.length}%`,
                backgroundColor: getColor(cell.value),
                opacity: getOpacity(cell.value),
              }}
              whileHover={{ 
                scale: 1.1, 
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              onMouseEnter={() => setHoveredCell(cell)}
              onMouseLeave={() => setHoveredCell(null)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: getOpacity(cell.value), scale: 1 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.01,
                ease: "easeOut" 
              }}
            />
          ))}
        </div>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-16 right-0 flex justify-between">
          {xLabels.map((label, index) => (
            <div
              key={label}
              className="text-xs text-gray-600 dark:text-gray-400 font-medium"
              style={{ 
                width: `${100 / xLabels.length}%`,
                textAlign: 'center',
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {showTooltip && hoveredCell && (
          <motion.div
            className="absolute bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg shadow-lg text-sm font-medium z-20 pointer-events-none"
            style={{
              left: hoveredCell.xIndex * (100 / xLabels.length) + 16 + '%',
              top: hoveredCell.yIndex * (100 / yLabels.length) + 8 + '%',
              transform: 'translate(-50%, -100%)',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className="font-semibold">{hoveredCell.x} × {hoveredCell.y}</div>
            <div className="text-xs opacity-75">Value: {hoveredCell.value}</div>
          </motion.div>
        )}

        {/* Color scale legend */}
        <div className="absolute top-0 right-0 flex items-center space-x-1">
          <span className="text-xs text-gray-600 dark:text-gray-400 mr-2">Low</span>
          {colorScale.map((color, index) => (
            <div
              key={index}
              className="w-3 h-3 border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: color }}
            />
          ))}
          <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">High</span>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;
