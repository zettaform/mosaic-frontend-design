/**
 * Smooth scroll utility for enterprise-grade navigation
 * Provides consistent scrolling behavior across the application
 */

/**
 * Smoothly scrolls to an element with the given ID
 * @param {string} elementId - The ID of the element to scroll to
 * @param {Object} options - Scroll options
 * @param {number} options.offset - Offset from the top of the element (default: 80)
 * @param {number} options.duration - Animation duration in milliseconds (default: 800)
 * @param {string} options.easing - Easing function (default: 'ease-in-out')
 */
export const smoothScrollTo = (elementId, options = {}) => {
  const {
    offset = 80,
    duration = 800,
    easing = 'ease-in-out'
  } = options;

  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element with ID "${elementId}" not found`);
    return;
  }

  const targetPosition = element.offsetTop - offset;
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  let startTime = null;

  const animation = (currentTime) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    
    // Easing function
    const ease = easing === 'ease-in-out' 
      ? progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
      : progress;

    window.scrollTo(0, startPosition + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  };

  requestAnimationFrame(animation);
};

/**
 * Smooth scroll to element with intersection observer for better performance
 * @param {string} elementId - The ID of the element to scroll to
 * @param {Object} options - Scroll options
 */
export const smoothScrollToWithObserver = (elementId, options = {}) => {
  const {
    offset = 80,
    duration = 800,
    easing = 'ease-in-out'
  } = options;

  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element with ID "${elementId}" not found`);
    return;
  }

  // Use Intersection Observer to detect when element is in view
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Element is in view, stop scrolling
          observer.disconnect();
        }
      });
    },
    { threshold: 0.1 }
  );

  observer.observe(element);
  smoothScrollTo(elementId, { offset, duration, easing });
};

/**
 * Scroll to top of page with smooth animation
 * @param {Object} options - Scroll options
 */
export const smoothScrollToTop = (options = {}) => {
  const { duration = 600, easing = 'ease-in-out' } = options;
  
  const startPosition = window.pageYOffset;
  const distance = -startPosition;
  let startTime = null;

  const animation = (currentTime) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    
    const ease = easing === 'ease-in-out' 
      ? progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
      : progress;

    window.scrollTo(0, startPosition + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  };

  requestAnimationFrame(animation);
};

/**
 * Check if element is in viewport
 * @param {string} elementId - The ID of the element to check
 * @param {number} threshold - Threshold for intersection (default: 0.1)
 * @returns {Promise<boolean>} - Promise that resolves to true if element is in view
 */
export const isElementInView = (elementId, threshold = 0.1) => {
  return new Promise((resolve) => {
    const element = document.getElementById(elementId);
    if (!element) {
      resolve(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          resolve(entry.isIntersecting);
          observer.disconnect();
        });
      },
      { threshold }
    );

    observer.observe(element);
  });
};

/**
 * Add smooth scrolling behavior to all anchor links
 * This should be called once when the app initializes
 */
export const initializeSmoothScrolling = () => {
  // Add smooth scrolling to all anchor links
  document.addEventListener('click', (event) => {
    const target = event.target.closest('a[href^="#"]');
    if (!target) return;

    const href = target.getAttribute('href');
    if (!href || href === '#') return;

    const elementId = href.substring(1);
    event.preventDefault();
    
    smoothScrollTo(elementId, {
      offset: 80,
      duration: 800,
      easing: 'ease-in-out'
    });
  });

  // Add smooth scrolling to CSS
  document.documentElement.style.scrollBehavior = 'smooth';
};
