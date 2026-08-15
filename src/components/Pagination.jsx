import React from 'react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  pageSize, 
  totalItems, 
  onPageChange, 
  onPageSizeChange, 
  loading = false,
  showPageSizeSelector = true,
  useContinuationTokens = false,
  hasNextPage = null,
  hasPrevPage = null
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const computedHasPrev = typeof hasPrevPage === 'boolean' ? hasPrevPage : currentPage > 1;
  const computedHasNext = typeof hasNextPage === 'boolean' ? hasNextPage : currentPage < totalPages;
  
  const pageNumbers = [];
  // Show at least 8 pages when totalPages >= 8, otherwise show up to totalPages
  const maxVisiblePages = totalPages >= 8 ? 8 : Math.min(5, totalPages);
  
  // Calculate which page numbers to show
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  // Adjust start page if we're near the end
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  // If totalPages >= 8 and we're on page 1-4, show pages 1-8
  if (totalPages >= 8 && currentPage <= 4) {
    startPage = 1;
    endPage = Math.min(8, totalPages);
  }
  // If totalPages >= 8 and we're near the end, show the last 8 pages
  else if (totalPages >= 8 && currentPage > totalPages - 4) {
    endPage = totalPages;
    startPage = Math.max(1, totalPages - 7);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const handlePageChange = (page) => {
    if (loading) return;
    if (useContinuationTokens) {
      if (page >= 1 && page !== currentPage) {
        onPageChange(page);
      }
      return;
    }
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    if (newPageSize !== pageSize && !loading) {
      onPageSizeChange(newPageSize);
    }
  };

  // For offset-based pagination, show pagination if there are more items than pageSize
  // This ensures pagination shows even if totalPages calculation is off
  if (!useContinuationTokens && totalPages <= 1 && totalItems <= pageSize) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 dark:border-slate-700 sm:px-6">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={!computedHasPrev || loading}
          className="relative inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!computedHasNext || loading}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {showPageSizeSelector && (
            <div className="flex items-center space-x-2">
              <label htmlFor="page-size" className="text-sm text-slate-700 dark:text-slate-300">
                Show:
              </label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                disabled={loading}
                className="block w-20 pl-3 pr-10 py-1 text-base border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-slate-700 dark:text-slate-300">per page</span>
            </div>
          )}
          
          {useContinuationTokens ? (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!computedHasPrev || loading}
                className="inline-flex items-center px-3 py-2 rounded-full border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Page {currentPage}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!computedHasNext || loading}
                className="inline-flex items-center px-3 py-2 rounded-full border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <svg className="h-4 w-4 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ) : (
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {startPage > 1 && (
                <>
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={loading}
                    className="relative inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    1
                  </button>
                  {startPage > 2 && (
                    <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300">
                      ...
                    </span>
                  )}
                </>
              )}
              
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  disabled={loading}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    pageNumber === currentPage
                      ? 'z-10 bg-blue-50 dark:bg-blue-900/50 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                      : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {pageNumber}
                </button>
              ))}
              
              {endPage < totalPages && (
                <>
                  {endPage < totalPages - 1 && (
                    <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300">
                      ...
                    </span>
                  )}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={loading}
                    className="relative inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {totalPages}
                  </button>
                </>
              )}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pagination;