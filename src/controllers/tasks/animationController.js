import { useState, useEffect, useRef } from 'react';

/**
 * Animation Controller
 * Handles all animation logic including scroll trails, click animations, and 3D effects
 * 
 * @param {string} activeTab - Current active tab
 * @param {Object} savedResultsSectionRef - Ref to saved results section
 * @param {Function} setActiveTab - Function to set active tab
 * @param {Function} setSortBy - Function to set sort filter
 * @param {Function} ensureRunningTasksVisible - Function to ensure running tasks are visible
 * @param {Function} onUsersWithEmailsClick - Callback when Users with Emails is clicked
 * @param {Function} onTotalRecordsClick - Callback when Total Records is clicked
 * @returns {Object} Controller interface with animation state and functions
 */
export const useAnimationController = (
  activeTab,
  savedResultsSectionRef,
  setActiveTab,
  setSortBy,
  ensureRunningTasksVisible,
  onUsersWithEmailsClick,
  onTotalRecordsClick
) => {
  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0, active: false });
  const [tiltStyle, setTiltStyle] = useState({ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)' });
  const [recordsRipplePosition, setRecordsRipplePosition] = useState({ x: 0, y: 0, active: false });
  const [recordsTiltStyle, setRecordsTiltStyle] = useState({ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)' });
  const [runningRipplePosition, setRunningRipplePosition] = useState({ x: 0, y: 0, active: false });
  const [runningTiltStyle, setRunningTiltStyle] = useState({ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)' });
  const [usersWithEmailsRipplePosition, setUsersWithEmailsRipplePosition] = useState({ x: 0, y: 0, active: false });
  const [usersWithEmailsTiltStyle, setUsersWithEmailsTiltStyle] = useState({ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)' });
  const [showTrail, setShowTrail] = useState(false);
  const [clickedBoxRef, setClickedBoxRef] = useState(null);
  const [savedResultsHighlight, setSavedResultsHighlight] = useState(false);

  // Refs for stat boxes
  const totalTasksBoxRef = useRef(null);
  const totalRecordsBoxRef = useRef(null);
  const runningTasksBoxRef = useRef(null);
  const usersWithEmailsBoxRef = useRef(null);
  const trailAnimationRef = useRef(null);

  /**
   * Easing function: easeOutExpo
   * @param {number} t - Progress (0-1)
   * @returns {number} Eased value
   */
  const easeOutExpo = (t) => {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  };

  /**
   * Initiate scroll animation to saved results section
   */
  const initiateScrollAnimation = () => {
    // Start trail animation
    setShowTrail(true);

    // Smooth scroll with easeOutExpo and motion blur
    const targetElement = savedResultsSectionRef?.current;
    if (!targetElement) return;
    
    const targetRect = targetElement.getBoundingClientRect();
    const targetPosition = targetRect.top + window.pageYOffset - 100; // 100px offset
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 1500; // 1.5 seconds
    let startTime = null;

    // Apply motion blur during scroll
    document.body.style.filter = 'blur(0.5px)';
    document.body.style.transition = 'filter 0.3s';

    const scrollAnimation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const eased = easeOutExpo(progress);

      window.scrollTo(0, startPosition + distance * eased);

      // Animate trail path in sync with scroll
      requestAnimationFrame(() => {
        const pathElement = document.querySelector('.trail-path');
        if (pathElement && pathElement.getTotalLength() > 0) {
          const pathLength = pathElement.getTotalLength();
          const offset = pathLength * (1 - eased);
          pathElement.style.strokeDashoffset = `${offset}`;
          pathElement.style.opacity = `${0.3 + eased * 0.5}`;
        }
      });

      if (progress < 1) {
        requestAnimationFrame(scrollAnimation);
      } else {
        // Remove motion blur
        document.body.style.filter = 'blur(0px)';
        
        // Spotlight highlight glow pulse
        setSavedResultsHighlight(true);
        
        // Breathing illumination effect for 2 seconds
        setTimeout(() => {
          // Attention lock micro-shake animation
          const shakeElement = savedResultsSectionRef?.current;
          if (shakeElement) {
            shakeElement.style.animation = 'microShake 0.5s ease-in-out';
            setTimeout(() => {
              shakeElement.style.animation = '';
            }, 500);
          }
        }, 2000);

        // Clean up trail
        setTimeout(() => {
          setShowTrail(false);
          setClickedBoxRef(null);
          setIsAnimating(false);
        }, 2500);
      }
    };

    requestAnimationFrame(scrollAnimation);
  };

  /**
   * Initiate records scroll animation
   */
  const initiateRecordsScrollAnimation = () => {
    setShowTrail(true);

    const targetElement = savedResultsSectionRef?.current;
    if (!targetElement) return;

    const targetRect = targetElement.getBoundingClientRect();
    const targetPosition = targetRect.top + window.pageYOffset - 100;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 1500;
    let startTime = null;

    document.body.style.filter = 'blur(0.5px)';
    document.body.style.transition = 'filter 0.3s';

    const scrollAnimation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const eased = easeOutExpo(progress);

      window.scrollTo(0, startPosition + distance * eased);

      requestAnimationFrame(() => {
        const pathElement = document.querySelector('.trail-path');
        if (pathElement && pathElement.getTotalLength() > 0) {
          const pathLength = pathElement.getTotalLength();
          const offset = pathLength * (1 - eased);
          pathElement.style.strokeDashoffset = `${offset}`;
          pathElement.style.opacity = `${0.3 + eased * 0.5}`;
        }
      });

      if (progress < 1) {
        requestAnimationFrame(scrollAnimation);
      } else {
        document.body.style.filter = 'blur(0px)';
        setSavedResultsHighlight(true);

        setTimeout(() => {
          const shakeElement = savedResultsSectionRef?.current;
          if (shakeElement) {
            shakeElement.style.animation = 'microShake 0.5s ease-in-out';
            setTimeout(() => {
              shakeElement.style.animation = '';
            }, 500);
          }
        }, 2000);

        setTimeout(() => {
          setShowTrail(false);
          setClickedBoxRef(null);
          setIsAnimating(false);
        }, 2500);
      }
    };

    requestAnimationFrame(scrollAnimation);
  };

  /**
   * Handle Total Tasks box click
   * @param {Event} e - Click event
   */
  const handleTotalTasksClick = (e) => {
    if (isAnimating) return;

    setIsAnimating(true);
    setClickedBoxRef(totalTasksBoxRef);
    const box = totalTasksBoxRef.current;
    if (!box) {
      setIsAnimating(false);
      return;
    }

    // Get click position relative to box
    const rect = box.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Micro-interaction press animation
    box.style.transform = 'scale(0.96)';
    setTimeout(() => {
      box.style.transform = 'scale(1.0)';
      box.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }, 100);

    // Soft glass glow highlight ripple
    setRipplePosition({ x, y, active: true });
    setTimeout(() => {
      setRipplePosition(prev => ({ ...prev, active: false }));
    }, 600);

    // Switch to saved tab if not already
    if (activeTab !== 'saved') {
      setActiveTab('saved');
      setTimeout(() => {
        if (savedResultsSectionRef?.current) {
          initiateScrollAnimation();
        } else {
          console.warn('Saved results section ref not found after tab switch');
          setIsAnimating(false);
        }
      }, 300);
    } else {
      setTimeout(() => {
        if (savedResultsSectionRef?.current) {
          initiateScrollAnimation();
        } else {
          console.warn('Saved results section ref not found');
          setIsAnimating(false);
        }
      }, 50);
    }
  };

  /**
   * Handle Total Records box click
   * @param {Event} e - Click event
   */
  const handleTotalRecordsClick = (e) => {
    if (isAnimating) return;

    const box = totalRecordsBoxRef.current;
    if (!box) {
      return;
    }

    const rect = box.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    box.style.transform = 'scale(0.96)';
    setTimeout(() => {
      box.style.transform = 'scale(1.0)';
      box.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }, 100);

    setRecordsRipplePosition({ x, y, active: true });
    setTimeout(() => {
      setRecordsRipplePosition(prev => ({ ...prev, active: false }));
    }, 600);

    // Call the callback to open the modal
    if (onTotalRecordsClick) {
      onTotalRecordsClick();
    }
  };

  /**
   * Handle Running Tasks box click
   * @param {Event} e - Click event
   */
  const handleRunningTasksClick = (e) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const box = runningTasksBoxRef.current;
    if (!box) {
      setIsAnimating(false);
      return;
    }

    const rect = box.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Micro-interaction: slightly stronger warp effect for live data
    box.style.transform = 'scale(0.94) rotateX(2deg)';
    setTimeout(() => {
      box.style.transform = 'scale(1.02) rotateX(0deg)';
      box.style.transition = 'transform 0.22s cubic-bezier(0.25, 1.1, 0.5, 1)';
    }, 80);
    setTimeout(() => {
      box.style.transform = 'scale(1.0)';
      box.style.transition = 'transform 0.28s ease-out';
    }, 220);

    // Emerald ripple
    setRunningRipplePosition({ x, y, active: true });
    setTimeout(() => {
      setRunningRipplePosition(prev => ({ ...prev, active: false }));
    }, 550);

    // Immediately focus Saved tab and Processing filter
    setSortBy('processing');
    if (activeTab !== 'saved') {
      setActiveTab('saved');
    }

    setTimeout(() => {
      if (savedResultsSectionRef?.current) {
        initiateScrollAnimation();
        setTimeout(() => {
          try {
            ensureRunningTasksVisible?.();
          } catch (e) {
            // Best-effort; don't break animation
          }
        }, 900);
      } else {
        console.warn('Saved results section ref not found for running tasks click');
        setIsAnimating(false);
      }
    }, 260);
  };

  /**
   * Handle Total Tasks mouse move (3D parallax tilt)
   * @param {Event} e - Mouse move event
   */
  const handleTotalTasksMouseMove = (e) => {
    if (isAnimating || !totalTasksBoxRef.current) return;
    
    const box = totalTasksBoxRef.current;
    const rect = box.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg tilt
    const rotateY = ((x - centerX) / centerX) * 10;
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`,
      transition: 'transform 0.1s ease-out'
    });
  };

  /**
   * Handle Total Tasks mouse leave
   */
  const handleTotalTasksMouseLeave = () => {
    if (isAnimating) return;
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s ease-out'
    });
  };

  /**
   * Handle Total Records mouse move (3D parallax tilt)
   * @param {Event} e - Mouse move event
   */
  const handleTotalRecordsMouseMove = (e) => {
    if (isAnimating || !totalRecordsBoxRef.current) return;

    const box = totalRecordsBoxRef.current;
    const rect = box.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    setRecordsTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`,
      transition: 'transform 0.1s ease-out'
    });
  };

  /**
   * Handle Total Records mouse leave
   */
  const handleTotalRecordsMouseLeave = () => {
    if (isAnimating) return;
    setRecordsTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s ease-out'
    });
  };

  /**
   * Handle Running Tasks mouse move (3D parallax tilt)
   * @param {Event} e - Mouse move event
   */
  const handleRunningTasksMouseMove = (e) => {
    if (isAnimating || !runningTasksBoxRef.current) return;
    
    const box = runningTasksBoxRef.current;
    const rect = box.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -8; // Slightly softer tilt
    const rotateY = ((x - centerX) / centerX) * 8;
    
    setRunningTiltStyle({
      transform: `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`,
      transition: 'transform 0.09s ease-out'
    });
  };

  /**
   * Handle Running Tasks mouse leave
   */
  const handleRunningTasksMouseLeave = () => {
    if (isAnimating) return;
    setRunningTiltStyle({
      transform: 'perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.4s ease-out'
    });
  };

  /**
   * Handle Users with Emails box click
   * @param {Event} e - Click event
   */
  const handleUsersWithEmailsClick = (e) => {
    if (isAnimating) return;

    const box = usersWithEmailsBoxRef.current;
    if (!box) return;

    const rect = box.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Micro-interaction press animation
    box.style.transform = 'scale(0.96)';
    setTimeout(() => {
      box.style.transform = 'scale(1.0)';
      box.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }, 100);

    // Indigo ripple effect
    setUsersWithEmailsRipplePosition({ x, y, active: true });
    setTimeout(() => {
      setUsersWithEmailsRipplePosition(prev => ({ ...prev, active: false }));
    }, 600);

    // Call the callback to open the modal
    if (onUsersWithEmailsClick) {
      onUsersWithEmailsClick();
    }
  };

  /**
   * Handle Users with Emails mouse move (3D parallax tilt)
   * @param {Event} e - Mouse move event
   */
  const handleUsersWithEmailsMouseMove = (e) => {
    if (isAnimating || !usersWithEmailsBoxRef.current) return;

    const box = usersWithEmailsBoxRef.current;
    const rect = box.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    setUsersWithEmailsTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`,
      transition: 'transform 0.1s ease-out'
    });
  };

  /**
   * Handle Users with Emails mouse leave
   */
  const handleUsersWithEmailsMouseLeave = () => {
    if (isAnimating) return;
    setUsersWithEmailsTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s ease-out'
    });
  };

  // Update trail path during scroll
  useEffect(() => {
    if (!showTrail) return;

    const updateTrailPath = () => {
      const startBox = clickedBoxRef?.current;
      const endBox = savedResultsSectionRef?.current;
      if (!startBox || !endBox) return;

      const startRect = startBox.getBoundingClientRect();
      const endRect = endBox.getBoundingClientRect();

      const startX = startRect.left + startRect.width / 2;
      const startY = startRect.top + startRect.height / 2;
      const endX = endRect.left + endRect.width / 2;
      const endY = endRect.top;

      // Create curved path
      const midX = (startX + endX) / 2;
      const midY = startY - Math.abs(endY - startY) * 0.3;

      const path = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
      
      requestAnimationFrame(() => {
        const pathElement = document.querySelector('.trail-path');
        if (pathElement) {
          pathElement.setAttribute('d', path);
          const pathLength = pathElement.getTotalLength();
          if (pathLength > 0) {
            pathElement.style.strokeDasharray = `${pathLength}`;
            pathElement.style.strokeDashoffset = `${pathLength}`;
          }
        }
      });
    };

    const timeout = setTimeout(updateTrailPath, 50);
    const interval = setInterval(updateTrailPath, 50);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [showTrail, activeTab, clickedBoxRef, savedResultsSectionRef]);

  // Clean up highlight after animation
  useEffect(() => {
    if (savedResultsHighlight) {
      const timer = setTimeout(() => {
        setSavedResultsHighlight(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [savedResultsHighlight]);

  // Return controller interface
  return {
    // State
    isAnimating,
    ripplePosition,
    tiltStyle,
    recordsRipplePosition,
    recordsTiltStyle,
    runningRipplePosition,
    runningTiltStyle,
    usersWithEmailsRipplePosition,
    usersWithEmailsTiltStyle,
    showTrail,
    savedResultsHighlight,
    
    // Refs
    totalTasksBoxRef,
    totalRecordsBoxRef,
    runningTasksBoxRef,
    usersWithEmailsBoxRef,
    clickedBoxRef,
    
    // Actions
    handleTotalTasksClick,
    handleTotalRecordsClick,
    handleRunningTasksClick,
    handleUsersWithEmailsClick,
    handleTotalTasksMouseMove,
    handleTotalTasksMouseLeave,
    handleTotalRecordsMouseMove,
    handleTotalRecordsMouseLeave,
    handleRunningTasksMouseMove,
    handleRunningTasksMouseLeave,
    handleUsersWithEmailsMouseMove,
    handleUsersWithEmailsMouseLeave,
    initiateScrollAnimation,
    initiateRecordsScrollAnimation
  };
};

