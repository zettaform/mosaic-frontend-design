import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';
import { getFirstAccessibleRoute, hasAccess, ROUTE_TO_SECTION } from '../config/rbac';

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [signupEnabled, setSignupEnabled] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  /** Enterprise: OAuth buttons are unavailable; show notice modal on click ('google' | 'github'). */
  const [oauthNotice, setOauthNotice] = useState(null);

  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Default to dashboard which is accessible to all authenticated users
  // Use /dashboard instead of / since / is the public Homepage
  const from = location.state?.from?.pathname || '/dashboard';

  // Check if signups are enabled
  useEffect(() => {
    const checkSignupSettings = async () => {
      try {
        // Signup settings are enforced server-side by /api/auth/register.
        // We keep the UI optimistic; if signup is disabled the register endpoint returns 403.
        setSignupEnabled(true);
      } catch (err) {
        console.error('Error checking signup settings:', err);
        // Default to enabled if check fails
        setSignupEnabled(true);
      } finally {
        setLoadingSettings(false);
      }
    };

    checkSignupSettings();
  }, []);

  useEffect(() => {
    if (!oauthNotice) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOauthNotice(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [oauthNotice]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!signupEnabled) {
      setSubmitError('Signups are currently disabled. Please contact support for assistance.');
      return;
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        // Determine redirect destination based on user permissions
        // Default: go back to the page the user tried to access, or /dashboard
        let redirectTo = from;

        if (result.user) {
          // If the user has Admin Tasks access and is coming from the default dashboard,
          // prefer /admin/tasks as the landing page – but don't lock them there.
          const hasAdminTasksAccess = hasAccess(result.user, 'Admin', 'Tasks');
          const isDefaultFromDashboard = from === '/dashboard';

          if (hasAdminTasksAccess && isDefaultFromDashboard) {
            redirectTo = '/admin/tasks';
            console.log('ℹ️ RBAC: defaulting admin user to admin tasks page on first signup');
          } else {
            // Check if the user has access to the page they were trying to access
            const routeInfo = ROUTE_TO_SECTION[from];
            const hasPermission = routeInfo ? hasAccess(result.user, routeInfo.section, routeInfo.page) : true;

            console.log('🔍 Signup redirect check:', {
              from,
              hasPermission,
              userRole: result.user.role,
              userPermissions: result.user.permissions,
              routeInfo
            });

            if (hasPermission) {
              // User has permission to access the requested page, use it
              redirectTo = from;
              console.log('✅ User has permission, using requested route:', redirectTo);
            } else {
              // User doesn't have permission, find first accessible route
              redirectTo = getFirstAccessibleRoute(result.user);
              console.log('📍 User lacks permission, first accessible route:', redirectTo);
            }
          }
        } else {
          // Fallback if user object is not available
          redirectTo = '/dashboard';
        }

        console.log('🚀 Navigating to:', redirectTo);
        navigate(redirectTo, { replace: true });
      } else {
        setSubmitError(result.error || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setSubmitError('An error occurred during signup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const oauthNoticeCopy =
    oauthNotice === 'google'
      ? {
          title: 'Google sign-up unavailable',
          body: 'Google signups are not allowed at this time. Continue to signup by entering your email.',
        }
      : oauthNotice === 'github'
        ? {
            title: 'GitHub sign-up unavailable',
            body: 'GitHub signups are not allowed at this time. Continue to signup by entering your email.',
          }
        : null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      {oauthNotice && oauthNoticeCopy && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="oauth-notice-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setOauthNotice(null)}
            aria-label="Dismiss"
          />
          <div className="relative w-full max-w-md rounded-lg border border-white/10 bg-gray-800/95 px-5 py-5 shadow-xl outline -outline-offset-1 outline-white/10 sm:px-6">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 id="oauth-notice-title" className="text-sm font-semibold text-white">
                  {oauthNoticeCopy.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-gray-300">{oauthNoticeCopy.body}</p>
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setOauthNotice(null)}
                    className="rounded-md bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex shrink-0 items-center p-6 lg:px-8">
        <Logo className="h-8 w-auto" linkTo="/" />
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-6 lg:px-8">
        <div className="mx-auto w-full max-w-lg">
          <h2 className="text-center text-lg font-bold tracking-tight text-white mb-4">Create your account</h2>
        </div>

        <div className="mx-auto w-full max-w-lg">
          <div className="bg-gray-800/50 px-6 py-6 outline -outline-offset-1 outline-white/10 sm:rounded-lg sm:px-8">
          {submitError && (
            <div className="mb-4 bg-rose-900/30 text-rose-400 text-xs p-3 rounded border border-rose-800">
              {submitError}
            </div>
          )}

          {!loadingSettings && !signupEnabled && (
            <div className="mb-4 bg-amber-900/30 text-amber-400 text-xs p-3 rounded border border-amber-800">
              Sign ups are currently disabled. For more help, please contact{' '}
              <Link to="/contact" className="font-medium text-indigo-400 hover:text-indigo-300 underline">
                support
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-white">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`block w-full rounded-md bg-white/5 px-3 py-1.5 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 ${errors.name ? 'outline-rose-500' : ''}`}
                />
              </div>
              {errors.name && <p className="mt-0.5 text-xs text-rose-400">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-white">
                Email address <span className="text-rose-400">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full rounded-md bg-white/5 px-3 py-1.5 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 ${errors.email ? 'outline-rose-500' : ''}`}
                />
              </div>
              {errors.email && <p className="mt-0.5 text-xs text-rose-400">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-white">
                Password <span className="text-rose-400">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full rounded-md bg-white/5 px-3 py-1.5 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 ${errors.password ? 'outline-rose-500' : ''}`}
                />
              </div>
              {errors.password && <p className="mt-0.5 text-xs text-rose-400">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-white">
                Confirm Password <span className="text-rose-400">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full rounded-md bg-white/5 px-3 py-1.5 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 ${errors.confirmPassword ? 'outline-rose-500' : ''}`}
                />
              </div>
              {errors.confirmPassword && <p className="mt-0.5 text-xs text-rose-400">{errors.confirmPassword}</p>}
            </div>

            <div className="flex items-start">
              <div className="flex h-4 shrink-0 items-center">
                <div className="group grid size-3.5 grid-cols-1">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    className="col-start-1 row-start-1 appearance-none rounded-sm border border-white/10 bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  />
                  <svg
                    fill="none"
                    viewBox="0 0 14 14"
                    className="pointer-events-none col-start-1 row-start-1 size-3 self-center justify-self-center stroke-white"
                  >
                    <path
                      d="M3 8L6 11L11 3.5"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={formData.acceptTerms ? 'opacity-100' : 'opacity-0'}
                    />
                  </svg>
                </div>
              </div>
              <label htmlFor="acceptTerms" className="ml-2 block text-xs text-white leading-tight">
                I agree to the{' '}
                <Link to="/terms-of-service" className="font-semibold text-indigo-400 hover:text-indigo-300">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy-policy" className="font-semibold text-indigo-400 hover:text-indigo-300">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.acceptTerms && <p className="text-xs text-rose-400">{errors.acceptTerms}</p>}

            <div>
              <button
                type="submit"
                disabled={isSubmitting || !signupEnabled || loadingSettings}
                className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Signing Up...' : loadingSettings ? 'Loading...' : 'Sign Up'}
              </button>
            </div>
          </form>

          <div>
            <div className="mt-4 flex items-center gap-x-3">
              <div className="w-full flex-1 border-t border-white/10" />
              <p className="text-xs font-medium text-nowrap text-white">Or continue with</p>
              <div className="w-full flex-1 border-t border-white/10" />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOauthNotice('google')}
                aria-label="Google sign-up is unavailable. Press for details, or use email to sign up."
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white opacity-60 inset-ring inset-ring-white/5 hover:bg-white/15 hover:opacity-90 focus-visible:inset-ring-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                  <path
                    d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                    fill="#EA4335"
                  />
                  <path
                    d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                    fill="#34A853"
                  />
                </svg>
                <span className="text-xs font-semibold">Google</span>
              </button>

              <button
                type="button"
                onClick={() => setOauthNotice('github')}
                aria-label="GitHub sign-up is unavailable. Press for details, or use email to sign up."
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white opacity-60 inset-ring inset-ring-white/5 hover:bg-white/15 hover:opacity-90 focus-visible:inset-ring-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                <svg fill="currentColor" viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-white">
                  <path
                    d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                    clipRule="evenodd"
                    fillRule="evenodd"
                  />
                </svg>
                <span className="text-xs font-semibold">GitHub</span>
              </button>
            </div>
          </div>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            Already have an account?{' '}
            <Link 
              to="/signin" 
              state={{ from: location.state?.from }}
              className="font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;