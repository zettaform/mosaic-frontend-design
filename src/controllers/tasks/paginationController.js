import { useState, useCallback } from 'react';

/**
 * Pagination Controller
 * Handles pagination logic for various lists
 * 
 * @param {Object} options - Initial pagination options
 * @param {number} options.initialPage - Initial page number
 * @param {number} options.initialPageSize - Initial page size
 * @returns {Object} Controller interface with state and functions
 */
export const usePaginationController = ({
  initialPage = 1,
  initialPageSize = 10
} = {}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(0);
  const [paginationKey, setPaginationKey] = useState(null);
  const [paginationKeys, setPaginationKeys] = useState([null]);

  /**
   * Calculate total pages
   * @returns {number} Total number of pages
   */
  const totalPages = Math.ceil(totalItems / pageSize);

  /**
   * Check if there's a next page
   * @returns {boolean} Whether next page exists
   */
  const hasNextPage = paginationKey !== null;

  /**
   * Check if there's a previous page
   * @returns {boolean} Whether previous page exists
   */
  const hasPrevPage = currentPage > 1;

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  /**
   * Go to previous page
   */
  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPrevPage]);

  /**
   * Go to specific page
   * @param {number} page - Page number
   */
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  /**
   * Change page size
   * @param {number} newPageSize - New page size
   */
  const changePageSize = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    setPaginationKeys([null]);
    setPaginationKey(null);
  }, []);

  /**
   * Reset pagination
   */
  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setPageSize(initialPageSize);
    setTotalItems(0);
    setPaginationKey(null);
    setPaginationKeys([null]);
  }, [initialPage, initialPageSize]);

  /**
   * Update pagination key for current page
   * @param {string|null} key - Pagination key
   */
  const updatePaginationKey = useCallback((key) => {
    setPaginationKey(key);
    setPaginationKeys(prev => {
      const next = [...prev];
      next[currentPage - 1] = key;
      return next;
    });
  }, [currentPage]);

  /**
   * Get pagination key for specific page
   * @param {number} page - Page number
   * @returns {string|null} Pagination key
   */
  const getPaginationKey = useCallback((page) => {
    return paginationKeys[page - 2] || null;
  }, [paginationKeys]);

  // Return controller interface
  return {
    // State
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    paginationKey,
    paginationKeys,
    
    // Computed
    hasNextPage,
    hasPrevPage,
    
    // Actions
    nextPage,
    prevPage,
    goToPage,
    changePageSize,
    reset,
    updatePaginationKey,
    getPaginationKey,
    
    // Setters
    setCurrentPage,
    setPageSize,
    setTotalItems,
    setPaginationKey
  };
};

