import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';
import { getFirstAccessibleRoute, hasAccess, ROUTE_TO_SECTION } from '../config/rbac';
import ModalBlank from '../components/ModalBlank';

import AuthImage from '../images/auth-image.jpg';
import AuthDecoration from '../images/auth-decoration.png';

function Signin() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);

  const { signin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Default to dashboard which is accessible to all authenticated users
  // Use /dashboard instead of / since / is the public Homepage
  const from = location.state?.from?.pathname || '/dashboard';

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const { success, error, user } = await signin({
        email: formData.email,
        password: formData.password,
      });
      
      if (success === true) {
        // Determine redirect destination based on user permissions
        // Default: go back to the page the user tried to access, or /dashboard
        let redirectTo = from;
        
        if (user) {
          // If the user has Admin Tasks access and is coming from the default dashboard,
          // prefer /admin/tasks as the landing page – but don't lock them there.
          const hasAdminTasksAccess = hasAccess(user, 'Admin', 'Tasks');
          const isDefaultFromDashboard = from === '/dashboard';

          if (hasAdminTasksAccess && isDefaultFromDashboard) {
            redirectTo = '/admin/tasks';
            console.log('ℹ️ RBAC: defaulting admin user to admin tasks page on first login');
          } else {
            // Check if the user has access to the page they were trying to access
            const routeInfo = ROUTE_TO_SECTION[from];
            const hasPermission = routeInfo ? hasAccess(user, routeInfo.section, routeInfo.page) : true;
            
            console.log('🔍 Signin redirect check:', {
              from,
              hasPermission,
              userRole: user.role,
              userPermissions: user.permissions,
              routeInfo
            });
            
            if (hasPermission) {
              // User has permission to access the requested page, use it
              redirectTo = from;
              console.log('✅ User has permission, using requested route:', redirectTo);
            } else {
              // User doesn't have permission, find first accessible route
              redirectTo = getFirstAccessibleRoute(user);
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
        setSubmitError(error || 'Failed to sign in. Please try again.');
      }
    } catch (error) {
      console.error('❌ Signin error:', error);
      setSubmitError(error.toString() || 'Failed to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <main className="bg-white dark:bg-slate-900">

      <div className="relative md:flex">

        {/* Content */}
        <div className="md:w-1/2">
          <div className="min-h-[100dvh] h-full flex flex-col after:flex-1">

            {/* Header */}
            <div className="flex-1">
              <div className="flex items-center justify-between p-6 lg:px-8">
                {/* Logo */}
                <Logo className="h-8 w-auto" linkTo="/" />
              </div>
            </div>

            <div className="max-w-sm mx-auto w-full px-4 py-8">
              <h1 className="text-3xl text-slate-800 dark:text-slate-100 font-bold mb-6">Sign in to your account</h1>
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-sm text-red-600 dark:bg-red-900/30 dark:border-red-900 dark:text-red-400 rounded-md p-4 mb-6" role="alert">
                  {submitError}
                </div>
              )}
              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="email">Email Address</label>
                    <input 
                      id="email" 
                      name="email"
                      className={`form-input w-full ${errors.email ? 'border-red-500' : ''}`} 
                      type="email" 
                      placeholder="Enter your email address"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
                    <input 
                      id="password" 
                      name="password"
                      className={`form-input w-full ${errors.password ? 'border-red-500' : ''}`} 
                      type="password" 
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <div className="mr-1">
                    <button
                      type="button"
                      className="text-sm underline hover:no-underline text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      onClick={(e) => { e.stopPropagation(); setForgotPasswordModalOpen(true); }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <button 
                    type="submit" 
                    className="btn bg-indigo-500 hover:bg-indigo-600 text-white ml-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                  </button>
                </div>
              </form>
              {/* Footer */}
              <div className="pt-5 mt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="text-sm">
                  Don’t you have an account? <Link className="font-medium text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400" to="/signup">Sign Up</Link>
                </div>
                {/* Warning */}
                <div className="mt-5">
                  <div className="bg-amber-100 dark:bg-amber-400/30 text-amber-600 dark:text-amber-400 px-3 py-2 rounded">
                    <svg className="inline w-3 h-3 shrink-0 fill-current mr-2" viewBox="0 0 12 12">
                      <path d="M10.28 1.28L3.989 7.575 1.695 5.28A1 1 0 00.28 6.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 1.28z" />
                    </svg>
                    <span className="text-sm">
                      There is a video guide for every function, watch all videos before verdict
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Image */}
        <div className="hidden md:block absolute top-0 bottom-0 right-0 md:w-1/2" aria-hidden="true">
          <img className="object-cover object-center w-full h-full" src={AuthImage} width="760" height="1024" alt="Authentication" />
          <img className="absolute top-1/4 left-0 -translate-x-1/2 ml-8 hidden lg:block" src={AuthDecoration} width="218" height="224" alt="Authentication decoration" />
        </div>

      </div>

      {/* Forgot Password Modal */}
      <ModalBlank id="forgot-password-modal" modalOpen={forgotPasswordModalOpen} setModalOpen={setForgotPasswordModalOpen}>
        <div className="p-5 flex space-x-4">
          {/* Icon */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-indigo-100 dark:bg-indigo-500/30">
            <svg className="w-4 h-4 shrink-0 fill-current text-indigo-500" viewBox="0 0 16 16">
              <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 12H7V7h2v5zM8 6c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z" />
            </svg>
          </div>
          {/* Content */}
          <div>
            {/* Modal header */}
            <div className="mb-2">
              <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">Reset Password</div>
            </div>
            {/* Modal content */}
            <div className="text-sm mb-10">
              <div className="space-y-2">
                <p>To reset your password, please contact our support team.</p>
                <p className="font-medium">
                  Email: <a href="mailto:support@mymailgram.com" className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300">support@mymailgram.com</a>
                </p>
              </div>
            </div>
            {/* Modal footer */}
            <div className="flex flex-wrap justify-end space-x-2">
              <button className="btn-sm border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300" onClick={(e) => { e.stopPropagation(); setForgotPasswordModalOpen(false); }}>Close</button>
            </div>
          </div>
        </div>
      </ModalBlank>

    </main>
  );
}

export default Signin;