import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ONBOARDING_CONFIG } from '../config/onboarding';
import { hasAccess, ROUTE_TO_SECTION, canAccessTablesSavedHub } from '../config/rbac';

// Define the onboarding flow steps and their corresponding routes
const ONBOARDING_STEPS = [
  { path: '/onboarding/1', step: 1 },
  { path: '/onboarding/2', step: 2 },
  { path: '/onboarding/3', step: 3 },
  { path: '/onboarding/complete', step: 'complete' }
];

const ProtectedRoute = ({ 
  children, 
  requireOnboarding = false,
  requireAuth = true,
  allowedRoles = []
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // Handle unauthenticated access
  if (requireAuth && !user) {
    // Redirect to signin, but save the current location to return to after login
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Handle role-based access control
  if (requireAuth && user && allowedRoles.length > 0) {
    const hasRequiredRole = user.roles?.some(role => allowedRoles.includes(role));
    if (!hasRequiredRole) {
      // Redirect to unauthorized or home if user doesn't have required role
      return <Navigate to="/" replace />;
    }
  }

  // RBAC addition: Check permissions for the current route
  // All protected routes must be in ROUTE_TO_SECTION and have proper permissions
  // Public routes (signin, signup, etc.) are handled separately and don't require auth
  if (requireAuth && user) {
    const adminExampleEmail = String(user?.email || '').trim().toLowerCase() === 'admin@example.com';

    // `ROUTE_TO_SECTION` stores base paths (e.g. `/ai-table`) but our actual routes may include dynamic params
    // (e.g. `/ai-table/someEncodedId`). Resolve to the closest base match.
    const routeInfo =
      ROUTE_TO_SECTION[currentPath] ||
      (() => {
        const candidates = Object.keys(ROUTE_TO_SECTION).filter((key) => currentPath.startsWith(`${key}/`));
        if (!candidates.length) return null;
        candidates.sort((a, b) => b.length - a.length); // longest base path wins
        return ROUTE_TO_SECTION[candidates[0]] || null;
      })();

    if (routeInfo) {
      // Route is in ROUTE_TO_SECTION - check permissions
      const { section, page } = routeInfo;
      const hasPermission =
        currentPath === '/saved-tables' || currentPath === '/ai-table'
          ? canAccessTablesSavedHub(user)
          : hasAccess(user, section, page);
      if (!hasPermission) {
        // User doesn't have permission to access this route
        console.log(`❌ Access denied: User ${user.email || user.user_id} (role: ${user.role}) attempted to access ${currentPath} (${section}/${page})`);

        // Explicit admin override for this known admin account.
        if (adminExampleEmail) return children;

        return <Navigate to="/unauthorized" replace />;
      }
    } else {
      // Route is NOT in ROUTE_TO_SECTION - deny access for security
      // Only allow public routes that don't require authentication
      const publicRoutes = ['/signin', '/signup', '/reset-password', '/', '/about', '/contact', '/pricing', '/unauthorized'];
      const isPublicRoute = publicRoutes.includes(currentPath) || currentPath.startsWith('/onboarding');
      
      if (!isPublicRoute) {
        // This is a protected route that's not in ROUTE_TO_SECTION - deny access
        console.log(`❌ Access denied: Route ${currentPath} is not in ROUTE_TO_SECTION and is not a public route`);

        // Explicit admin override for this known admin account.
        if (adminExampleEmail) return children;

        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  // Handle onboarding flow - controlled by configuration
  if (ONBOARDING_CONFIG.enabled && requireAuth && user) {
    const isOnboardingPage = currentPath.startsWith('/onboarding');
    const hasCompletedOnboarding = user.onboarding_completed;
    
    // If user hasn't completed onboarding and is not on an onboarding page, redirect to onboarding
    if (!hasCompletedOnboarding && !isOnboardingPage) {
      return <Navigate to="/onboarding" replace />;
    }
    
    // If user has completed onboarding and is on an onboarding page, redirect to dashboard
    if (hasCompletedOnboarding && isOnboardingPage) {
      return <Navigate to="/dashboard" replace />;
    }
    
    // For onboarding pages, allow access if user is authenticated and hasn't completed onboarding
    if (requireOnboarding && isOnboardingPage && !hasCompletedOnboarding) {
      return children;
    }
  }

  return children;
};

export default ProtectedRoute;
