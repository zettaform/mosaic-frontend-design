import React, { useState, useMemo, useCallback, useEffect } from 'react';

/**
 * AdvancedDataTable
 *
 * Feature-rich, spreadsheet-style table with:
 * - Column sorting
 * - Column resizing
 * - Column reordering (drag & drop)
 * - Sticky header + smooth scrolling
 * - Row hover + selection
 *
 * This is intentionally generic so it can be reused across admin pages.
 */
const AdvancedDataTable = ({
  columns,
  data,
  loading = false,
  onRowClick,
  emptyMessage = 'No records found',
  density = 'compact' // 'compact' | 'comfortable'
}) => {
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedRowKey, setSelectedRowKey] = useState(null);
  const [columnOrder, setColumnOrder] = useState(columns.map((col) => col.id));
  const [columnWidths, setColumnWidths] = useState(
    () =>
      columns.reduce((acc, col) => {
        if (col.width) acc[col.id] = col.width;
        return acc;
      }, {})
  );
  const [resizing, setResizing] = useState(null); // { id, startX, startWidth }

  useEffect(() => {
    const newIds = columns.map((col) => col.id);
    setColumnOrder((prev) => {
      const sameSet =
        prev.length === newIds.length &&
        prev.every((id) => newIds.includes(id)) &&
        newIds.every((id) => prev.includes(id));
      if (sameSet) {
        return prev;
      }
      return newIds;
    });
  }, [columns]);

  useEffect(() => {
    setColumnWidths((prev) => {
      const columnMap = new Map(columns.map((col) => [col.id, col]));
      const next = {};
      Object.keys(prev).forEach((id) => {
        if (columnMap.has(id)) {
          next[id] = prev[id];
        }
      });
      columns.forEach((col) => {
        if (col.width && !next[col.id]) {
          next[col.id] = col.width;
        }
      });
      return next;
    });
  }, [columns]);

  const orderedColumns = useMemo(
    () => columnOrder.map((id) => columns.find((c) => c.id === id)).filter(Boolean),
    [columnOrder, columns]
  );

  const sortedData = useMemo(() => {
    if (!sortBy) return data || [];
    const col = columns.find((c) => c.id === sortBy);
    if (!col) return data || [];

    const accessor = col.accessor || ((row) => row[col.id]);
    const direction = sortOrder === 'asc' ? 1 : -1;

    return [...(data || [])].sort((a, b) => {
      const aVal = accessor(a);
      const bVal = accessor(b);

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return -1 * direction;
      if (bVal == null) return 1 * direction;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        if (aVal < bVal) return -1 * direction;
        if (aVal > bVal) return 1 * direction;
        return 0;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return -1 * direction;
      if (aStr > bStr) return 1 * direction;
      return 0;
    });
  }, [data, sortBy, sortOrder, columns]);

  const handleHeaderClick = (col) => {
    if (!col.sortable) return;
    if (sortBy === col.id) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col.id);
      setSortOrder(col.defaultSort || 'asc');
    }
  };

  const handleRowClick = (row) => {
    const key = row.id || row.key || row.user_email;
    setSelectedRowKey(key);
    if (onRowClick) onRowClick(row);
  };

  // Column reordering via drag & drop on header
  const handleDragStart = (event, colId) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', colId);
  };

  const handleDrop = (event, targetColId) => {
    const sourceColId = event.dataTransfer.getData('text/plain');
    if (!sourceColId || sourceColId === targetColId) return;

    setColumnOrder((prev) => {
      const next = [...prev];
      const sourceIndex = next.indexOf(sourceColId);
      const targetIndex = next.indexOf(targetColId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;
      next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, sourceColId);
      return next;
    });
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  // Column resizing
  const handleResizeMouseDown = (event, colId) => {
    event.preventDefault();
    event.stopPropagation();
    const th = event.target.closest('th');
    if (!th) return;

    const startX = event.clientX;
    const startWidth = th.getBoundingClientRect().width;
    setResizing({ id: colId, startX, startWidth });
  };

  const handleMouseMove = useCallback(
    (event) => {
      if (!resizing) return;
      const deltaX = event.clientX - resizing.startX;
      const newWidth = Math.max((resizing.startWidth || 0) + deltaX, 80);
      setColumnWidths((prev) => ({
        ...prev,
        [resizing.id]: newWidth
      }));
    },
    [resizing]
  );

  const handleMouseUp = useCallback(() => {
    if (resizing) {
      setResizing(null);
    }
  }, [resizing]);

  React.useEffect(() => {
    if (!resizing) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, handleMouseMove, handleMouseUp]);

  const rowPadding = density === 'comfortable' ? 'py-3' : 'py-2';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 dark:text-slate-400">Loading statistics…</span>
        </div>
      </div>
    );
  }

  if (!loading && (!sortedData || sortedData.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          className="w-12 h-12 text-slate-300 dark:text-slate-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6M4 5h16M5 7v12a2 2 0 002 2h10a2 2 0 002-2V7"
          />
        </svg>
        <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-100">{emptyMessage}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Once data is available in the dev-user-statistics table, it will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="overflow-auto max-h-[calc(100vh-260px)] scroll-smooth">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-700">
            <tr>
              {orderedColumns.map((col) => {
                const isSorted = sortBy === col.id;
                const widthStyle = columnWidths[col.id]
                  ? { width: columnWidths[col.id], minWidth: columnWidths[col.id] }
                  : col.minWidth
                  ? { minWidth: col.minWidth }
                  : {};
                return (
                  <th
                    key={col.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, col.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                    onClick={() => handleHeaderClick(col)}
                    className={`group relative select-none px-4 py-3 text-left font-semibold text-xs tracking-wide uppercase text-slate-500 dark:text-slate-400 ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    } ${col.sortable ? 'cursor-pointer' : 'cursor-default'}`}
                    style={widthStyle}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{col.header}</span>
                      {col.sortable && (
                        <span className="ml-1 text-[10px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200">
                          {isSorted ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      )}
                    </div>
                    {/* Resize handle */}
                    <div
                      className="absolute top-0 right-0 h-full w-1 cursor-col-resize group-hover:bg-slate-300/60 dark:group-hover:bg-slate-600/60"
                      onMouseDown={(e) => handleResizeMouseDown(e, col.id)}
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {sortedData.map((row, rowIndex) => {
              const key = row.id || row.key || row.user_email || rowIndex;
              const isSelected = selectedRowKey != null && selectedRowKey === key;
              return (
                <tr
                  key={key}
                  className={`transition-colors ${rowPadding} ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                  onClick={() => handleRowClick(row)}
                >
                  {orderedColumns.map((col) => {
                    const accessor = col.accessor || ((r) => r[col.id]);
                    const value = accessor(row);
                    const alignClass =
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left';
                    return (
                      <td
                        key={col.id}
                        className={`px-4 ${rowPadding} whitespace-nowrap text-[13px] ${
                          isSelected
                            ? 'text-slate-900 dark:text-slate-50'
                            : 'text-slate-700 dark:text-slate-200'
                        } ${alignClass}`}
                      >
                        {col.render ? col.render(value, row) : value}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdvancedDataTable;


