import { useCallback, useEffect } from 'react';
import { smoothScrollTo, smoothScrollToTop, isElementInView } from '../utils/smoothScroll';

/**
 * Custom hook for smooth scrolling functionality
 * Provides enterprise-grade scrolling behavior with React integration
 */
export const useSmoothScroll = () => {
  /**
   * Scroll to element with smooth animation
   * @param {string} elementId - The ID of the element to scroll to
   * @param {Object} options - Scroll options
   */
  const scrollTo = useCallback((elementId, options = {}) => {
    smoothScrollTo(elementId, {
      offset: 80,
      duration: 800,
      easing: 'ease-in-out',
      ...options
    });
  }, []);

  /**
   * Scroll to top of page
   * @param {Object} options - Scroll options
   */
  const scrollToTop = useCallback((options = {}) => {
    smoothScrollToTop({
      duration: 600,
      easing: 'ease-in-out',
      ...options
    });
  }, []);

  /**
   * Check if element is in viewport
   * @param {string} elementId - The ID of the element to check
   * @param {number} threshold - Threshold for intersection
   * @returns {Promise<boolean>} - Promise that resolves to true if element is in view
   */
  const checkElementInView = useCallback(async (elementId, threshold = 0.1) => {
    return await isElementInView(elementId, threshold);
  }, []);

  /**
   * Handle navigation click with smooth scrolling
   * @param {Event} event - Click event
   * @param {string} elementId - The ID of the element to scroll to
   */
  const handleNavigationClick = useCallback((event, elementId) => {
    event.preventDefault();
    scrollTo(elementId);
  }, [scrollTo]);

  return {
    scrollTo,
    scrollToTop,
    checkElementInView,
    handleNavigationClick
  };
};

/**
 * Hook for scroll-based animations and effects
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Intersection threshold
 * @param {boolean} options.once - Whether to trigger only once
 */
export const useScrollAnimation = (options = {}) => {
  const { threshold = 0.1, once = true } = options;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
            if (once) {
              observer.unobserve(entry.target);
            }
          } else if (!once) {
            entry.target.classList.remove('animate-fade-in');
          }
        });
      },
      { threshold }
    );

    // Observe all elements with data-scroll-animate attribute
    const elements = document.querySelectorAll('[data-scroll-animate]');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [threshold, once]);
};

/**
 * Hook for scroll position tracking
 * @param {Function} callback - Callback function to call on scroll
 * @param {Object} options - Scroll options
 * @param {number} options.throttle - Throttle delay in milliseconds
 */
export const useScrollPosition = (callback, options = {}) => {
  const { throttle = 16 } = options; // ~60fps

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          callback(window.pageYOffset);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [callback, throttle]);
};
