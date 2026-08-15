import React from 'react';

const DataTable = ({ 
  title, 
  description, 
  data = [], 
  columns = [], 
  onAdd, 
  addButtonText = "Add user",
  loading = false,
  emptyMessage = "No data found"
}) => {
  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <span className="ml-3 text-slate-500">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h1>
          {description && (
            <p className="mt-2 text-sm text-slate-600 dark:text-gray-300">
              {description}
            </p>
          )}
        </div>
        {onAdd && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={onAdd}
              className="block rounded-md bg-indigo-500 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              {addButtonText}
            </button>
          </div>
        )}
      </div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            {data.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-slate-600 dark:text-gray-300">{emptyMessage}</h3>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 dark:divide-white/15">
                <thead>
                  <tr className="divide-x divide-slate-200 dark:divide-x-white/10">
                    {columns.map((column, index) => (
                      <th 
                        key={column.key || index}
                        scope="col" 
                        className={`py-3.5 pr-4 pl-4 text-left text-sm font-semibold text-slate-900 dark:text-white ${
                          index === 0 ? 'sm:pl-0' : ''
                        } ${
                          index === columns.length - 1 ? 'sm:pr-0' : ''
                        }`}
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-y-white/10 dark:bg-gray-900">
                  {data.map((row, rowIndex) => (
                    <tr key={row.id || rowIndex} className="divide-x divide-slate-200 transition-colors hover:bg-slate-50 dark:divide-x-white/10 dark:hover:bg-white/5">
                      {columns.map((column, colIndex) => (
                        <td 
                          key={column.key || colIndex}
                          className={`py-4 pr-4 pl-4 text-sm whitespace-nowrap ${
                            colIndex === 0 ? 'font-medium text-slate-900 sm:pl-0 dark:text-white' : 'text-slate-600 dark:text-gray-300'
                          } ${
                            colIndex === columns.length - 1 ? 'sm:pr-0' : ''
                          }`}
                        >
                          {column.render ? column.render(row) : row[column.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;