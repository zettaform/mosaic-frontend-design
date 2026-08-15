import React, { useState, useEffect, useRef, useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { hasAccess, SECTION_ROUTES } from '../config/rbac';

import SidebarLinkGroup from './SidebarLinkGroup';
import { Logo } from '../components/Logo';
import SidebarSection from '../components/SidebarSection';
import { sidebarNavigation } from '../config/sidebarNavigation';

function Sidebar({
  sidebarOpen,
  setSidebarOpen
}) {

  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  const { pathname } = location;

  // RBAC addition: Helper function to check if user has access to a route
  const canAccessRoute = (section, page) => {
    // Create a mock user for development when authentication is bypassed
    const mockUser = user || {
      email: 'dev@example.com',
      role: 'dev',
      permissions: {}
    };
    return hasAccess(mockUser, section, page);
  };

  // RBAC addition: Helper function to check if user has access to any page in a section
  const canAccessSection = (section) => {
    // Don't check permissions while loading
    if (loading) {
      return false;
    }

    // Create a mock user for development when authentication is bypassed
    const mockUser = user || {
      email: 'dev@example.com',
      role: 'dev',
      permissions: {}
    };

    const sectionRoutes = SECTION_ROUTES[section];
    if (!sectionRoutes) {
      return false;
    }

    // Check if user has access to any page in this section
    return Object.keys(sectionRoutes).some(page => hasAccess(mockUser, section, page));
  };

  const trigger = useRef(null);
  const sidebar = useRef(null);
  const scrollAnimationRef = useRef(null);

  const storedSidebarExpanded = localStorage.getItem('sidebar-expanded');
  const [sidebarExpanded, setSidebarExpanded] = useState(storedSidebarExpanded === null ? false : storedSidebarExpanded === 'true');
  const [guidedHighlightRoute, setGuidedHighlightRoute] = useState(null);
  const [magnetOffset, setMagnetOffset] = useState({ x: 0, y: 0 });
  const [sidebarAnimation, setSidebarAnimation] = useState(false);

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!sidebar.current || !trigger.current) return;
      if (!sidebarOpen || sidebar.current.contains(target) || trigger.current.contains(target)) return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  useEffect(() => {
    localStorage.setItem('sidebar-expanded', sidebarExpanded);
    if (sidebarExpanded) {
      document.querySelector('body').classList.add('sidebar-expanded');
    } else {
      document.querySelector('body').classList.remove('sidebar-expanded');
    }
  }, [sidebarExpanded]);

  // Guided tour integrations
  useEffect(() => {
    const handleHighlight = (event) => {
      setGuidedHighlightRoute(event?.detail?.route || null);
      if (event?.detail?.route) {
        setTimeout(() => setGuidedHighlightRoute(null), 6000);
      }
    };

    const handleSidebarOpen = (event) => {
      setSidebarOpen(true);
      setSidebarAnimation(true);
      setTimeout(() => setSidebarAnimation(false), 500);
    };

    const handlePointer = (event) => {
      if (guidedHighlightRoute) {
        setMagnetOffset({ x: event.clientX, y: event.clientY });
      }
    };

    window.addEventListener('guided-tour-highlight', handleHighlight);
    window.addEventListener('guided-tour-sidebar-open', handleSidebarOpen);
    window.addEventListener('pointermove', handlePointer);

    return () => {
      window.removeEventListener('guided-tour-highlight', handleHighlight);
      window.removeEventListener('guided-tour-sidebar-open', handleSidebarOpen);
      window.removeEventListener('pointermove', handlePointer);
    };
  }, [setSidebarOpen, setSidebarExpanded]);

  // Smooth scroll to highlighted item (e.g. Admin Tasks) over 2 seconds
  useEffect(() => {
    if (!guidedHighlightRoute || !sidebar.current) {
      return;
    }

    const targetElement = sidebar.current.querySelector(`[data-route="${guidedHighlightRoute}"]`);
    if (!targetElement) {
      return;
    }

    const sidebarRect = sidebar.current.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const offsetTop = targetRect.top - sidebarRect.top - (sidebarRect.height / 2) + (targetRect.height / 2);

    const startPosition = sidebar.current.scrollTop;
    const endPosition = startPosition + offsetTop;
    const distance = endPosition - startPosition;
    const duration = 2000; // 2 seconds
    const startTime = performance.now();

    const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);

      sidebar.current.scrollTop = startPosition + (distance * easedProgress);

      if (progress < 1) {
        scrollAnimationRef.current = requestAnimationFrame(animateScroll);
      }
    };

    scrollAnimationRef.current = requestAnimationFrame(animateScroll);

    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }
    };
  }, [guidedHighlightRoute]);

  // Guided tour task click handler
  useEffect(() => {
    const handleTaskClick = (event) => {
      if (event?.detail?.taskId) {
        // Handle task click - could navigate or perform action
        console.log('Task clicked:', event.detail.taskId);
      }
    };

    window.addEventListener('guided-tour-task-click', handleTaskClick);
    return () => window.removeEventListener('guided-tour-task-click', handleTaskClick);
  }, []);

  // Prevent body scrolling during sidebar navigation
  useEffect(() => {
    const body = document.querySelector('body');
    if (pathname.includes('/admin') || pathname.includes('/settings')) {
      body.classList.add('sidebar-navigation');
    } else {
      body.classList.remove('sidebar-navigation');
    }

    return () => {
      body.classList.remove('sidebar-navigation');
    };
  }, [pathname]);

  return (
    <div className="min-w-fit">
      {/* Sidebar backdrop (mobile only) */}
      <div
        className={`fixed inset-0 bg-slate-900 bg-opacity-30 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <div
        id="sidebar"
        ref={sidebar}
        className={`flex flex-col absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 h-[100dvh] overflow-y-scroll lg:overflow-y-auto no-scrollbar w-64 lg:w-20 lg:sidebar-expanded:!w-64 2xl:!w-64 shrink-0 bg-slate-800 p-4 transition-all duration-200 ease-in-out sidebar-no-scroll sidebar-preserve-state sidebar-smooth sidebar-transition${
          sidebarAnimation ? ' guided-tour-sidebar-elastic' : ''
        } ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-64'
        }`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        style={{ scrollBehavior: 'auto' }}
      >
        {/* Sidebar header */}
        <div className="flex justify-between mb-10 pr-3 sm:px-2">
          {/* Close button */}
          <button
            ref={trigger}
            className="lg:hidden text-slate-500 hover:text-slate-400"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
          >
            <span className="sr-only">Close sidebar</span>
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.7 18.7l1.4-1.4L7.8 13H20v-2H7.8l4.3-4.3-1.4-1.4L4 12z" />
            </svg>
          </button>
          {/* Logo */}
          <Logo className="h-8 w-auto" linkTo="/" />
        </div>

        {/* Links */}
        <div className="space-y-8">
          {/* Pages group */}
          <div>
            <h3 className="text-xs uppercase text-slate-500 font-semibold pl-3">
              <span className="hidden lg:block lg:sidebar-expanded:hidden 2xl:hidden text-center w-6" aria-hidden="true">
                •••
              </span>
              <span className="lg:hidden lg:sidebar-expanded:block 2xl:block">Pages</span>
            </h3>
            <ul className="mt-3">
              {/* Render navigation sections from configuration */}
              {sidebarNavigation.map(section => (
                <SidebarSection
                  key={section.id}
                  title={section.title}
                  section={section.section}
                  items={section.items}
                  canAccessRoute={canAccessRoute}
                />
              ))}
            </ul>
          </div>

          {/* More group */}
          <div>
            <h3 className="text-xs uppercase text-slate-500 font-semibold pl-3">
              <span className="hidden lg:block lg:sidebar-expanded:hidden 2xl:hidden text-center w-6" aria-hidden="true">
                •••
              </span>
              <span className="lg:hidden lg:sidebar-expanded:block 2xl:block">More</span>
            </h3>
            <ul className="mt-3">
              {/* Additional sections can be added here by extending sidebarNavigation config */}
            </ul>
          </div>
        </div>

        {/* Expand / collapse button */}
        <div className="pt-3 hidden lg:inline-flex 2xl:hidden justify-end mt-auto">
          <div className="px-3 py-2">
            <button onClick={() => setSidebarExpanded(!sidebarExpanded)}>
              <span className="sr-only">Expand / collapse sidebar</span>
              <svg className="w-6 h-6 fill-current sidebar-expanded:rotate-180" viewBox="0 0 24 24">
                <path className="text-slate-400" d="M19.586 11l-5-5L16 4.586 23.414 12 16 19.414 14.586 18l5-5H7v-2z" />
                <path className="text-slate-600" d="M3 23H1V1h2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;